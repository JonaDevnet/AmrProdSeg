// Registro de movimientos (Admin): eliminaciones de póliza y anulaciones de cuota,
// con quién solicitó, quién autorizó y el estado.
import { useState, type CSSProperties } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getEliminacionesHistorial, getAnulacionesHistorial, getPapelera, restaurarPoliza, borrarDefinitivo } from "../api/eliminaciones";
import { formatFecha, formatMoneda } from "../utils/format";

const ESTADOS: Record<number, { l: string; bg: string; fg: string }> = {
  0: { l: "Pendiente", bg: "var(--warn-100)", fg: "var(--warn-700)" },
  1: { l: "En papelera", bg: "var(--bad-100)", fg: "var(--bad-700)" },
  2: { l: "Rechazada", bg: "var(--blue-100)", fg: "var(--navy-900)" },
  3: { l: "Restaurada", bg: "var(--ok-100)", fg: "var(--ok-700)" },
  4: { l: "Borrada def.", bg: "oklch(0.9 0.02 20)", fg: "var(--bad-700)" },
};
const ESTADOS_ANUL: Record<number, { l: string; bg: string; fg: string }> = {
  0: { l: "Pendiente", bg: "var(--warn-100)", fg: "var(--warn-700)" },
  1: { l: "Anulada", bg: "var(--bad-100)", fg: "var(--bad-700)" },
  2: { l: "Rechazada", bg: "var(--blue-100)", fg: "var(--navy-900)" },
};

function Pill({ e, mapa }: { e: number; mapa: Record<number, { l: string; bg: string; fg: string }> }) {
  const s = mapa[e] ?? mapa[0];
  return <span style={{ background: s.bg, color: s.fg, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999 }}>{s.l}</span>;
}

