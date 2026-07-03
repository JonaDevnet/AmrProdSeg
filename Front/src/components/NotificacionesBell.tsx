import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { polizasPorVencer } from "../api/reportes";
import { getAnulacionesPendientes, aprobarAnulacion, rechazarAnulacion } from "../api/anulaciones";
import { useAuth } from "../auth/AuthContext";
import { IconBell } from "./Icons";
import { formatFecha, formatMoneda } from "../utils/format";

export default function NotificacionesBell() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { esAdmin } = useAuth();
  const [abierto, setAbierto] = useState(false);

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

  const items = data ?? [];
  const anulaciones = anul.data ?? [];
  const total = items.length + anulaciones.length;

  async function resolver(id: number, aprobar: boolean) {
    if (aprobar) await aprobarAnulacion(id); else await rechazarAnulacion(id);
    qc.invalidateQueries({ queryKey: ["notif", "anulaciones-pend"] });
    qc.invalidateQueries({ queryKey: ["cobros"] });
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
                      <div style={{ fontSize: 12, color: "var(--ink-600)", marginTop: 2 }}>
                        {a.solicitante ?? "—"} solicita anular a {a.clienteNombre ?? "—"}
                      </div>
                      <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 3 }}>{a.nroPoliza}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <button onClick={() => resolver(a.id, true)} style={{ flex: 1, height: 30, borderRadius: 8, border: 0, background: "var(--ok-700)", color: "white", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Aceptar</button>
                        <button onClick={() => resolver(a.id, false)} style={{ flex: 1, height: 30, borderRadius: 8, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Rechazar</button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* Pólizas por vencer */}
            <div style={head}>Pólizas por vencer (10 días)</div>
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {items.length === 0 ? (
                <div style={vacio}>No hay vencimientos próximos.</div>
              ) : (
                items.map((p, i) => (
                  <div key={i} style={{ padding: "10px 16px", borderBottom: "1px solid var(--line-2)" }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.nombre}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>
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
};
const badge: CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "var(--bad-700)", background: "var(--bad-100)", padding: "2px 8px", borderRadius: 999,
};
const vacio: CSSProperties = { padding: "16px", color: "var(--ink-400)", fontSize: 13.5, textAlign: "center" };
