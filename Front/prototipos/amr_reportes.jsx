// AMR — Reportes
// (A) Pagos recibidos: agrupado por compañía + desglose por método de pago + total general.
// (B) Rendición: rango de fechas + compañía + % → exporta Excel.
// Ambos secciones permiten exportar a .xlsx (SheetJS).

const REP_COMPANIES = getCompanias();

// Mock de cobros del último período. fecha en ISO para filtrar.
const PAGOS = [
  // La Caja
  { fecha: "2026-05-08", hora: "09:14", cliente: "Martín Acosta",        poliza: "AUT-2410-887143", co: "NRE Cia Seguros",             ramo: "Automotor", metodo: "Débito automático", monto: 38500 },
  { fecha: "2026-05-12", hora: "11:33", cliente: "Federico Bianchi",     poliza: "AUT-2401-558204", co: "NRE Cia Seguros",             ramo: "Automotor", metodo: "Tarjeta de crédito", monto: 45200 },
  { fecha: "2026-05-14", hora: "10:05", cliente: "Martín Acosta",        poliza: "AUT-2410-887143", co: "NRE Cia Seguros",             ramo: "Automotor", metodo: "Débito automático", monto: 38500 },
  { fecha: "2026-05-22", hora: "15:48", cliente: "Carla Iturri",         poliza: "AUT-2502-998127", co: "NRE Cia Seguros",             ramo: "Automotor", metodo: "CBU",                monto: 41200 },
  // Sancor
  { fecha: "2026-05-02", hora: "08:52", cliente: "Ricardo Pérez",        poliza: "AUT-2509-114902", co: "La Perseverancia Seguros",      ramo: "Automotor", metodo: "Débito automático", monto: 52400 },
  { fecha: "2026-05-11", hora: "14:20", cliente: "Marcela Domínguez",    poliza: "AUT-2406-700218", co: "La Perseverancia Seguros",      ramo: "Automotor", metodo: "Efectivo",          monto: 28700 },
  { fecha: "2026-05-19", hora: "16:11", cliente: "Ricardo Pérez",        poliza: "AUT-2509-114902", co: "La Perseverancia Seguros",      ramo: "Automotor", metodo: "Débito automático", monto: 52400 },
  // Federación Patronal
  { fecha: "2026-05-03", hora: "09:40", cliente: "Lucía Fernández",      poliza: "HOG-2510-002411", co: "Libra", ramo: "Hogar",     metodo: "CBU",                monto: 78900 },
  { fecha: "2026-05-15", hora: "11:02", cliente: "Valentina Ortiz",      poliza: "AUT-2502-009912", co: "Libra", ramo: "Automotor", metodo: "Tarjeta de crédito", monto: 33200 },
  { fecha: "2026-05-21", hora: "17:30", cliente: "Construcciones Norte", poliza: "ART-2412-558112", co: "Libra", ramo: "ART",       metodo: "Transferencia",      monto: 124000 },
  // Allianz
  { fecha: "2026-05-04", hora: "10:55", cliente: "Camila Suárez",        poliza: "VID-2403-771122", co: "Paraná Seguros",             ramo: "Vida",      metodo: "Débito automático", monto: 21450 },
  { fecha: "2026-05-23", hora: "13:44", cliente: "Esteban Galván",       poliza: "AUT-2504-220011", co: "Paraná Seguros",             ramo: "Automotor", metodo: "Tarjeta de crédito", monto: 47900 },
  // Mercantil Andina
  { fecha: "2026-05-18", hora: "08:30", cliente: "Sofía Romero",         poliza: "AUT-2506-339118", co: "Agrosalta Coop Seg",    ramo: "Automotor", metodo: "Débito automático", monto: 41750 },
  { fecha: "2026-05-07", hora: "12:15", cliente: "Sofía Romero",         poliza: "AUT-2506-339118", co: "Agrosalta Coop Seg",    ramo: "Automotor", metodo: "Débito automático", monto: 41750 },
  // San Cristóbal
  { fecha: "2026-05-05", hora: "09:00", cliente: "Comercio La Estación", poliza: "COM-2505-440099", co: "ATM Seguros",       ramo: "Comercio",  metodo: "Transferencia",      monto: 86400 },
  // Zurich
  { fecha: "2026-05-10", hora: "11:22", cliente: "Diego Molina",         poliza: "AUT-2508-217733", co: "NRE Cia Seguros",              ramo: "Automotor", metodo: "Débito automático", monto: 36900 },
  { fecha: "2026-05-25", hora: "16:50", cliente: "Diego Molina",         poliza: "AUT-2508-217733", co: "NRE Cia Seguros",              ramo: "Automotor", metodo: "Débito automático", monto: 36900 },
  // ── Hechos de hoy (2026-06-12) para demo del tab ──
  { fecha: "2026-06-12", hora: "08:07", cliente: "Martín Acosta",        poliza: "AUT-2410-887143", co: "NRE Cia Seguros",             ramo: "Automotor", metodo: "Débito automático", monto: 38500 },
  { fecha: "2026-06-12", hora: "09:23", cliente: "Sofía Romero",         poliza: "AUT-2506-339118", co: "Agrosalta Coop Seg",    ramo: "Automotor", metodo: "Débito automático", monto: 41750 },
  { fecha: "2026-06-12", hora: "10:11", cliente: "Ricardo Pérez",        poliza: "AUT-2509-114902", co: "La Perseverancia Seguros",      ramo: "Automotor", metodo: "Débito automático", monto: 52400 },
  { fecha: "2026-06-12", hora: "10:48", cliente: "Diego Molina",         poliza: "AUT-2508-217733", co: "NRE Cia Seguros",              ramo: "Automotor", metodo: "Débito automático", monto: 36900 },
  { fecha: "2026-06-12", hora: "11:30", cliente: "Lucía Fernández",      poliza: "HOG-2510-002411", co: "Libra", ramo: "Hogar",     metodo: "CBU",                monto: 78900 },
  { fecha: "2026-06-12", hora: "12:05", cliente: "Marcela Domínguez",    poliza: "AUT-2406-700218", co: "La Perseverancia Seguros",      ramo: "Automotor", metodo: "Efectivo",          monto: 28700 },
  { fecha: "2026-06-12", hora: "13:18", cliente: "Federico Bianchi",     poliza: "AUT-2401-558204", co: "NRE Cia Seguros",             ramo: "Automotor", metodo: "Tarjeta de crédito", monto: 45200 },
  { fecha: "2026-06-12", hora: "14:02", cliente: "Camila Suárez",        poliza: "VID-2403-771122", co: "Paraná Seguros",             ramo: "Vida",      metodo: "Débito automático", monto: 21450 },
  { fecha: "2026-06-12", hora: "14:55", cliente: "Construcciones Norte", poliza: "ART-2412-558112", co: "Libra", ramo: "ART",       metodo: "Transferencia",      monto: 124000 },
  { fecha: "2026-06-12", hora: "15:40", cliente: "Valentina Ortiz",      poliza: "AUT-2502-009912", co: "Libra", ramo: "Automotor", metodo: "Tarjeta de crédito", monto: 33200 },
  { fecha: "2026-06-12", hora: "16:22", cliente: "Comercio La Estación", poliza: "COM-2505-440099", co: "ATM Seguros",       ramo: "Comercio",  metodo: "Transferencia",      monto: 86400 },
  { fecha: "2026-06-12", hora: "17:09", cliente: "Esteban Galván",       poliza: "AUT-2504-220011", co: "Paraná Seguros",             ramo: "Automotor", metodo: "Tarjeta de crédito", monto: 47900 },
];