export default function Registro() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pap" | "elim" | "anul">("pap");
  const [borrar, setBorrar] = useState<number | null>(null);
  const [accion, setAccion] = useState(false);
  const elim = useQuery({ queryKey: ["registro", "eliminaciones"], queryFn: getEliminacionesHistorial });
  const anul = useQuery({ queryKey: ["registro", "anulaciones"], queryFn: getAnulacionesHistorial });
  const pap = useQuery({ queryKey: ["registro", "papelera"], queryFn: getPapelera });

  const eliminaciones = elim.data ?? [];
  const anulaciones = anul.data ?? [];
  const papelera = pap.data ?? [];

  async function restaurar(polizaId: number) {
    setAccion(true);
    try {
      await restaurarPoliza(polizaId);
      qc.invalidateQueries({ queryKey: ["registro"] });
      qc.invalidateQueries({ queryKey: ["polizas"] });
    } finally { setAccion(false); }
  }
  async function confirmarBorrado() {
    if (borrar == null) return;
    setAccion(true);
    try {
      await borrarDefinitivo(borrar);
      setBorrar(null);
      qc.invalidateQueries({ queryKey: ["registro"] });
    } finally { setAccion(false); }
  }

  return (
    <div>
      <div style={{ padding: "32px 0 12px" }}>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 }}>Inicio · Registro de movimientos</div>
        <h1 style={{ margin: 0, fontSize: 30, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" }}>Registro de movimientos</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14.5 }}>
          Pólizas eliminadas y cuotas anuladas, con quién las solicitó y quién las autorizó.
        </p>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginTop: 8, overflowX: "auto" }}>
        <button style={tabBtn(tab === "pap")} onClick={() => setTab("pap")}>🗑️ Papelera ({papelera.length})</button>
        <button style={tabBtn(tab === "elim")} onClick={() => setTab("elim")}>Historial de eliminaciones ({eliminaciones.length})</button>
        <button style={tabBtn(tab === "anul")} onClick={() => setTab("anul")}>Cuotas anuladas ({anulaciones.length})</button>
      </div>

      <section style={card}>
        <div style={{ overflowX: "auto" }}>
          {tab === "pap" ? (
            <div style={{ padding: 16, display: "grid", gap: 12 }}>
              {papelera.length === 0 ? (
                <div style={vacio}>La papelera está vacía.</div>
              ) : papelera.map((p) => (
                <div key={p.polizaId} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 16, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ minWidth: 200, flex: 1 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 15, color: "var(--ink-900)" }}>{p.polizaNumero ?? "—"}</div>
                    <div style={{ fontSize: 13.5, color: "var(--ink-700)", marginTop: 3 }}>
                      {p.clienteNombre ?? "—"} · <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.patente ?? "—"}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 4 }}>
                      {p.cuotasPagadas}/{p.cantidadCuotas} cuotas · eliminada {p.fechaEliminacion ? formatFecha(p.fechaEliminacion) : "—"}{p.solicitante ? ` · por ${p.solicitante}` : ""}
                    </div>
                    {p.motivo && <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>Motivo: {p.motivo}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                    <button disabled={accion} onClick={() => restaurar(p.polizaId)}
                      style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1.5px solid var(--ok-500)", background: "var(--ok-100)", color: "var(--ok-700)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>↩ Restaurar</button>
                    <button disabled={accion} onClick={() => setBorrar(p.polizaId)}
                      style={{ height: 40, padding: "0 16px", borderRadius: 10, border: 0, background: "var(--bad-600)", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Borrar</button>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "elim" ? (
            <table style={table}>
              <thead><tr>
                <th style={th}>Póliza</th><th style={th}>Cliente</th><th style={th}>Patente</th>
                <th style={th}>Cuotas</th><th style={th}>Motivo</th><th style={th}>Solicitó</th>
                <th style={th}>Autorizó</th><th style={th}>Fecha</th><th style={th}>Estado</th>
              </tr></thead>
              <tbody>
                {eliminaciones.length === 0 ? (
                  <tr><td style={vacio} colSpan={9}>Sin movimientos registrados.</td></tr>
                ) : eliminaciones.map((e) => (
                  <tr key={e.id} style={{ borderTop: "1px solid var(--line-2)" }}>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{e.polizaNumero ?? "—"}</td>
                    <td style={td}>{e.clienteNombre ?? "—"}</td>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace" }}>{e.patente ?? "—"}</td>
                    <td style={td}>{e.cuotasPagadas}/{e.cantidadCuotas}</td>
                    <td style={{ ...td, color: "var(--ink-500)" }}>{e.motivo || "—"}</td>
                    <td style={td}>{e.solicitante ?? "—"}</td>
                    <td style={td}>{e.resolvio ?? "—"}</td>
                    <td style={{ ...td, color: "var(--ink-500)" }}>{formatFecha(e.fechaResolucion ?? e.fechaSolicitud)}</td>
                    <td style={td}><Pill e={e.estado} mapa={ESTADOS} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={table}>
              <thead><tr>
                <th style={th}>Póliza</th><th style={th}>Cliente</th><th style={th}>Cuota</th>
                <th style={th}>Monto</th><th style={th}>Motivo</th><th style={th}>Solicitó</th>
                <th style={th}>Autorizó</th><th style={th}>Fecha</th><th style={th}>Estado</th>
              </tr></thead>
              <tbody>
                {anulaciones.length === 0 ? (
                  <tr><td style={vacio} colSpan={9}>Sin movimientos registrados.</td></tr>
                ) : anulaciones.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid var(--line-2)" }}>
                    <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{a.nroPoliza ?? "—"}</td>
                    <td style={td}>{a.clienteNombre ?? "—"}</td>
                    <td style={td}>#{a.numeroCuota}</td>
                    <td style={td}>{formatMoneda(a.monto)}</td>
                    <td style={{ ...td, color: "var(--ink-500)" }}>{a.motivo || "—"}</td>
                    <td style={td}>{a.solicitante ?? "—"}</td>
                    <td style={td}>{a.resolvio ?? "—"}</td>
                    <td style={{ ...td, color: "var(--ink-500)" }}>{formatFecha(a.fechaResolucion ?? a.fechaSolicitud)}</td>
                    <td style={td}><Pill e={a.estado} mapa={ESTADOS_ANUL} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {borrar != null && (
        <div onClick={() => !accion && setBorrar(null)} style={{ position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.50)", backdropFilter: "blur(4px)", zIndex: 1100, display: "grid", placeItems: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", background: "var(--paper)", borderRadius: 16, boxShadow: "var(--shadow-lg)", padding: 24 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--bad-700)" }}>Borrar definitivamente</h3>
            <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--ink-700)", lineHeight: 1.5 }}>
              Esta póliza y todas sus cuotas se borrarán de forma <strong>permanente</strong>. <strong>No se puede deshacer</strong> ni restaurar después.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button onClick={() => setBorrar(null)} disabled={accion} style={{ height: 40, padding: "0 16px", borderRadius: 10, background: "var(--paper)", border: "1.5px solid var(--line)", color: "var(--ink-900)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button onClick={confirmarBorrado} disabled={accion} style={{ height: 40, padding: "0 18px", borderRadius: 10, background: "var(--bad-600)", color: "white", border: 0, fontSize: 14, fontWeight: 600, cursor: accion ? "wait" : "pointer" }}>{accion ? "Borrando…" : "Borrar definitivamente"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function tabBtn(active: boolean): CSSProperties {
  return { padding: "12px 18px", border: 0, borderBottom: "2px solid " + (active ? "var(--navy-900)" : "transparent"), background: "transparent", color: active ? "var(--ink-900)" : "var(--ink-500)", fontSize: 14, fontWeight: 500, cursor: "pointer", marginBottom: -1, whiteSpace: "nowrap", flexShrink: 0 };
}
const card: CSSProperties = { margin: "16px 0 60px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)" };
const table: CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13.5 };
const th: CSSProperties = { textAlign: "left", padding: "12px 16px", fontSize: 11.5, fontWeight: 500, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", whiteSpace: "nowrap" };
const td: CSSProperties = { padding: "12px 16px", color: "var(--ink-900)", verticalAlign: "middle", whiteSpace: "nowrap" };
const vacio: CSSProperties = { padding: "28px 16px", textAlign: "center", color: "var(--ink-400)", fontSize: 14 };
