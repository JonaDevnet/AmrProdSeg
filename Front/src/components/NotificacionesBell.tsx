import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { polizasPorVencer } from "../api/reportes";
import { getAnulacionesPendientes, aprobarAnulacion, rechazarAnulacion } from "../api/anulaciones";
import { getEliminacionesPendientes, aprobarEliminacion, rechazarEliminacion } from "../api/eliminaciones";
import { exportacionesRecientes, altasRecientes } from "../api/polizas";
import { useAuth } from "../auth/AuthContext";
import { IconBell } from "./Icons";
import { formatFecha, formatMoneda, formatFechaHora } from "../utils/format";
import { getPendientes, aprobar, rechazar } from "../api/solicitudesCambio";
import type { SolicitudCambioDto } from "../api/solicitudesCambio";

export default function NotificacionesBell() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { esAdmin, usuario } = useAuth();
  const [abierto, setAbierto] = useState(false);

  // "Limpiar": descarta los avisos de vencimiento actuales (persistido por usuario en este equipo).
  const dismissKey = `amr_notif_vistas_${usuario?.nombre ?? "x"}`;
  const [vistas, setVistas] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(dismissKey) || "[]")); } catch { return new Set(); }
  });

  const { data } = useQuery({
    queryKey: ["notif", "por-vencer", 10],
    queryFn: () => polizasPorVencer(10),
    staleTime: 5 * 60 * 1000,
  });
  const anul = useQuery({
    queryKey: ["notif", "anulaciones-pend"],
    queryFn: getAnulacionesPendientes,
    enabled: esAdmin,
    staleTime: 60 * 1000,
  });
  const elim = useQuery({
    queryKey: ["notif", "eliminaciones-pend"],
    queryFn: getEliminacionesPendientes,
    enabled: esAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const solicitudes = useQuery<SolicitudCambioDto[]>({
    queryKey: ["solicitudes-cambio", "pendientes"],
    queryFn: getPendientes,
    enabled: esAdmin,
    staleTime: 5 * 60 * 1000,
  });
  const exp = useQuery({
    queryKey: ["notif", "exportaciones"],
    queryFn: () => exportacionesRecientes(20),
    enabled: esAdmin,
    staleTime: 60 * 1000,
  });
  const altas = useQuery({
    queryKey: ["notif", "altas"],
    queryFn: () => altasRecientes(20),
    enabled: esAdmin,
    staleTime: 60 * 1000,
  });

  // Exportaciones vistas (dismiss por usuario en este equipo).
  const expKey = `amr_notif_exp_${usuario?.nombre ?? "x"}`;
  const [expVistas, setExpVistas] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(expKey) || "[]")); } catch { return new Set(); }
  });

  // Altas vistas (dismiss por usuario en este equipo).
  const altaKey = `amr_notif_altas_${usuario?.nombre ?? "x"}`;
  const [altasVistas, setAltasVistas] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(altaKey) || "[]")); } catch { return new Set(); }
  });

  const clave = (p: { nroPoliza: string; fechaFin: string }) => `${p.nroPoliza}|${p.fechaFin}`;
  const items = (data ?? []).filter((p) => !vistas.has(clave(p)));
  const anulaciones = anul.data ?? [];
  const eliminaciones = elim.data ?? [];
  const solicitudesPendientes = solicitudes.data ?? [];
  const exportaciones = exp.data ?? [];
  const exportacionesNuevas = exportaciones.filter((e) => !expVistas.has(e.id));
  const altasRecientesData = altas.data ?? [];
  const altasNuevas = altasRecientesData.filter((a) => !altasVistas.has(a.id));
  const total = items.length + anulaciones.length + eliminaciones.length + solicitudesPendientes.length + exportacionesNuevas.length + altasNuevas.length;

  function limpiarExportaciones() {
    const nuevas = new Set(expVistas);
    exportaciones.forEach((e) => nuevas.add(e.id));
    setExpVistas(nuevas);
    try { localStorage.setItem(expKey, JSON.stringify([...nuevas].slice(-500))); } catch { /* ignore */ }
  }

  function limpiarAltas() {
    const nuevas = new Set(altasVistas);
    altasRecientesData.forEach((a) => nuevas.add(a.id));
    setAltasVistas(nuevas);
    try { localStorage.setItem(altaKey, JSON.stringify([...nuevas].slice(-500))); } catch { /* ignore */ }
  }

  function limpiarVencimientos() {
    const nuevas = new Set(vistas);
    items.forEach((p) => nuevas.add(clave(p)));
    setVistas(nuevas);
    try { localStorage.setItem(dismissKey, JSON.stringify([...nuevas].slice(-500))); } catch { /* ignore */ }
  }

  // Limpia TODAS las notificaciones descartables de una (vencimientos + exportaciones).
  // Las solicitudes de anulación/eliminación NO se descartan: son tareas que se resuelven
  // con Aceptar/Rechazar.
  function limpiarTodo() {
    limpiarVencimientos();
    limpiarExportaciones();
    limpiarAltas();
  }
  const hayDescartables = items.length + exportacionesNuevas.length + altasNuevas.length > 0;

  async function resolver(id: number, aprobar: boolean) {
    if (aprobar) await aprobarAnulacion(id); else await rechazarAnulacion(id);
    qc.invalidateQueries({ queryKey: ["notif", "anulaciones-pend"] });
    qc.invalidateQueries({ queryKey: ["cobros"] });
  }

  function guardarBajaSolicitada(e: any) {
    try {
      const key = "amr:bajas:solicitadas";
      const existentes = JSON.parse(localStorage.getItem(key) || "[]");
      if (!Array.isArray(existentes)) return;
      const nuevo = {
        id: e.id,
        fecha: new Date().toISOString(),
        poliza: e.polizaNumero ?? "",
        compania: e.companiaNombre ?? e.compania ?? "",
        patente: e.patente ?? "",
        cliente: e.clienteNombre ?? "",
      };
      const actualizados = [...existentes, nuevo];
      localStorage.setItem(key, JSON.stringify(actualizados));
    } catch {
      /* silencioso */
    }
  }

  async function resolverElim(id: number, aprobar: boolean) {
    if (aprobar) {
      const e = eliminaciones.find((x) => x.id === id);
      if (e) guardarBajaSolicitada(e);
      await aprobarEliminacion(id);
    } else {
      await rechazarEliminacion(id);
    }
    qc.invalidateQueries({ queryKey: ["notif", "eliminaciones-pend"] });
    qc.invalidateQueries({ queryKey: ["registro"] });
    qc.invalidateQueries({ queryKey: ["polizas"] });
  }

  async function resolverSolicitud(id: number, ok: boolean) {
    try {
      if (ok) await aprobar(id); else await rechazar(id);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "No se pudo resolver la solicitud.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["solicitudes-cambio", "pendientes"] });
    qc.invalidateQueries({ queryKey: ["solicitudes-cambio", "historial"] });
    qc.invalidateQueries({ queryKey: ["registro"] });
    qc.invalidateQueries({ queryKey: ["clientes"] });
    qc.invalidateQueries({ queryKey: ["polizas"] });
  }

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setAbierto((v) => !v)} title="Notificaciones" style={iconButton}>
        <IconBell size={18} />
        {total > 0 && (
          <span style={{
            position: "absolute", top: 4, right: 4, minWidth: 16, height: 16, padding: "0 4px",
            borderRadius: 999, background: "var(--bad-500)", color: "white", fontSize: 10, fontWeight: 700,
            display: "grid", placeItems: "center", border: "2px solid var(--navy-950)",
          }}>
            {total}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <div onClick={() => setAbierto(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
          <div style={panel}>
            {/* Cabecera con "Limpiar todo" (descarta vencimientos + exportaciones de una) */}
            <div style={{ ...head, background: "var(--canvas)" }}>
              <span>Notificaciones</span>
              <button onClick={limpiarTodo} disabled={!hayDescartables} title="Descartar todas las notificaciones"
                style={{ border: 0, background: "transparent", color: hayDescartables ? "var(--blue-600)" : "var(--ink-900)", fontSize: 12.5, fontWeight: 600, cursor: hayDescartables ? "pointer" : "default", padding: "2px 4px" }}>
                Limpiar todo
              </button>
            </div>
            {/* Solicitudes de anulación (Admin) */}
            {esAdmin && (
              <>
                <div style={head}>
                  Solicitudes de anulación
                  {anulaciones.length > 0 && <span style={badge}>{anulaciones.length}</span>}
                </div>
                {anulaciones.length === 0 ? (
                  <div style={vacio}>Sin solicitudes pendientes.</div>
                ) : (
                  anulaciones.map((a) => (
                    <div key={a.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--line-2)" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>
                        Anular cuota {a.numeroCuota} · {formatMoneda(a.monto)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-900)", marginTop: 2 }}>
                        {a.solicitante ?? "—"} solicita anular a {a.clienteNombre ?? "—"}
                      </div>
                      <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-900)", marginTop: 3 }}>{a.nroPoliza}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button onClick={() => resolver(a.id, true)} style={{ flex: 1, height: 30, borderRadius: 8, border: 0, background: "var(--ok-700)", color: "white", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Aceptar</button>
                        <button onClick={() => resolver(a.id, false)} style={{ flex: 1, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-900)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Rechazar</button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Solicitudes de edición/eliminación (Admin) */}
            {esAdmin && solicitudesPendientes.length > 0 && (
              <>
                <div style={head}>
                  Solicitudes de edición
                  <span style={badge}>{solicitudesPendientes.length}</span>
                </div>
                {solicitudesPendientes.map((s) => (
                  <div key={s.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--line-2)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {s.tipo} · <span style={{ color: s.accion === "Eliminar" ? "var(--bad-700)" : "var(--navy-900)" }}>{s.accion}</span>
                      {s.entidadDesc ? <span style={{ fontWeight: 500 }}> · {s.entidadDesc}</span> : <span className="mono"> · #{s.entidadId}</span>}
                    </div>
                    {s.clienteNombre && <div style={{ fontSize: 12, color: "var(--ink-900)", marginTop: 2 }}>{s.clienteNombre}</div>}
                    <div style={{ fontSize: 12, color: "var(--ink-900)", marginTop: 2 }}>
                      {s.solicitante ?? "—"} solicita {s.accion.toLowerCase()} {s.tipo.toLowerCase()} · {formatFechaHora(s.fechaSolicitud)}
                    </div>
                    {s.motivo && <div style={{ fontSize: 11.5, color: "var(--ink-900)", marginTop: 3 }}>Motivo: {s.motivo}</div>}
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => resolverSolicitud(s.id, true)} style={{ flex: 1, height: 30, borderRadius: 8, border: 0, background: "var(--ok-700)", color: "white", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Aceptar</button>
                      <button onClick={() => resolverSolicitud(s.id, false)} style={{ flex: 1, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-900)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Rechazar</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Solicitudes de eliminación de póliza (Admin) */}
            {esAdmin && eliminaciones.length > 0 && (
              <>
                <div style={head}>
                  Solicitudes de eliminación
                  <span style={badge}>{eliminaciones.length}</span>
                </div>
                {eliminaciones.map((e) => (
                  <div key={e.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--line-2)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bad-700)" }}>
                      Eliminar póliza <span className="mono">{e.polizaNumero}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-900)", marginTop: 2 }}>
                      {e.solicitante ?? "—"} solicita eliminar la de {e.clienteNombre ?? "—"} ({e.patente ?? "—"})
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-900)", marginTop: 3 }}>
                      {e.cuotasPagadas}/{e.cantidadCuotas} cuotas pagadas{e.motivo ? ` · ${e.motivo}` : ""}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => resolverElim(e.id, true)} style={{ flex: 1, height: 30, borderRadius: 8, border: 0, background: "var(--bad-600)", color: "white", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Autorizar</button>
                      <button onClick={() => resolverElim(e.id, false)} style={{ flex: 1, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-900)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Rechazar</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Exportaciones recientes (Admin) */}
            {esAdmin && (
              <>
                <div style={head}>
                  Exportaciones recientes
                  {exportacionesNuevas.length > 0 && <span style={badge}>{exportacionesNuevas.length}</span>}
                </div>
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {exportacionesNuevas.length === 0 ? (
                    <div style={vacio}>Sin exportaciones.</div>
                  ) : (
                    exportacionesNuevas.map((e) => (
                      <div key={e.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--line-2)", background: "var(--blue-50)" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>
                          {e.usuarioNombre ?? "Alguien"} exportó <span className="mono">{e.polizaNumero ?? "—"}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink-900)", marginTop: 2 }}>
                          {e.clienteNombre ?? "—"} · {formatFecha(e.fecha)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Pólizas creadas (Admin) */}
            {esAdmin && (
              <>
                <div style={head}>
                  Pólizas creadas
                  {altasNuevas.length > 0 && <span style={badge}>{altasNuevas.length}</span>}
                </div>
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {altasNuevas.length === 0 ? (
                    <div style={vacio}>Sin altas recientes.</div>
                  ) : (
                    altasNuevas.map((a) => (
                      <div key={a.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--line-2)", background: "var(--ok-100)" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>
                          {a.usuarioNombre ?? "Alguien"} dio de alta a {a.clienteNombre ?? "un cliente"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink-900)", marginTop: 2 }}>
                          Póliza <span className="mono">{a.polizaNumero ?? "—"}</span>
                          {a.patente ? <> · Patente <span className="mono">{a.patente}</span></> : null}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-900)", marginTop: 2 }}>{formatFecha(a.fecha)}</div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Pólizas por vencer */}
            <div style={head}>
              Pólizas por vencer (10 días)
              {items.length > 0 && (
                <span style={badge}>{items.length}</span>
              )}
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {items.length === 0 ? (
                <div style={vacio}>No hay vencimientos próximos.</div>
              ) : (
                items.map((p, i) => (
                  <div key={i} style={{ padding: "10px 16px", borderBottom: "1px solid var(--line-2)" }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.nombre}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-900)" }}>
                      <span className="mono">{p.nroPoliza}</span> · vence {formatFecha(p.fechaFin)}
                      <span style={{ color: p.diasRestantes <= 7 ? "var(--bad-600)" : "var(--warn-700)", fontWeight: 600 }}>
                        {" "}· {p.diasRestantes}d
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => { setAbierto(false); navigate("/reportes"); }} style={{
              width: "100%", padding: "10px 16px", border: 0, borderTop: "1px solid var(--line)",
              background: "transparent", color: "var(--blue-600)", fontWeight: 500, fontSize: 13.5, cursor: "pointer",
            }}>
              Ver en reportes
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const iconButton: CSSProperties = {
  position: "relative", width: 40, height: 40, borderRadius: 10, border: 0,
  background: "transparent", cursor: "pointer", display: "grid", placeItems: "center",
  color: "oklch(0.85 0.04 240)",
};
const panel: CSSProperties = {
  position: "absolute", top: 44, right: 0, width: 340, background: "var(--paper)",
  border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 31, overflow: "hidden",
};
const head: CSSProperties = {
  padding: "12px 16px", borderBottom: "1px solid var(--line)", fontWeight: 600, fontSize: 14,
  display: "flex", alignItems: "center", justifyContent: "space-between",
  color: "var(--ink-900)",
};
const badge: CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "var(--bad-700)", background: "var(--bad-100)", padding: "2px 8px", borderRadius: 999,
};
const vacio: CSSProperties = { padding: "16px", color: "var(--ink-900)", fontSize: 13.5, textAlign: "center" };