const fmtPeso = (n) => "$ " + Number(n).toLocaleString("es-AR");

// Cómo se envió el comprobante (mail/online u WhatsApp). Lee envíos reales de Cobranzas
// y, si no hay registro, asigna un valor determinístico para la demo.
function repReadEnvios() {
  try { return JSON.parse(localStorage.getItem("amr_envios") || "{}"); } catch(e) { return {}; }
}
function envioDe(p) {
  const env = repReadEnvios();
  const key = p.poliza + "|" + p.fecha;
  if (env[key]) return env[key];
  let h = 0; const s = p.poliza + p.hora;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 2 === 0 ? "WhatsApp" : "Online";
}
const fmtDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const repStyles = {
  page: { background: "var(--canvas)", minHeight: "100vh" },
  hero: {
    maxWidth: 1440, margin: "0 auto",
    padding: "32px 28px 12px",
    display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24,
  },
  crumb: { fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 },
  h1: { margin: 0, fontSize: 30, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" },
  sub: { margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14.5 },

  tabs: {
    maxWidth: 1440, margin: "8px auto 0",
    padding: "0 28px",
    display: "flex", gap: 4,
    borderBottom: "1px solid var(--line)",
  },
  tab: (active) => ({
    padding: "12px 18px",
    borderBottom: "2px solid " + (active ? "var(--navy-900)" : "transparent"),
    color: active ? "var(--ink-900)" : "var(--ink-500)",
    background: "transparent",
    border: 0, borderRadius: 0,
    fontSize: 14, fontWeight: 500, cursor: "pointer",
    marginBottom: -1,
    display: "inline-flex", alignItems: "center", gap: 8,
  }),

  shell: {
    maxWidth: 1440, margin: "20px auto 60px",
    padding: "0 28px",
  },

  // KPI strip
  kpis: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 },
  kpi: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 14,
    padding: "16px 18px",
  },
  kpiL: { fontSize: 12.5, color: "var(--ink-500)", fontWeight: 500 },
  kpiN: { fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" },
  kpiSub: { fontSize: 11.5, color: "var(--ink-500)", marginTop: 4 },

  // Toolbar
  toolbar: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 18px",
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 12,
    marginBottom: 14,
  },
  toolL: { fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)" },
  toolDate: {
    display: "flex", alignItems: "center", gap: 8,
    border: "1.5px solid var(--line)",
    borderRadius: 9, padding: "0 12px",
    height: 38, fontSize: 13.5,
    background: "var(--paper)",
  },
  toolInput: { border: 0, outline: 0, background: "transparent", fontSize: 13, color: "var(--ink-900)" },
  exportBtn: {
    marginLeft: "auto",
    height: 40, padding: "0 16px",
    borderRadius: 10,
    background: "linear-gradient(180deg, var(--ok-500), var(--ok-700))",
    color: "white", border: 0, cursor: "pointer",
    fontSize: 13.5, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 8,
    boxShadow: "0 6px 16px -6px oklch(0.42 0.10 158 / 0.5)",
  },

  // Company section
  coSection: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 16,
    boxShadow: "var(--shadow-sm)",
    marginBottom: 16,
    overflow: "hidden",
  },
  coHead: {
    padding: "14px 18px",
    borderBottom: "1px solid var(--line-2)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: 12,
    background: "oklch(0.985 0.008 245)",
  },
  coName: {
    display: "inline-flex", alignItems: "center", gap: 10,
    fontWeight: 600, fontSize: 15, color: "var(--ink-900)",
  },
  coDot: (c) => ({ width: 12, height: 12, borderRadius: 3, background: c }),
  coAmt: { fontFamily: "'JetBrains Mono', monospace", fontSize: 17, fontWeight: 600, color: "var(--ink-900)" },
  coMeta: { fontSize: 12, color: "var(--ink-500)", marginLeft: 6, fontWeight: 400 },

  // Bars (método de pago breakdown)
  bars: { padding: "12px 18px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 },
  bar: {
    background: "oklch(0.985 0.008 245)",
    border: "1px solid var(--line-2)",
    borderRadius: 10, padding: "10px 12px",
  },
  barL: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  barName: { fontSize: 12, fontWeight: 500, color: "var(--ink-700)" },
  barAmt: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--ink-900)" },
  barTrack: { marginTop: 8, height: 6, borderRadius: 4, background: "oklch(0.92 0.015 245)", overflow: "hidden" },
  barFill: (pct, hue) => ({ width: pct + "%", height: "100%", background: hue, borderRadius: 4 }),

  // Pago table
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13.5 },
  th: {
    textAlign: "left",
    padding: "10px 18px",
    fontSize: 11, fontWeight: 500,
    color: "var(--ink-500)",
    textTransform: "uppercase", letterSpacing: "0.06em",
    borderTop: "1px solid var(--line-2)",
    borderBottom: "1px solid var(--line-2)",
    background: "var(--paper)",
    whiteSpace: "nowrap",
  },
  td: { padding: "11px 18px", borderBottom: "1px solid var(--line-2)", color: "var(--ink-900)" },

  metPill: (m) => {
    const palette = {
      "Débito automático": { bg: "oklch(0.95 0.04 240)", fg: "oklch(0.42 0.13 250)" },
      "Tarjeta de crédito": { bg: "oklch(0.96 0.04 80)", fg: "oklch(0.45 0.13 55)" },
      "CBU":                 { bg: "oklch(0.95 0.04 280)", fg: "oklch(0.40 0.14 280)" },
      "Transferencia":       { bg: "oklch(0.95 0.04 155)", fg: "oklch(0.42 0.10 158)" },
      "Efectivo":            { bg: "oklch(0.95 0.03 30)",  fg: "oklch(0.45 0.13 30)"  },
    }[m] || { bg: "oklch(0.95 0.012 245)", fg: "var(--ink-700)" };
    return {
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 999,
      fontSize: 12, fontWeight: 500,
      background: palette.bg, color: palette.fg,
    };
  },

  // Totals card
  grandTotal: {
    marginTop: 18,
    padding: "22px 26px",
    background: "linear-gradient(135deg, var(--navy-950), var(--navy-800))",
    color: "white",
    borderRadius: 18,
    display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center",
    boxShadow: "var(--shadow)",
  },
  gtL: { fontSize: 12, color: "oklch(0.85 0.04 240)", letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 600 },
  gtN: { fontFamily: "'JetBrains Mono', monospace", fontSize: 38, fontWeight: 600, letterSpacing: "-0.025em", marginTop: 4 },
  gtSub: { fontSize: 13, color: "oklch(0.85 0.04 240)", marginTop: 6 },
  gtRight: { textAlign: "right", display: "flex", flexDirection: "column", gap: 6 },
  gtChip: {
    display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 8,
    padding: "4px 0", fontSize: 12.5, color: "oklch(0.92 0.04 240)",
  },
  gtChipN: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "white" },

  /* ───────────── Rendición ───────────── */
  renShell: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22,
  },
  renCard: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 16,
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
  },
  renHead: {
    padding: "20px 24px",
    borderBottom: "1px solid var(--line-2)",
  },
  renKicker: { fontSize: 11.5, fontWeight: 600, color: "var(--blue-600)",
               textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 },
  renTitle: { margin: 0, fontSize: 19, letterSpacing: "-0.02em", fontWeight: 600 },
  renSub: { margin: "4px 0 0", color: "var(--ink-500)", fontSize: 13.5 },
  renBody: { padding: "20px 24px" },

  renPreviewBox: {
    background: "linear-gradient(135deg, var(--navy-950), var(--navy-800))",
    color: "white",
    borderRadius: 14,
    padding: "20px 22px",
    marginTop: 14,
  },
  rpL: { fontSize: 11, color: "oklch(0.85 0.04 240)", letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 600 },
  rpRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "oklch(0.92 0.04 240)" },
  rpV: { fontFamily: "'JetBrains Mono', monospace", color: "white", fontWeight: 500 },
  rpTotalRow: { display: "flex", justifyContent: "space-between", paddingTop: 12, marginTop: 10,
                borderTop: "1px solid oklch(1 0 0 / 0.15)", fontSize: 18, color: "white", fontWeight: 600 },
  rpTotal: { fontFamily: "'JetBrains Mono', monospace", fontSize: 26, letterSpacing: "-0.02em" },
};

