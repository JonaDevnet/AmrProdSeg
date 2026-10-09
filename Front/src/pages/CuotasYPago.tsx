import { useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCliente, usePolizasPorCliente, useVehiculosPorCliente } from "../hooks/clientes";
import { useCobrosPorPoliza } from "../hooks/polizas";
import { imprimirComprobante } from "../api/cobros";
import { Cargando, VacioState, ErrorState } from "../components/ui/States";
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

  const { data: cliente } = useCliente(clienteId);
  const polizas = usePolizasPorCliente(clienteId);
  const vehiculos = useVehiculosPorCliente(clienteId);

  const lista = polizas.data?.items ?? [];
  const [sel, setSel] = useState<number | undefined>(undefined);
  const selId = sel ?? lista[0]?.id;
  const polizaSel = lista.find((p) => p.id === selId);

  const cobros = useCobrosPorPoliza(selId ?? 0);
  const cuotas = cobros.data ?? [];

  // Agrupa las cuotas por ciclo (1 = original; 2,3… = refacturación).
  const porCiclo = new Map<number, Cobro[]>();
  cuotas.forEach((c) => {
    const k = c.ciclo ?? 1;
    if (!porCiclo.has(k)) porCiclo.set(k, []);
    porCiclo.get(k)!.push(c);
  });
  const grupos = [...porCiclo.entries()].sort((a, b) => a[0] - b[0]);

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
            grupos.map(([ciclo, filas], idx) => (
              <div key={ciclo} style={{ marginBottom: 22 }}>
                {idx > 0 && (
                  <div style={{ margin: "6px 0 10px", fontSize: 13.5, fontWeight: 600, color: "var(--navy-900)" }}>
                    Refacturacion de poliza: {polizaSel?.numero}
                  </div>
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
            ))
          )}
        </>
      )}
    </div>
  );
}

const backBtn: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, border: 0, background: "transparent", color: "var(--ink-500)", cursor: "pointer", fontSize: 13.5, marginTop: 14, marginBottom: 14, padding: 0 };
const th: CSSProperties = { textAlign: "left", padding: "11px 16px", fontSize: 11.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-500)", background: "var(--canvas)", whiteSpace: "nowrap" };
const td: CSSProperties = { padding: "12px 16px", fontSize: 13.5, color: "var(--ink-900)" };
const printBtn: CSSProperties = { height: 30, padding: "0 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
