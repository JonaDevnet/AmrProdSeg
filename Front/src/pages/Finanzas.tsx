// #7 — Dashboard personal de finanzas (ingresos / egresos). PRIVADO por usuario:
// el backend acota todo al usuario del token; nadie ve los movimientos de otro.
import { useMemo, useState, type CSSProperties } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMovimientos, crearMovimiento, eliminarMovimiento, type TipoMovimiento } from "../api/movimientos";
import { useAuth } from "../auth/AuthContext";
import { descargarCSV } from "../utils/csv";
import { IconPlus, IconDown } from "../design/icons";
import { useIsMobile } from "../hooks/useMediaQuery";

const fmt = (n: number) => "$ " + Number(n).toLocaleString("es-AR");
const hoyISO = () => {
  // Fecha local (no UTC) para no adelantar el día de tarde/noche en Argentina (UTC-3).
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fmtFecha = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split("-"); return `${d}/${m}/${y}`; };

function inicioMesISO() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }

export default function Finanzas() {
  const mobile = useIsMobile();
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const { data: movimientos = [], isLoading } = useQuery({
    queryKey: ["movimientos", desde, hasta],
    queryFn: () => getMovimientos(desde || undefined, hasta || undefined),
  });

  const [tipo, setTipo] = useState<TipoMovimiento>("egreso");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { ingresos, egresos, balance } = useMemo(() => {
    let i = 0, e = 0;
    for (const m of movimientos) m.tipo === "ingreso" ? (i += m.monto) : (e += m.monto);
    return { ingresos: i, egresos: e, balance: i - e };
  }, [movimientos]);

  async function agregar() {
    setError("");
    const m = Number((monto || "").replace(/[^\d.]/g, ""));
    if (!m || m <= 0) { setError("Ingresá un monto válido."); return; }
    setBusy(true);
    try {
      await crearMovimiento({ tipo, monto: m, categoria: categoria.trim() || undefined, descripcion: descripcion.trim() || undefined, fecha });
      setMonto(""); setCategoria(""); setDescripcion("");
      qc.invalidateQueries({ queryKey: ["movimientos"] });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "No se pudo guardar el movimiento.");
    } finally { setBusy(false); }
  }

  async function borrar(id: number) {
    if (!window.confirm("¿Eliminar este movimiento?")) return;
    await eliminarMovimiento(id);
    qc.invalidateQueries({ queryKey: ["movimientos"] });
  }

  function exportar() {
    const filas: (string | number)[][] = [
      ["Mis finanzas — detalle"],
      ["Usuario", usuario?.nombre ?? ""],
      ["Generado", new Date().toLocaleString("es-AR")],
      [],
      ["Fecha", "Tipo", "Categoría", "Descripción", "Monto"],
      ...movimientos.map((m) => [fmtFecha(m.fecha), m.tipo, m.categoria ?? "", m.descripcion ?? "", m.tipo === "ingreso" ? m.monto : -m.monto]),
      [],
      ["", "", "", "Ingresos", ingresos],
      ["", "", "", "Egresos", egresos],
      ["", "", "", "Balance", balance],
    ];
    descargarCSV(`AMR-Finanzas-${hoyISO()}.csv`, filas);
  }

  return (
    <div>
      <div style={{ ...hero, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={crumb}>Inicio · Mis finanzas</div>
          <h1 style={h1}>Mis finanzas</h1>
          <p style={sub}>Registro personal de ingresos y egresos de {usuario?.nombre ?? "tu cuenta"}. Solo vos ves esta información.</p>
        </div>
        <button style={exportarBtn} onClick={exportar} disabled={movimientos.length === 0}><IconDown size={15} /> Exportar detalle</button>
      </div>

      {/* Filtro por día / período */}
      <div style={filtroBar}>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)" }}>Período</span>
        <div style={fechaBox}><span style={{ fontSize: 12, color: "var(--ink-400)" }}>Desde</span><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={fechaInput} /></div>
        <div style={fechaBox}><span style={{ fontSize: 12, color: "var(--ink-400)" }}>Hasta</span><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={fechaInput} /></div>
        <button style={presetBtn} onClick={() => { const h = hoyISO(); setDesde(h); setHasta(h); }}>Hoy</button>
        <button style={presetBtn} onClick={() => { setDesde(inicioMesISO()); setHasta(hoyISO()); }}>Este mes</button>
        <button style={presetBtn} onClick={() => { setDesde(""); setHasta(""); }}>Todo</button>
      </div>

      {/* KPIs */}
      <div style={kpis}>
        <Kpi l="Ingresos" n={fmt(ingresos)} color="var(--ok-700)" />
        <Kpi l="Egresos" n={fmt(egresos)} color="var(--bad-700)" />
        <Kpi l="Balance" n={fmt(balance)} color={balance >= 0 ? "var(--navy-900)" : "var(--bad-700)"} />
      </div>

      <div style={{ ...shell, ...(mobile ? { gridTemplateColumns: "1fr" } : null) }}>
        {/* Form */}
        <div style={card}>
          <div style={cardHead}>
            <div style={kicker}>Nuevo movimiento</div>
            <h2 style={cardTitle}>Registrar ingreso o egreso</h2>
          </div>
          <div style={{ padding: "20px 22px" }}>
            <div style={{ display: "inline-flex", border: "1.5px solid var(--line)", borderRadius: 10, padding: 3, gap: 2, marginBottom: 16 }}>
              {(["ingreso", "egreso"] as const).map((t) => (
                <button key={t} onClick={() => setTipo(t)}
                  style={{ padding: "8px 18px", borderRadius: 8, border: 0, cursor: "pointer", fontSize: 13, fontWeight: 600, textTransform: "capitalize",
                    background: tipo === t ? (t === "ingreso" ? "var(--ok-700)" : "var(--bad-600)") : "transparent",
                    color: tipo === t ? "white" : "var(--ink-700)" }}>{t}</button>
              ))}
            </div>

            <Campo label="Monto">
              <div style={inputWrap}>
                <span style={{ fontSize: 12, color: "var(--ink-400)", fontWeight: 500 }}>ARS $</span>
                <input className="mono" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" style={input} />
              </div>
            </Campo>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <Campo label="Categoría">
                <div style={inputWrap}><input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Comisión, sueldo, alquiler…" style={input} /></div>
              </Campo>
              <Campo label="Fecha">
                <div style={inputWrap}><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={input} /></div>
              </Campo>
            </div>
            <Campo label="Descripción (opcional)">
              <div style={inputWrap}><input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalle" style={input} /></div>
            </Campo>

            {error && <div style={errBox}>{error}</div>}
            <button onClick={agregar} disabled={busy} style={primaryBtn}><IconPlus size={16} /> {busy ? "Guardando…" : "Agregar movimiento"}</button>
          </div>
        </div>

        {/* Lista */}
        <div style={card}>
          <div style={cardHead}>
            <div style={kicker}>Historial</div>
            <h2 style={cardTitle}>Movimientos</h2>
          </div>
          {isLoading ? (
            <div style={vacio}>Cargando…</div>
          ) : movimientos.length === 0 ? (
            <div style={vacio}>Todavía no registraste movimientos.</div>
          ) : (
            <div style={{ maxHeight: 520, overflowY: "auto" }}>
              {movimientos.map((m) => (
                <div key={m.id} style={row}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: m.tipo === "ingreso" ? "var(--ok-500)" : "var(--bad-500)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)" }}>
                      {m.categoria || (m.tipo === "ingreso" ? "Ingreso" : "Egreso")}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>
                      <span className="mono">{fmtFecha(m.fecha)}</span>{m.descripcion ? ` · ${m.descripcion}` : ""}
                    </div>
                  </div>
                  <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: m.tipo === "ingreso" ? "var(--ok-700)" : "var(--bad-700)" }}>
                    {m.tipo === "ingreso" ? "+ " : "− "}{fmt(m.monto)}
                  </span>
                  <button onClick={() => borrar(m.id)} title="Eliminar" style={delBtn}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ l, n, color }: { l: string; n: string; color: string }) {
  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 20px" }}>
      <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 500 }}>{l}</div>
      <div className="mono" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4, color }}>{n}</div>
    </div>
  );
}
function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}