function Reportes({ onNavigate, onLogout }) {
  const [tab, setTab] = React.useState("pagos");

  // Session
  const session = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("amr_session")) || { role: "am" }; }
    catch(e) { return { role: "am" }; }
  }, []);
  const isAM = session.role !== "vendedor";

  // Vendors list (for AM selector)
  const allVendors = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("amr_vendedores") || "[]").filter(v => v.activo); }
    catch(e) { return []; }
  }, []);

  // Selected context: null = AM own data, vendorId = vendor data
  const [selectedCtx, setSelectedCtx] = React.useState(null);  // null | vendor id

  const ctxLabel = selectedCtx
    ? (allVendors.find(v => v.id === selectedCtx)?.nombre || "Vendedor")
    : (isAM ? "Mis datos (AM)" : session.nombre);

  return (
    <div style={repStyles.page}>
      <Navbar active="reportes" onNavigate={onNavigate} onLogout={onLogout} />
      <div style={repStyles.hero}>
        <div>
          <div style={repStyles.crumb}>Inicio · Reportes</div>
          <h1 style={repStyles.h1}>Reportes</h1>
          <p style={repStyles.sub}>Análisis de cobros por compañía y método, rendiciones y hechos del día.</p>
        </div>
        {/* AM vendor selector */}
        {isAM && allVendors.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 16px" }}>
            <Icon size={15} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>} style={{ color: "var(--ink-500)" }} />
            <span style={{ fontSize: 13, color: "var(--ink-500)", fontWeight: 500 }}>Ver reporte de:</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setSelectedCtx(null)}
                style={{ height: 32, padding: "0 12px", borderRadius: 8, border: "1.5px solid " + (!selectedCtx ? "var(--navy-900)" : "var(--line)"),
                  background: !selectedCtx ? "var(--navy-900)" : "var(--paper)",
                  color: !selectedCtx ? "white" : "var(--ink-700)",
                  fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                Mis datos
              </button>
              {allVendors.map(v => (
                <button key={v.id}
                  onClick={() => setSelectedCtx(v.id)}
                  style={{ height: 32, padding: "0 12px", borderRadius: 8,
                    border: "1.5px solid " + (selectedCtx === v.id ? "var(--navy-900)" : "var(--line)"),
                    background: selectedCtx === v.id ? "var(--navy-900)" : "var(--paper)",
                    color: selectedCtx === v.id ? "white" : "var(--ink-700)",
                    fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                  {v.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={repStyles.tabs}>
        <button style={repStyles.tab(tab === "pagos")} onClick={() => setTab("pagos")}>
          <Icon size={15} d={<><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M6 14h4"/></>} />
          Pagos recibidos
        </button>
        <button style={repStyles.tab(tab === "rendicion")} onClick={() => setTab("rendicion")}>
          <Icon size={15} d={<><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/></>} />
          Rendición
        </button>
        <button style={repStyles.tab(tab === "hechos")} onClick={() => setTab("hechos")}>
          <Icon size={15} d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>} />
          Hechos del día
        </button>
      </div>

      <section style={repStyles.shell}>
        {tab === "pagos" ? <PagosTab selectedCtx={selectedCtx} allVendors={allVendors} isAM={isAM} session={session} /> : tab === "rendicion" ? <RendicionTab selectedCtx={selectedCtx} allVendors={allVendors} isAM={isAM} session={session} /> : <HechosDiaTab selectedCtx={selectedCtx} allVendors={allVendors} isAM={isAM} session={session} />}
      </section>
    </div>
  );
}

// Pagos por vendedor (demo data)
const PAGOS_VENDEDORES = {
  "María García": [
    { fecha: "2026-05-06", hora: "09:10", cliente: "Patricia Vega",     poliza: "AUT-2503-881001", co: "NRE Cia Seguros",          ramo: "Automotor", metodo: "Débito automático", monto: 39200 },
    { fecha: "2026-05-13", hora: "11:25", cliente: "Hugo Castillo",     poliza: "AUT-2508-992213", co: "La Perseverancia Seguros",   ramo: "Automotor", metodo: "Transferencia",      monto: 51800 },
    { fecha: "2026-05-20", hora: "15:10", cliente: "Inés Morales",      poliza: "HOG-2501-330091", co: "Paraná Seguros",          ramo: "Hogar",     metodo: "CBU",                monto: 67500 },
    { fecha: "2026-05-27", hora: "10:45", cliente: "Bernardo Fuentes",  poliza: "VID-2404-110822", co: "Libra", ramo: "Vida",   metodo: "Tarjeta de crédito", monto: 29900 },
    { fecha: "2026-06-12", hora: "09:55", cliente: "Patricia Vega",     poliza: "AUT-2503-881001", co: "NRE Cia Seguros",          ramo: "Automotor", metodo: "Débito automático", monto: 39200 },
    { fecha: "2026-06-12", hora: "14:30", cliente: "Hugo Castillo",     poliza: "AUT-2508-992213", co: "La Perseverancia Seguros",   ramo: "Automotor", metodo: "Transferencia",      monto: 51800 },
  ],
  "Carlos López": [
    { fecha: "2026-05-01", hora: "08:40", cliente: "Ramón Ibarra",      poliza: "AUT-2412-557009", co: "NRE Cia Seguros",           ramo: "Automotor", metodo: "Débito automático", monto: 44100 },
    { fecha: "2026-05-16", hora: "13:05", cliente: "Lorena Pinto",      poliza: "COM-2506-774401", co: "ATM Seguros",    ramo: "Comercio",  metodo: "Efectivo",          monto: 93000 },
    { fecha: "2026-05-24", hora: "16:30", cliente: "Ramón Ibarra",      poliza: "AUT-2412-557009", co: "NRE Cia Seguros",           ramo: "Automotor", metodo: "Débito automático", monto: 44100 },
    { fecha: "2026-06-12", hora: "11:00", cliente: "Lorena Pinto",      poliza: "COM-2506-774401", co: "ATM Seguros",    ramo: "Comercio",  metodo: "Efectivo",          monto: 93000 },
  ],
};

function getPagosForCtx(selectedCtx, allVendors, isAM, session) {
  if (!isAM) {
    // Vendor: show only their own data
    return PAGOS_VENDEDORES[session.nombre] || [];
  }
  if (!selectedCtx) return PAGOS; // AM own data
  const vName = allVendors.find(v => v.id === selectedCtx)?.nombre;
  return PAGOS_VENDEDORES[vName] || [];
}

/* ─────────────────────── Pagos tab ─────────────────────── */

function PagosTab({ selectedCtx, allVendors, isAM, session }) {
  // Range default: month of May 2026 (where the mock data lives)
  const [from, setFrom] = React.useState("2026-05-01");
  const [to, setTo]     = React.useState("2026-05-31");

  const pagosCtx = getPagosForCtx(selectedCtx, allVendors, isAM, session);
  const filtered = pagosCtx.filter(p => p.fecha >= from && p.fecha <= to);
  const byCo = {};
  for (const p of filtered) {
    if (!byCo[p.co]) byCo[p.co] = { total: 0, items: [], met: {} };
    byCo[p.co].total += p.monto;
    byCo[p.co].items.push(p);
    byCo[p.co].met[p.metodo] = (byCo[p.co].met[p.metodo] || 0) + p.monto;
  }
  const cos = Object.keys(byCo).sort((a, b) => byCo[b].total - byCo[a].total);
  const grandTotal = filtered.reduce((a, p) => a + p.monto, 0);

  // Aggregate methods overall
  const totalMethods = {};
  for (const p of filtered) totalMethods[p.metodo] = (totalMethods[p.metodo] || 0) + p.monto;

  const exportXlsx = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1 — Detalle
    const detail = [
      ["Reporte de pagos recibidos"],
      ["Período", `${fmtDate(from)} – ${fmtDate(to)}`],
      [],
      ["Fecha", "Cliente", "Póliza", "Compañía", "Ramo", "Método de pago", "Monto"],
      ...filtered.map(p => [fmtDate(p.fecha), p.cliente, p.poliza, p.co, p.ramo, p.metodo, p.monto]),
      [],
      ["", "", "", "", "", "TOTAL", grandTotal],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(detail);
    ws1["!cols"] = [{ wch: 12 }, { wch: 26 }, { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 22 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Detalle");

    // Sheet 2 — Por compañía
    const byCompany = [["Compañía", "Cantidad", "Total"]];
    cos.forEach(co => byCompany.push([co, byCo[co].items.length, byCo[co].total]));
    byCompany.push([]);
    byCompany.push(["TOTAL", filtered.length, grandTotal]);
    const ws2 = XLSX.utils.aoa_to_sheet(byCompany);
    ws2["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Por compañía");

    // Sheet 3 — Por método
    const byMethod = [["Método de pago", "Total"]];
    Object.entries(totalMethods).forEach(([m, v]) => byMethod.push([m, v]));
    byMethod.push([]);
    byMethod.push(["TOTAL", grandTotal]);
    const ws3 = XLSX.utils.aoa_to_sheet(byMethod);
    ws3["!cols"] = [{ wch: 22 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Por método");

    XLSX.writeFile(wb, `AMR-Pagos-${from}_a_${to}.xlsx`);
  };

  return (
    <>
      <div style={repStyles.kpis}>
        <div style={repStyles.kpi}>
          <div style={repStyles.kpiL}>Total cobrado</div>
          <div style={repStyles.kpiN}>{fmtPeso(grandTotal)}</div>
          <div style={repStyles.kpiSub}>{filtered.length} pagos registrados</div>
        </div>
        <div style={repStyles.kpi}>
          <div style={repStyles.kpiL}>Compañías con cobro</div>
          <div style={repStyles.kpiN}>{cos.length}</div>
          <div style={repStyles.kpiSub}>de {REP_COMPANIES.length} aseguradoras</div>
        </div>
        <div style={repStyles.kpi}>
          <div style={repStyles.kpiL}>Ticket promedio</div>
          <div style={repStyles.kpiN}>{filtered.length ? fmtPeso(Math.round(grandTotal / filtered.length)) : fmtPeso(0)}</div>
          <div style={repStyles.kpiSub}>por pago</div>
        </div>
        <div style={repStyles.kpi}>
          <div style={repStyles.kpiL}>Método principal</div>
          <div style={{ ...repStyles.kpiN, fontSize: 17, fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>
            {Object.keys(totalMethods).sort((a, b) => totalMethods[b] - totalMethods[a])[0] || "—"}
          </div>
          <div style={repStyles.kpiSub}>
            {(() => {
              const top = Object.keys(totalMethods).sort((a, b) => totalMethods[b] - totalMethods[a])[0];
              return top ? `${Math.round((totalMethods[top] / grandTotal) * 100)}% del total` : "Sin datos";
            })()}
          </div>
        </div>
      </div>

      <div style={repStyles.toolbar}>
        <span style={repStyles.toolL}>Período</span>
        <div style={repStyles.toolDate}>
          <IconCal size={15} style={{ color: "var(--ink-400)" }} />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={repStyles.toolInput} />
          <span style={{ color: "var(--ink-400)" }}>→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={repStyles.toolInput} />
        </div>
        <button style={repStyles.exportBtn} onClick={exportXlsx}>
          <IconDown size={15} /> Exportar Excel
        </button>
      </div>

      {cos.length === 0 && (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ink-500)",
                      background: "var(--paper)", border: "1px solid var(--line)",
                      borderRadius: 16, fontSize: 14 }}>
          No hay cobros registrados en el período seleccionado.
        </div>
      )}

      {cos.map((co) => {
        const data = byCo[co];
        const company = REP_COMPANIES.find(c => c.n === co) || { c: "var(--ink-400)" };
        const maxMet = Math.max(...Object.values(data.met));
        return (
          <div key={co} style={repStyles.coSection}>
            <div style={repStyles.coHead}>
              <div style={repStyles.coName}>
                <span style={repStyles.coDot(company.c)} />
                {co}
                <span style={repStyles.coMeta}>· {data.items.length} cobros</span>
              </div>
              <div style={repStyles.coAmt}>{fmtPeso(data.total)}</div>
            </div>

            {/* Method breakdown bars */}
            <div style={repStyles.bars}>
              {Object.entries(data.met)
                .sort((a, b) => b[1] - a[1])
                .map(([m, v]) => (
                  <div key={m} style={repStyles.bar}>
                    <div style={repStyles.barL}>
                      <span style={repStyles.barName}>{m}</span>
                      <span style={repStyles.barAmt}>{fmtPeso(v)}</span>
                    </div>
                    <div style={repStyles.barTrack}>
                      <div style={repStyles.barFill((v / maxMet) * 100, company.c)} />
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-500)" }}>
                      {Math.round((v / data.total) * 100)}% del total
                    </div>
                  </div>
                ))}
            </div>

            <table style={{ ...repStyles.table, marginTop: 14 }}>
              <thead>
                <tr>
                  <th style={repStyles.th}>Fecha</th>
                  <th style={repStyles.th}>Cliente</th>
                  <th style={repStyles.th}>Póliza</th>
                  <th style={repStyles.th}>Ramo</th>
                  <th style={repStyles.th}>Método</th>
                  <th style={{ ...repStyles.th, textAlign: "right" }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p, i) => (
                  <tr key={i}>
                    <td style={{ ...repStyles.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>{fmtDate(p.fecha)}</td>
                    <td style={{ ...repStyles.td, fontWeight: 500 }}>{p.cliente}</td>
                    <td style={{ ...repStyles.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>{p.poliza}</td>
                    <td style={{ ...repStyles.td, color: "var(--ink-700)" }}>{p.ramo}</td>
                    <td style={repStyles.td}><span style={repStyles.metPill(p.metodo)}>{p.metodo}</span></td>
                    <td style={{ ...repStyles.td, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{fmtPeso(p.monto)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="5" style={{ ...repStyles.td, textAlign: "right", color: "var(--ink-700)", fontWeight: 600, background: "oklch(0.985 0.008 245)" }}>
                    Subtotal {co}
                  </td>
                  <td style={{ ...repStyles.td, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, background: "oklch(0.985 0.008 245)" }}>
                    {fmtPeso(data.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      {cos.length > 0 && (
        <div style={repStyles.grandTotal}>
          <div>
            <div style={repStyles.gtL}>Total general consolidado</div>
            <div style={repStyles.gtN}>{fmtPeso(grandTotal)}</div>
            <div style={repStyles.gtSub}>
              {filtered.length} pagos · {cos.length} compañías · período {fmtDate(from)} – {fmtDate(to)}
            </div>
          </div>
          <div style={repStyles.gtRight}>
            <div style={repStyles.gtChip}>
              Débito automático <span style={repStyles.gtChipN}>{fmtPeso(totalMethods["Débito automático"] || 0)}</span>
            </div>
            <div style={repStyles.gtChip}>
              Tarjeta de crédito <span style={repStyles.gtChipN}>{fmtPeso(totalMethods["Tarjeta de crédito"] || 0)}</span>
            </div>
            <div style={repStyles.gtChip}>
              Transferencia <span style={repStyles.gtChipN}>{fmtPeso(totalMethods["Transferencia"] || 0)}</span>
            </div>
            <div style={repStyles.gtChip}>
              CBU <span style={repStyles.gtChipN}>{fmtPeso(totalMethods["CBU"] || 0)}</span>
            </div>
            <div style={repStyles.gtChip}>
              Efectivo <span style={repStyles.gtChipN}>{fmtPeso(totalMethods["Efectivo"] || 0)}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────── Rendición tab ─────────────────────── */

function RendicionTab({ selectedCtx, allVendors, isAM, session }) {
  const [compania, setCompania] = React.useState("NRE Cia Seguros");
  const [from, setFrom] = React.useState("2026-05-01");
  const [to, setTo]     = React.useState("2026-05-31");
  const [pct, setPct]   = React.useState(15);
  const [coOpen, setCoOpen] = React.useState(false);
  const coRef = React.useRef(null);

  const pagosCtx = getPagosForCtx(selectedCtx, allVendors, isAM, session);

  React.useEffect(() => {
    const h = (e) => { if (coRef.current && !coRef.current.contains(e.target)) setCoOpen(false); };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  const items = pagosCtx.filter(p => p.co === compania && p.fecha >= from && p.fecha <= to);
  const total = items.reduce((a, p) => a + p.monto, 0);
  const comision = Math.round(total * (pct / 100));
  const liquidar = total - comision;
  const compMeta = REP_COMPANIES.find(c => c.n === compania) || { c: "var(--ink-400)" };

  const exportXlsx = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ["Rendición de pagos"],
      ["Compañía", compania],
      ["Período", `${fmtDate(from)} – ${fmtDate(to)}`],
      ["Comisión productor", pct + " %"],
      [],
      ["Fecha", "Cliente", "Póliza", "Ramo", "Método de pago", "Monto cobrado"],
      ...items.map(p => [fmtDate(p.fecha), p.cliente, p.poliza, p.ramo, p.metodo, p.monto]),
      [],
      ["", "", "", "", "Total cobrado", total],
      ["", "", "", "", `Comisión productor (${pct}%)`, -comision],
      ["", "", "", "", "Total a liquidar a la compañía", liquidar],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 12 }, { wch: 28 }, { wch: 22 }, { wch: 12 }, { wch: 24 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, "Rendición");
    XLSX.writeFile(wb, `AMR-Rendicion-${compania.replace(/\s/g, "_")}-${from}_a_${to}.xlsx`);
  };

  return (
    <div style={repStyles.renShell}>
      {/* Form card */}
      <div style={repStyles.renCard}>
        <div style={repStyles.renHead}>
          <div style={repStyles.renKicker}>Rendición · Liquidación</div>
          <h2 style={repStyles.renTitle}>Parámetros de la rendición</h2>
          <p style={repStyles.renSub}>Seleccioná la compañía y el rango de fechas. La comisión queda definida por el % del productor.</p>
        </div>
        <div style={repStyles.renBody}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 8 }}>
            Compañía <span style={{ color: "var(--bad-700)" }}>*</span>
          </div>
          <div ref={coRef} style={{ position: "relative", marginBottom: 16 }}>
            <div onClick={() => setCoOpen(o => !o)}
                 style={{
                   display: "flex", alignItems: "center", gap: 10,
                   padding: "0 14px", height: 46,
                   border: "1.5px solid " + (coOpen ? "var(--blue-500)" : "var(--line)"),
                   boxShadow: coOpen ? "0 0 0 4px oklch(0.62 0.16 243 / 0.12)" : "none",
                   borderRadius: 10, cursor: "pointer", background: "var(--paper)",
                 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: compMeta.c }} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{compania}</span>
              <IconChevD size={16} style={{ color: "var(--ink-400)", transform: coOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </div>
            {coOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                background: "var(--paper)", border: "1px solid var(--line)",
                borderRadius: 10, boxShadow: "var(--shadow-lg)", padding: 4, zIndex: 20,
                maxHeight: 280, overflowY: "auto",
              }}>
                {REP_COMPANIES.map(c => (
                  <div key={c.n}
                       onClick={() => { setCompania(c.n); setCoOpen(false); }}
                       style={{
                         padding: "9px 12px", borderRadius: 7, cursor: "pointer",
                         display: "flex", alignItems: "center", gap: 10,
                         fontSize: 13.5,
                         background: compania === c.n ? "var(--blue-100)" : "transparent",
                       }}
                       onMouseEnter={(e) => { if (compania !== c.n) e.currentTarget.style.background = "var(--blue-50)"; }}
                       onMouseLeave={(e) => { if (compania !== c.n) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: c.c }} />
                    <span style={{ flex: 1 }}>{c.n}</span>
                    {compania === c.n && <IconCheck size={14} style={{ color: "var(--blue-600)" }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 8 }}>Desde</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", border: "1.5px solid var(--line)", borderRadius: 10, padding: "0 12px", height: 46 }}>
                <IconCal size={15} style={{ color: "var(--ink-400)" }} />
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                       style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14 }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 8 }}>Hasta</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", border: "1.5px solid var(--line)", borderRadius: 10, padding: "0 12px", height: 46 }}>
                <IconCal size={15} style={{ color: "var(--ink-400)" }} />
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                       style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14 }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>Comisión del productor</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--navy-900)" }}>{pct} %</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="range" min="0" max="40" step="0.5" value={pct}
                     onChange={(e) => setPct(parseFloat(e.target.value))}
                     style={{ flex: 1, accentColor: "var(--navy-900)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 4,
                            border: "1.5px solid var(--line)", borderRadius: 9, padding: "0 12px", height: 38 }}>
                <input type="number" value={pct} step="0.5" min="0" max="100"
                       onChange={(e) => setPct(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                       style={{ width: 50, border: 0, outline: 0, background: "transparent", fontSize: 14, fontFamily: "'JetBrains Mono', monospace", textAlign: "right" }} />
                <span style={{ color: "var(--ink-500)" }}>%</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              {[10, 15, 20, 25].map(p => (
                <button key={p} onClick={() => setPct(p)}
                        style={{
                          padding: "5px 11px", borderRadius: 999,
                          border: "1px solid " + (pct === p ? "var(--navy-900)" : "var(--line)"),
                          background: pct === p ? "var(--navy-900)" : "var(--paper)",
                          color: pct === p ? "white" : "var(--ink-700)",
                          fontSize: 12, fontWeight: 500, cursor: "pointer",
                        }}>{p}%</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--line-2)",
          background: "oklch(0.985 0.008 245)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>
            {items.length} cobros encontrados en el período
          </div>
          <button style={repStyles.exportBtn} onClick={exportXlsx} disabled={items.length === 0}>
            <IconDown size={15} /> Generar y exportar Excel
          </button>
        </div>
      </div>

      {/* Preview card */}
      <div style={repStyles.renCard}>
        <div style={repStyles.renHead}>
          <div style={repStyles.renKicker}>Vista previa</div>
          <h2 style={repStyles.renTitle}>{compania}</h2>
          <p style={repStyles.renSub}>
            <span className="mono">{fmtDate(from)}</span> al <span className="mono">{fmtDate(to)}</span>
          </p>
        </div>
        <div style={repStyles.renBody}>
          {/* Item list — compact */}
          <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10 }}>
            {items.length === 0 ? (
              <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--ink-500)", fontSize: 13.5 }}>
                No hay cobros para esta compañía en el período seleccionado.
              </div>
            ) : items.map((p, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "70px 1fr auto", alignItems: "center",
                gap: 10, padding: "10px 14px",
                borderBottom: i < items.length - 1 ? "1px solid var(--line-2)" : 0,
                fontSize: 13,
              }}>
                <span className="mono" style={{ fontSize: 12, color: "var(--ink-500)" }}>{fmtDate(p.fecha)}</span>
                <div>
                  <div style={{ fontWeight: 500, color: "var(--ink-900)" }}>{p.cliente}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>{p.metodo}</div>
                </div>
                <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{fmtPeso(p.monto)}</span>
              </div>
            ))}
          </div>

          {/* Summary block */}
          <div style={repStyles.renPreviewBox}>
            <div style={repStyles.rpL}>Liquidación</div>
            <div style={{ marginTop: 10 }}>
              <div style={repStyles.rpRow}>
                <span>Total cobrado</span>
                <span style={repStyles.rpV}>{fmtPeso(total)}</span>
              </div>
              <div style={repStyles.rpRow}>
                <span>Comisión productor ({pct}%)</span>
                <span style={repStyles.rpV}>− {fmtPeso(comision)}</span>
              </div>
              <div style={repStyles.rpTotalRow}>
                <span>A rendir a la compañía</span>
                <span style={repStyles.rpTotal}>{fmtPeso(liquidar)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Hechos del día ─────────────────────── */

function HechosDiaTab({ selectedCtx, allVendors, isAM, session }) {
  const today = "2026-06-12";
  const [fecha, setFecha] = React.useState(today);
  const [horaDesde, setHoraDesde] = React.useState("00:00");
  const [horaHasta, setHoraHasta] = React.useState("23:59");

  const pagosCtx = getPagosForCtx(selectedCtx, allVendors, isAM, session);

  const filtered = React.useMemo(() => {
    return pagosCtx
      .filter(p => p.fecha === fecha && p.hora >= horaDesde && p.hora <= horaHasta)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [pagosCtx, fecha, horaDesde, horaHasta]);

  const total = filtered.reduce((a, p) => a + p.monto, 0);

  const metodosUsados = React.useMemo(() => {
    const m = {};
    filtered.forEach(p => m[p.metodo] = (m[p.metodo] || 0) + p.monto);
    return m;
  }, [filtered]);

  const exportXlsx = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ["Hechos del día — Cuotas pagadas"],
      ["Fecha", fmtDate(fecha)],
      ["Rango horario", `${horaDesde} – ${horaHasta}`],
      ["Generado el", new Date().toLocaleString("es-AR")],
      [],
      ["Hora", "Cliente", "Póliza", "Compañía", "Ramo", "Método de pago", "Monto", "Enviado por"],
      ...filtered.map(p => [p.hora, p.cliente, p.poliza, p.co, p.ramo, p.metodo, p.monto, envioDe(p)]),
      [],
      ["", "", "", "", "", "TOTAL", total, ""],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 8 }, { wch: 26 }, { wch: 22 }, { wch: 22 }, { wch: 12 }, { wch: 24 }, { wch: 16 }, { wch: 16 }];

    // Estilo negrita en header
    ["A1", "A6", "B6", "C6", "D6", "E6", "F6", "G6", "H6"].forEach(cell => {
      if (ws[cell]) ws[cell].s = { font: { bold: true } };
    });

    XLSX.utils.book_append_sheet(wb, ws, "Hechos del día");
    XLSX.writeFile(wb, `AMR-Hechos-${fecha}-${horaDesde.replace(":","h")}-${horaHasta.replace(":","h")}.xlsx`);
  };

  const presets = [
    { l: "Mañana",   d: "08:00", h: "12:59" },
    { l: "Tarde",    d: "13:00", h: "17:59" },
    { l: "Todo el día", d: "00:00", h: "23:59" },
  ];

  return (
    <>
      {/* Toolbar */}
      <div style={{ ...repStyles.toolbar, flexWrap: "wrap", gap: 12, padding: "14px 18px" }}>
        {/* Fecha */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={repStyles.toolL}>Fecha</span>
          <div style={{ ...repStyles.toolDate }}>
            <IconCal size={15} style={{ color: "var(--ink-400)" }} />
            <input type="date" value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              style={repStyles.toolInput} />
          </div>
        </div>

        {/* Rango horario */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={repStyles.toolL}>Desde</span>
          <div style={repStyles.toolDate}>
            <Icon size={15} d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>} style={{ color: "var(--ink-400)" }} />
            <input type="time" value={horaDesde}
              onChange={(e) => setHoraDesde(e.target.value)}
              style={repStyles.toolInput} />
          </div>
          <span style={repStyles.toolL}>Hasta</span>
          <div style={repStyles.toolDate}>
            <Icon size={15} d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>} style={{ color: "var(--ink-400)" }} />
            <input type="time" value={horaHasta}
              onChange={(e) => setHoraHasta(e.target.value)}
              style={repStyles.toolInput} />
          </div>
        </div>

        {/* Presets */}
        <div style={{ display: "flex", gap: 6 }}>
          {presets.map(p => (
            <button key={p.l}
              onClick={() => { setHoraDesde(p.d); setHoraHasta(p.h); }}
              style={{
                height: 34, padding: "0 12px", borderRadius: 8,
                border: "1px solid " + (horaDesde === p.d && horaHasta === p.h ? "var(--navy-900)" : "var(--line)"),
                background: horaDesde === p.d && horaHasta === p.h ? "var(--navy-900)" : "var(--paper)",
                color: horaDesde === p.d && horaHasta === p.h ? "white" : "var(--ink-700)",
                fontSize: 12.5, fontWeight: 500, cursor: "pointer"
              }}>{p.l}</button>
          ))}
        </div>

        <button style={{ ...repStyles.exportBtn, marginLeft: "auto" }}
          onClick={exportXlsx} disabled={filtered.length === 0}>
          <IconDown size={15} /> Exportar Excel
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <div style={repStyles.kpi}>
          <div style={repStyles.kpiL}>Total cobrado</div>
          <div style={repStyles.kpiN}>{fmtPeso(total)}</div>
          <div style={repStyles.kpiSub}>{filtered.length} pagos · {fmtDate(fecha)}</div>
        </div>
        <div style={repStyles.kpi}>
          <div style={repStyles.kpiL}>Cantidad de cobros</div>
          <div style={repStyles.kpiN}>{filtered.length}</div>
          <div style={repStyles.kpiSub}>{horaDesde} – {horaHasta} hs</div>
        </div>
        <div style={repStyles.kpi}>
          <div style={repStyles.kpiL}>Ticket promedio</div>
          <div style={repStyles.kpiN}>{filtered.length ? fmtPeso(Math.round(total / filtered.length)) : fmtPeso(0)}</div>
          <div style={repStyles.kpiSub}>por cuota</div>
        </div>
        <div style={repStyles.kpi}>
          <div style={repStyles.kpiL}>Método principal</div>
          <div style={{ ...repStyles.kpiN, fontSize: 15, fontFamily: "'DM Sans', sans-serif", marginTop: 8 }}>
            {Object.keys(metodosUsados).sort((a, b) => metodosUsados[b] - metodosUsados[a])[0] || "—"}
          </div>
          <div style={repStyles.kpiSub}>
            {Object.keys(metodosUsados).length ? `${Math.round((metodosUsados[Object.keys(metodosUsados).sort((a,b) => metodosUsados[b]-metodosUsados[a])[0]] / total) * 100)}% del total` : "Sin datos"}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ink-500)", fontSize: 14 }}>
            No hay cobros registrados para el período seleccionado.
          </div>
        ) : (
          <table style={repStyles.table}>
            <thead>
              <tr>
                <th style={repStyles.th}>Hora</th>
                <th style={repStyles.th}>Cliente</th>
                <th style={repStyles.th}>Póliza</th>
                <th style={repStyles.th}>Compañía</th>
                <th style={repStyles.th}>Ramo</th>
                <th style={repStyles.th}>Método</th>
                <th style={{ ...repStyles.th, textAlign: "right" }}>Monto</th>
                <th style={repStyles.th}>Enviado por</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const co = REP_COMPANIES.find(c => c.n === p.co) || { c: "var(--ink-400)" };
                return (
                  <tr key={i}>
                    <td style={{ ...repStyles.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: "var(--blue-700)" }}>
                      {p.hora} hs
                    </td>
                    <td style={{ ...repStyles.td, fontWeight: 500 }}>{p.cliente}</td>
                    <td style={{ ...repStyles.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>{p.poliza}</td>
                    <td style={repStyles.td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: co.c, flexShrink: 0 }} />
                        {p.co}
                      </span>
                    </td>
                    <td style={{ ...repStyles.td, color: "var(--ink-700)" }}>{p.ramo}</td>
                    <td style={repStyles.td}><span style={repStyles.metPill(p.metodo)}>{p.metodo}</span></td>
                    <td style={{ ...repStyles.td, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                      {fmtPeso(p.monto)}
                    </td>
                    <td style={repStyles.td}>
                      {(() => {
                        const env = envioDe(p);
                        const wa = env === "WhatsApp";
                        return (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                            background: wa ? "oklch(0.95 0.05 150)" : "var(--blue-100)",
                            color: wa ? "oklch(0.45 0.13 150)" : "var(--navy-900)" }}>
                            {wa
                              ? <Icon size={12} d={<><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z"/><path d="M8.5 7.5c.3 0 .6 0 .8.6l.7 1.7c.1.3 0 .5-.1.7l-.5.6c-.2.2-.2.4-.1.6.5 1 1.5 2 2.6 2.4.3.1.5.1.7-.1l.5-.6c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.4.4.7 0 1.1-.9 2-2 2-3.6 0-7-3.4-7-7 0-1.1.9-2 2-2z" fill="currentColor" stroke="none"/></>} />
                              : <Icon size={12} d={<><circle cx="12" cy="12" r="9"/><path d="M2 12h20M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>} />
                            }
                            {env}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
              {/* Totales */}
              <tr>
                <td colSpan="6" style={{ ...repStyles.td, textAlign: "right", fontWeight: 600, color: "var(--ink-700)", background: "oklch(0.985 0.008 245)" }}>
                  Total del período
                </td>
                <td style={{ ...repStyles.td, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 15, background: "oklch(0.985 0.008 245)" }}>
                  {fmtPeso(total)}
                </td>
                <td style={{ ...repStyles.td, background: "oklch(0.985 0.008 245)" }}></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

window.Reportes = Reportes;
