import { useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCliente, usePolizasPorCliente, useVehiculosPorCliente } from "../hooks/clientes";
import { useCobrosPorPoliza, useEliminarCicloPoliza } from "../hooks/polizas";
import { useHistorialCobros } from "../hooks/cobranzas";
import { imprimirComprobante } from "../api/cobros";
import { Cargando, VacioState, ErrorState } from "../components/ui/States";
import Modal from "../components/ui/Modal";
import { useAuth } from "../auth/AuthContext";
import { formatFecha, formatMoneda } from "../utils/format";
import { IconArrowLeft, IconFile } from "../components/Icons";
import type { Cobro } from "../types";

function estadoCuota(c: Cobro): { label: string; bg: string; fg: string } {
  if (c.estado === 1) return { label: "Pagada", bg: "var(--ok-100)", fg: "var(--ok-700)" };
  const venc = (c.fechaVencimiento ?? "").slice(0, 10);
  const hoy = new Date().toISOString().slice(0, 10);
  if (c.estado === 2 || (venc && venc < hoy)) return { label: "No pagada", bg: "var(--bad-100)", fg: "var(--bad-700)" };
  return { label: "Pendiente", bg: "var(--warn-100)", fg: "var(--warn-700)" };
}

/** "Cuotas y pago": por cliente, lista de pólizas → cuotas agrupadas por ciclo (refacturaciones). */
export default function CuotasYPago() {
  const { id } = useParams();
  const clienteId = Number(id);
  const navigate = useNavigate();

  const { esSuperAdmin } = useAuth();
  const { data: cliente } = useCliente(clienteId);
  const polizas = usePolizasPorCliente(clienteId);
  const vehiculos = useVehiculosPorCliente(clienteId);

  const lista = polizas.data?.items ?? [];
  const [sel, setSel] = useState<number | undefined>(undefined);
  const selId = sel ?? lista[0]?.id;
  const polizaSel = lista.find((p) => p.id === selId);

  const cobros = useCobrosPorPoliza(selId ?? 0);
  const cuotas = cobros.data ?? [];
  const historial = useHistorialCobros(selId ?? 0);

  // Eliminación de ciclos (sólo SuperAdmin; confirmación escribiendo "Eliminar").
  const eliminarCiclo = useEliminarCicloPoliza(selId ?? 0);
  const [cicloAEliminar, setCicloAEliminar] = useState<number | null>(null);
  const [confirmacion, setConfirmacion] = useState("");
  const [errorEliminar, setErrorEliminar] = useState<string>();

  function abrirEliminar(ciclo: number) {
    setCicloAEliminar(ciclo);
    setConfirmacion("");
    setErrorEliminar(undefined);
  }
  function cerrarEliminar() {
    if (eliminarCiclo.isPending) return;
    setCicloAEliminar(null);
    setConfirmacion("");
    setErrorEliminar(undefined);
  }
  async function confirmarEliminar() {
    if (cicloAEliminar == null || confirmacion.trim() !== "Eliminar") return;
    setErrorEliminar(undefined);
    try {
      await eliminarCiclo.mutateAsync(cicloAEliminar);
      // Cierre directo: al volver de la mutación isPending todavía puede ser true.
      setCicloAEliminar(null);
      setConfirmacion("");
      setErrorEliminar(undefined);
    } catch (e: any) {
      setErrorEliminar(e?.response?.data?.error ?? "No se pudo eliminar el ciclo.");
    }
  }

  // Agrupa las cuotas por ciclo (1 = original; 2,3… = refacturación).
  const porCiclo = new Map<number, Cobro[]>();
  cuotas.forEach((c) => {
    const k = c.ciclo ?? 1;
    if (!porCiclo.has(k)) porCiclo.set(k, []);
    porCiclo.get(k)!.push(c);
  });
  const grupos = [...porCiclo.entries()].sort((a, b) => a[0] - b[0]);
  const filasEliminar = cicloAEliminar != null ? grupos.find(([c]) => c === cicloAEliminar)?.[1] ?? [] : [];

  const patenteDe = (vehiculoId?: number | null, patente?: string | null) =>
    patente ?? vehiculos.data?.find((v) => v.id === vehiculoId)?.patente ?? "—";

  if (polizas.isLoading) return <Cargando />;
  if (polizas.isError) return <ErrorState mensaje="No se pudieron cargar las pólizas." />;

  return (
    <div>
      <button onClick={() => navigate(`/clientes/${clienteId}`)} style={backBtn}>
        <IconArrowLeft size={16} /> Volver a la ficha del cliente
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <IconFile size={20} />
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Cuotas y pago</h1>
      </div>
      <p style={{ color: "var(--ink-500)", fontSize: 14, margin: "0 0 18px" }}>
        {cliente?.nombre ?? "Cliente"} · seleccioná una póliza para ver sus cuotas.
      </p>
      <div style={{ margin: "-8px 0 18px", padding: "10px 14px", background: "var(--blue-50)", border: "1px solid var(--line)", borderRadius: 9, fontSize: 13, color: "var(--ink-700)" }}>
        Las cuotas ya generadas no se modifican al editar la póliza. Para cambiar el plan de pago usá <strong>Refacturar</strong> o <strong>Renovar</strong>.{esSuperAdmin ? " Como SuperAdmin podés eliminar un ciclo sin pagos con la confirmación correspondiente." : ""}
      </div>

      {lista.length === 0 ? (
        <VacioState mensaje="El cliente no tiene pólizas." />
      ) : (
        <>
          {/* Lista de pólizas del cliente */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {lista.map((p) => {
              const activa = p.id === selId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSel(p.id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 9,
                    border: "1.5px solid " + (activa ? "var(--navy-900)" : "var(--line)"),
                    background: activa ? "var(--blue-100)" : "var(--paper)",
                    color: activa ? "var(--navy-900)" : "var(--ink-700)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {p.numero} · {patenteDe(p.vehiculoId, p.patente)} · {p.estado}
                </button>
              );
            })}
          </div>

          {polizaSel && (
            <div style={{ marginBottom: 14, fontSize: 15, fontWeight: 600, color: "var(--ink-900)" }}>
              Poliza: {polizaSel.numero} - Patente:{patenteDe(polizaSel.vehiculoId, polizaSel.patente)}
            </div>
          )}

          {cobros.isLoading ? (
            <Cargando />
          ) : cuotas.length === 0 ? (
            <VacioState mensaje="La póliza no tiene cuotas cargadas." />
          ) : (
            grupos.map(([ciclo, filas], idx) => {
              const tipo = filas[0]?.cicloTipo;
              const descripcion = filas[0]?.cicloDescripcion;
              return (
              <div key={ciclo} style={{ marginBottom: 22 }}>
                {idx > 0 && (
                  <div style={{ margin: "6px 0 10px", height: 1, background: "var(--line)" }} />
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 2 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--navy-900)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Ciclo {ciclo} · {tipoCicloLabel(tipo)}
                  </div>
                  {esSuperAdmin && ciclo > 1 && grupos.length > 1 && !filas.some((c) => c.estado === 1) && (
                    <button onClick={() => abrirEliminar(ciclo)} style={deleteCycleBtn}>
                      Eliminar ciclo
                    </button>
                  )}
                </div>
                {descripcion && (
                  <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 4 }}>{descripcion}</div>
                )}
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                  Poliza: {polizaSel?.numero}
                </div>
                <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>Nro cuota</th>
                        <th style={th}>Vencimiento</th>
                        <th style={th}>Importe</th>
                        <th style={th}>Estado</th>
                        <th style={th}>Fecha pago</th>
                        <th style={{ ...th, textAlign: "right" }}>Recibo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...filas].sort((a, b) => a.numeroCuota - b.numeroCuota).map((c) => {
                        const est = estadoCuota(c);
                        const pagada = c.estado === 1;
                        return (
                          <tr key={c.id} style={{ borderTop: "1px solid var(--line-2)" }}>
                            <td style={{ ...td, fontWeight: 600 }}>{c.numeroCuota}</td>
                            <td style={td}>{formatFecha(c.fechaVencimiento)}</td>
                            <td style={td}>{formatMoneda(c.monto)}</td>
                            <td style={td}>
                              <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: est.bg, color: est.fg }}>{est.label}</span>
                            </td>
                            <td style={{ ...td, color: "var(--ink-500)" }}>{c.fechaPago ? formatFecha(c.fechaPago) : "—"}</td>
                            <td style={{ ...td, textAlign: "right" }}>
                              {pagada && (
                                <button onClick={() => imprimirComprobante(c.id)} style={printBtn}>
                                  Imprimir
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              );
            })
          )}

          {historial.data && historial.data.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--navy-900)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                Historial de pagos
              </div>
              <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={th}>Fecha evento</th>
                      <th style={th}>Ciclo / cuota</th>
                      <th style={th}>Movimiento</th>
                      <th style={th}>Importe</th>
                      <th style={th}>Medio</th>
                      <th style={th}>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.data.map((e) => (
                      <tr key={e.id} style={{ borderTop: "1px solid var(--line-2)" }}>
                        <td style={td}>{formatFecha(e.fechaEvento)}</td>
                        <td style={td}>Ciclo {e.ciclo} · cuota {e.numeroCuota}</td>
                        <td style={td}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                            background: e.tipo === "Pago" ? "var(--ok-100)" : "var(--bad-100)",
                            color: e.tipo === "Pago" ? "var(--ok-700)" : "var(--bad-700)",
                          }}>
                            {e.tipo === "Pago" ? "Pago" : "Anulación"}
                          </span>
                        </td>
                        <td style={td}>{e.monto != null ? formatMoneda(e.monto) : "—"}</td>
                        <td style={td}>
                          {e.metodo}
                          {e.metodo2 ? ` + ${e.metodo2}${e.metodoPago2Monto != null ? ` (${formatMoneda(e.metodoPago2Monto)})` : ""}` : ""}
                        </td>
                        <td style={{ ...td, color: "var(--ink-500)" }}>{e.usuarioNombre ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {cicloAEliminar != null && (
        <Modal titulo={`Eliminar Ciclo ${cicloAEliminar}`} onClose={cerrarEliminar} ancho={540}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--bad-100)", border: "1px solid var(--bad-200)", color: "var(--bad-700)", fontSize: 13 }}>
              Esta acción elimina definitivamente las cuotas del ciclo y queda registrada en Movimientos.
              No revierte las fechas de vigencia de la póliza.
            </div>

            {filasEliminar.length > 0 && (
              <div style={{ fontSize: 13, color: "var(--ink-700)" }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  {tipoCicloLabel(filasEliminar[0]?.cicloTipo)}
                  {filasEliminar[0]?.cicloDescripcion ? ` · ${filasEliminar[0].cicloDescripcion}` : ""}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {[...filasEliminar].sort((a, b) => a.numeroCuota - b.numeroCuota).map((c) => (
                    <li key={c.id}>
                      Cuota {c.numeroCuota}: vence {formatFecha(c.fechaVencimiento)} · {formatMoneda(c.monto)} · {estadoCuota(c).label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Escribí <strong>Eliminar</strong> para confirmar
              </label>
              <input
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                placeholder="Eliminar"
                autoFocus
                style={{ width: "100%", height: 42, padding: "0 12px", borderRadius: 9, border: "1.5px solid var(--line)", fontSize: 14, outline: "none" }}
              />
            </div>

            {errorEliminar && (
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bad-100)", color: "var(--bad-700)", fontSize: 13 }}>
                {errorEliminar}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={cerrarEliminar} disabled={eliminarCiclo.isPending} style={cancelBtn}>Cancelar</button>
              <button
                onClick={confirmarEliminar}
                disabled={confirmacion.trim() !== "Eliminar" || eliminarCiclo.isPending}
                style={{ ...dangerBtn, opacity: confirmacion.trim() === "Eliminar" && !eliminarCiclo.isPending ? 1 : 0.55 }}
              >
                {eliminarCiclo.isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function tipoCicloLabel(tipo?: string | null) {
  switch (tipo) {
    case "Original": return "Original";
    case "Refacturacion": return "Refacturación";
    case "ModificacionPeriodo": return "Modificación de período";
    case "Renovacion": return "Renovación";
    default: return "Cuotas";
  }
}

const backBtn: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, border: 0, background: "transparent", color: "var(--ink-500)", cursor: "pointer", fontSize: 13.5, marginTop: 14, marginBottom: 14, padding: 0 };
const th: CSSProperties = { textAlign: "left", padding: "11px 16px", fontSize: 11.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-500)", background: "var(--canvas)", whiteSpace: "nowrap" };
const td: CSSProperties = { padding: "12px 16px", fontSize: 13.5, color: "var(--ink-900)" };
const printBtn: CSSProperties = { height: 30, padding: "0 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const deleteCycleBtn: CSSProperties = { height: 28, padding: "0 10px", borderRadius: 7, border: "1px solid var(--bad-200)", background: "var(--bad-100)", color: "var(--bad-700)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", textTransform: "none", letterSpacing: 0 };
const cancelBtn: CSSProperties = { height: 40, padding: "0 16px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" };
const dangerBtn: CSSProperties = { height: 40, padding: "0 16px", borderRadius: 9, border: 0, background: "var(--bad-600)", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer" };