const hero: CSSProperties = { padding: "32px 0 12px" };
const crumb: CSSProperties = { fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 };
const h1: CSSProperties = { margin: 0, fontSize: 30, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" };
const sub: CSSProperties = { margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14.5 };
const exportarBtn: CSSProperties = { height: 40, padding: "0 16px", borderRadius: 10, background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 };
const kpis: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, margin: "0 0 20px" };
const filtroBar: CSSProperties = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 14px", margin: "16px 0 16px" };
const fechaBox: CSSProperties = { display: "flex", alignItems: "center", gap: 8, border: "1.5px solid var(--line)", borderRadius: 9, padding: "0 12px", height: 38, background: "var(--paper)" };
const fechaInput: CSSProperties = { border: 0, outline: 0, background: "transparent", fontSize: 13, color: "var(--ink-900)" };
const presetBtn: CSSProperties = { height: 34, padding: "0 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 12.5, fontWeight: 500, cursor: "pointer" };
const shell: CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: 20, alignItems: "start", marginBottom: 60 };
const card: CSSProperties = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-sm)", overflow: "hidden" };
const cardHead: CSSProperties = { padding: "18px 22px", borderBottom: "1px solid var(--line-2)" };
const kicker: CSSProperties = { fontSize: 11.5, fontWeight: 600, color: "var(--blue-600)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 };
const cardTitle: CSSProperties = { margin: 0, fontSize: 18, letterSpacing: "-0.02em", fontWeight: 600, color: "var(--ink-900)" };
const inputWrap: CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "0 12px", height: 42, background: "var(--paper)", borderRadius: 9, border: "1.5px solid var(--line)" };
const input: CSSProperties = { flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14, color: "var(--ink-900)", height: "100%" };
const errBox: CSSProperties = { margin: "0 0 12px", padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" };
const primaryBtn: CSSProperties = { width: "100%", height: 44, borderRadius: 10, background: "var(--navy-900)", color: "white", border: 0, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 };
const row: CSSProperties = { display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: "1px solid var(--line-2)" };
const delBtn: CSSProperties = { width: 26, height: 26, flexShrink: 0, borderRadius: 7, border: "1px solid oklch(0.85 0.08 28)", background: "var(--bad-100)", color: "var(--bad-700)", cursor: "pointer", fontSize: 14, lineHeight: 1 };
const vacio: CSSProperties = { padding: "50px 20px", textAlign: "center", color: "var(--ink-500)", fontSize: 14 };
