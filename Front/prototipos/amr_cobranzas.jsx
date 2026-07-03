// AMR — Cobranzas
// Vista de cobranzas: lista de asegurados + panel lateral con detalle de p\u00f3liza, cuotas,
// pago (con comprobante imprimible) y renovaci\u00f3n cuando las 3 cuotas est\u00e1n pagas.

const COB_COMPANIES = getCompanias();

const SEED = [
  {
    id: 1, cliente: "Martín Acosta", dni: "30.123.456", tel: "+54 11 5554-1234",
    email: "macosta@gmail.com", poliza: "AUT-2410-887143", ramo: "Automotor", co: 0,
    bien: "Volkswagen Gol Trend 1.6 · 2021", patente: "AB 421 KS",
    periodo: "Mensual", inicio: "10 Mar 2026",
    cobertura: "Terceros Completo Premium",
    cuotas: [
      { n: 1, ven: "10/03/2026", monto: 38500, estado: "pagada",    pago: "08/03/2026" },
      { n: 2, ven: "10/04/2026", monto: 38500, estado: "pagada",    pago: "10/04/2026" },
      { n: 3, ven: "10/05/2026", monto: 38500, estado: "pendiente"                      },
    ],
  },
  {
    id: 2, cliente: "Lucía Fernández", dni: "32.998.114", tel: "+54 11 5566-2210",
    email: "lucia.fernandez@hotmail.com", poliza: "HOG-2510-002411", ramo: "Hogar", co: 2,
    bien: "Casa habitación · 3 amb.", patente: "—",
    periodo: "Trimestral", inicio: "03 Feb 2026",
    cobertura: "Hogar Premium",
    cuotas: [
      { n: 1, ven: "03/02/2026", monto: 78900, estado: "pagada", pago: "02/02/2026" },
      { n: 2, ven: "03/05/2026", monto: 78900, estado: "pagada", pago: "03/05/2026" },
      { n: 3, ven: "03/08/2026", monto: 78900, estado: "pagada", pago: "01/08/2026" },
    ],
  },
  {
    id: 3, cliente: "Ricardo Pérez", dni: "28.554.012", tel: "+54 351 6677-1122",
    email: "rperez@empresa.com.ar", poliza: "AUT-2509-114902", ramo: "Automotor", co: 1,
    bien: "Toyota Corolla XEi · 2019", patente: "PFG 882",
    periodo: "Mensual", inicio: "02 Abr 2026",
    cobertura: "Todo Riesgo c/Franquicia",
    cuotas: [
      { n: 1, ven: "02/04/2026", monto: 52400, estado: "pagada",    pago: "01/04/2026" },
      { n: 2, ven: "02/05/2026", monto: 52400, estado: "vencida"                       },
      { n: 3, ven: "02/06/2026", monto: 52400, estado: "pendiente"                     },
    ],
  },
  {
    id: 4, cliente: "Federico Bianchi", dni: "29.812.443", tel: "+54 11 5511-9988",
    email: "fbianchi@yahoo.com.ar", poliza: "AUT-2401-558204", ramo: "Automotor", co: 0,
    bien: "Ford Focus Titanium · 2018", patente: "AC 991 XT",
    periodo: "Mensual", inicio: "04 Mar 2026",
    cobertura: "Terceros Completo",
    cuotas: [
      { n: 1, ven: "04/03/2026", monto: 45200, estado: "pagada",  pago: "04/03/2026" },
      { n: 2, ven: "04/04/2026", monto: 45200, estado: "vencida"                     },
      { n: 3, ven: "04/05/2026", monto: 45200, estado: "vencida"                     },
    ],
  },
  {
    id: 5, cliente: "Sofía Romero", dni: "31.227.891", tel: "+54 11 5520-7711",
    email: "sofia.romero@me.com", poliza: "AUT-2506-339118", ramo: "Automotor", co: 4,
    bien: "Fiat Cronos Drive · 2022", patente: "KQA 312",
    periodo: "Mensual", inicio: "18 Abr 2026",
    cobertura: "Todo Riesgo",
    cuotas: [
      { n: 1, ven: "18/04/2026", monto: 41750, estado: "pagada", pago: "17/04/2026" },
      { n: 2, ven: "18/05/2026", monto: 41750, estado: "pagada", pago: "18/05/2026" },
      { n: 3, ven: "18/06/2026", monto: 41750, estado: "pagada", pago: "16/06/2026" },
    ],
  },
  {
    id: 6, cliente: "Diego Molina", dni: "33.401.226", tel: "+54 261 4488-3300",
    email: "dmolina@mendoza.com.ar", poliza: "AUT-2508-217733", ramo: "Automotor", co: 3,
    bien: "Chevrolet Onix LT · 2023", patente: "AE 102 PH",
    periodo: "Mensual", inicio: "10 Abr 2026",
    cobertura: "Terceros Completo",
    cuotas: [
      { n: 1, ven: "10/04/2026", monto: 36900, estado: "pagada",    pago: "09/04/2026" },
      { n: 2, ven: "10/05/2026", monto: 36900, estado: "pagada",    pago: "10/05/2026" },
      { n: 3, ven: "10/06/2026", monto: 36900, estado: "pendiente"                     },
    ],
  },
  {
    id: 7, cliente: "Valentina Ortiz", dni: "34.118.557", tel: "+54 11 5588-4422",
    email: "valeortiz@gmail.com", poliza: "AUT-2502-009912", ramo: "Automotor", co: 2,
    bien: "Renault Sandero Stepway · 2020", patente: "AD 778 LR",
    periodo: "Mensual", inicio: "15 Feb 2026",
    cobertura: "Terceros Completo",
    cuotas: [
      { n: 1, ven: "15/02/2026", monto: 33200, estado: "pagada",    pago: "14/02/2026" },
      { n: 2, ven: "15/03/2026", monto: 33200, estado: "pagada",    pago: "15/03/2026" },
      { n: 3, ven: "15/04/2026", monto: 33200, estado: "pendiente"                     },
    ],
  },
];

const fmt = (n) => "$ " + n.toLocaleString("es-AR");

// ─── Sesión y anulaciones ───
function cobSession() {
  try { return JSON.parse(localStorage.getItem("amr_session")) || { role: "am", nombre: "AM" }; }
  catch(e) { return { role: "am", nombre: "AM" }; }
}
function cobReadAnul() {
  try { return JSON.parse(localStorage.getItem("amr_anulaciones") || "[]"); } catch(e) { return []; }
}
function cobWriteAnul(list) { localStorage.setItem("amr_anulaciones", JSON.stringify(list)); }
function cobReadAplicadas() {
  try { return JSON.parse(localStorage.getItem("amr_anulaciones_aplicadas") || "[]"); } catch(e) { return []; }
}
function cobWriteEnvio(poliza, fecha, via) {
  try {
    const env = JSON.parse(localStorage.getItem("amr_envios") || "{}");
    env[poliza + "|" + fecha] = via;
    localStorage.setItem("amr_envios", JSON.stringify(env));
  } catch(e) {}
}
const todayISO = () => new Date().toISOString().slice(0, 10);
const sumStatus = (cuotas) => {
  const paid = cuotas.filter(c => c.estado === "pagada").length;
  const overdue = cuotas.filter(c => c.estado === "vencida").length;
  const pend = cuotas.filter(c => c.estado === "pendiente").length;
  if (paid === cuotas.length) return { k: "aldia",     l: "Al día"      };
  if (overdue > 0)            return { k: "morosa",    l: "Con deuda"   };
  return                            { k: "encurso",   l: "En curso"    };
};

const cobStyles = {
  page: { background: "var(--canvas)", minHeight: "100vh" },

  hero: {
    maxWidth: 1440, margin: "0 auto",
    padding: "32px 28px 12px",
    display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24,
  },
  crumb: { fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 },
  h1: { margin: 0, fontSize: 30, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" },
  sub: { margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14.5 },

  kpis: { display: "flex", gap: 8 },
  kpi: (tone) => {
    const palette = {
      red:   { bg: "var(--bad-100)",  fg: "var(--bad-700)",  dot: "var(--bad-500)"  },
      amber: { bg: "var(--warn-100)", fg: "var(--warn-700)", dot: "var(--warn-500)" },
      green: { bg: "var(--ok-100)",   fg: "var(--ok-700)",   dot: "var(--ok-500)"   },
    }[tone];
    return {
      display: "inline-flex", alignItems: "center", gap: 10,
      background: palette.bg, color: palette.fg,
      padding: "10px 14px", borderRadius: 10,
      fontSize: 13.5, fontWeight: 500,
    };
  },
  kpiDot: (tone) => ({
    width: 8, height: 8, borderRadius: "50%",
    background: { red: "var(--bad-500)", amber: "var(--warn-500)", green: "var(--ok-500)" }[tone],
  }),
  kpiN: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 15 },

  // Big search
  searchWrap: {
    maxWidth: 1440, margin: "0 auto",
    padding: "16px 28px 8px",
    display: "flex", gap: 10, alignItems: "center",
  },
  searchBig: (focused) => ({
    flex: 1,
    display: "flex", alignItems: "center", gap: 12,
    background: "var(--paper)",
    border: "1.5px solid " + (focused ? "var(--blue-500)" : "var(--line)"),
    boxShadow: focused ? "0 0 0 4px oklch(0.62 0.16 243 / 0.12)" : "var(--shadow-sm)",
    borderRadius: 12,
    padding: "0 18px",
    height: 56,
    transition: "all .15s",
  }),
  searchInput: {
    flex: 1, border: 0, outline: 0, background: "transparent",
    fontSize: 16, color: "var(--ink-900)",
    height: "100%",
  },
  searchHint: { fontSize: 12.5, color: "var(--ink-400)" },
  chip: (active) => ({
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    border: "1.5px solid " + (active ? "var(--navy-900)" : "var(--line)"),
    background: active ? "var(--navy-900)" : "var(--paper)",
    color: active ? "white" : "var(--ink-700)",
    cursor: "pointer",
    height: 44,
    display: "inline-flex", alignItems: "center", gap: 7,
  }),

  shell: {
    maxWidth: 1440, margin: "16px auto 60px",
    padding: "0 28px",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)",
    gap: 20,
    alignItems: "start",
  },

  // List
  list: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 16,
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
  },
  listHead: {
    padding: "14px 18px",
    borderBottom: "1px solid var(--line-2)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    fontSize: 13.5, color: "var(--ink-500)",
    background: "oklch(0.985 0.008 245)",
  },
  listTitle: { fontWeight: 600, color: "var(--ink-900)", fontSize: 14 },
  row: (active, match) => ({
    padding: "14px 18px",
    display: "grid",
    gridTemplateColumns: "44px 1fr auto",
    gap: 14,
    alignItems: "center",
    cursor: "pointer",
    borderBottom: "1px solid var(--line-2)",
    background: active ? "var(--blue-50)" : "transparent",
    borderLeft: "3px solid " + (active ? "var(--blue-600)" : "transparent"),
    paddingLeft: 15,
    position: "relative",
  }),
  matchTag: {
    position: "absolute", top: 8, right: 12,
    fontSize: 10, fontWeight: 600,
    color: "var(--blue-600)", letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  ava: (color) => ({
    width: 40, height: 40, borderRadius: "50%",
    background: color,
    color: "white", display: "grid", placeItems: "center",
    fontSize: 13, fontWeight: 600,
    letterSpacing: "-0.01em",
  }),
  rowName: { fontSize: 14, fontWeight: 600, color: "var(--ink-900)", letterSpacing: "-0.005em" },
  rowMeta: { fontSize: 12.5, color: "var(--ink-500)", marginTop: 2, display: "flex", gap: 8, alignItems: "center" },
  cuotaDots: { display: "inline-flex", gap: 3 },
  cuotaDot: (state) => ({
    width: 18, height: 6, borderRadius: 999,
    background: state === "pagada"   ? "var(--ok-500)"
              : state === "vencida"  ? "var(--bad-500)"
              :                        "oklch(0.88 0.02 245)",
  }),
  rowAmount: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--ink-700)", fontWeight: 500 },

  // Detail panel
  panel: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 16,
    boxShadow: "var(--shadow)",
    overflow: "hidden",
    position: "sticky", top: 88,
  },
  pHead: {
    padding: "20px 22px 18px",
    background: "linear-gradient(180deg, var(--navy-950), var(--navy-800))",
    color: "white",
  },
  pAva: {
    width: 44, height: 44, borderRadius: "50%",
    background: "oklch(1 0 0 / 0.15)",
    border: "1.5px solid oklch(1 0 0 / 0.20)",
    color: "white", display: "grid", placeItems: "center",
    fontSize: 14, fontWeight: 600,
  },
  pName: { fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" },
  pSub: { fontSize: 12.5, color: "oklch(0.85 0.04 240)", marginTop: 3, fontFamily: "'JetBrains Mono', monospace" },
  pBadges: { display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" },
  pBadge: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "4px 9px", borderRadius: 999,
    background: "oklch(1 0 0 / 0.10)",
    border: "1px solid oklch(1 0 0 / 0.14)",
    fontSize: 11.5, fontWeight: 500,
    color: "white",
  },

  pStat: (kind) => {
    const palette = {
      aldia:   { bg: "oklch(0.62 0.13 155 / 0.20)", fg: "oklch(0.92 0.08 155)", dot: "var(--ok-500)" },
      encurso: { bg: "oklch(0.62 0.16 243 / 0.20)", fg: "oklch(0.92 0.04 240)", dot: "var(--blue-500)" },
      morosa:  { bg: "oklch(0.62 0.17 28 / 0.22)",  fg: "oklch(0.92 0.06 28)",  dot: "var(--bad-500)"  },
    }[kind];
    return {
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "4px 10px", borderRadius: 999,
      background: palette.bg, color: palette.fg,
      fontSize: 11.5, fontWeight: 600,
      border: "1px solid oklch(1 0 0 / 0.10)",
    };
  },

  pBody: { padding: "18px 22px 8px" },

  infoGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 18px",
    paddingBottom: 18, borderBottom: "1px solid var(--line-2)",
  },
  iL: { fontSize: 11.5, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 2 },
  iV: { fontSize: 13.5, color: "var(--ink-900)", fontWeight: 500 },

  sectionTitle: {
    fontSize: 12, fontWeight: 600, color: "var(--ink-500)",
    textTransform: "uppercase", letterSpacing: "0.10em",
    margin: "18px 0 10px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },

  cuotaItem: (estado) => ({
    display: "grid",
    gridTemplateColumns: "44px 1fr auto auto",
    gap: 14,
    alignItems: "center",
    padding: "12px 14px",
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderLeft: "3px solid " +
      ({ pagada: "var(--ok-500)", vencida: "var(--bad-500)", pendiente: "var(--blue-500)" }[estado]),
    borderRadius: 10,
    marginBottom: 8,
  }),
  cuotaN: {
    width: 36, height: 36, borderRadius: 9,
    background: "oklch(0.97 0.012 245)",
    color: "var(--ink-700)",
    display: "grid", placeItems: "center",
    fontSize: 13, fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
  },
  cuotaLine1: { fontSize: 13, fontWeight: 600, color: "var(--ink-900)" },
  cuotaLine2: { fontSize: 12, color: "var(--ink-500)", marginTop: 2 },
  cuotaMonto: { fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: "var(--ink-900)" },

  payBtn: {
    height: 34, padding: "0 14px",
    borderRadius: 8,
    background: "var(--navy-900)",
    color: "white", border: 0, cursor: "pointer",
    fontSize: 12.5, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 6,
  },
  pillEstado: (estado) => {
    const p = {
      pagada:    { bg: "var(--ok-100)",   fg: "var(--ok-700)",   t: "Pagada"    },
      vencida:   { bg: "var(--bad-100)",  fg: "var(--bad-700)",  t: "Vencida"   },
      pendiente: { bg: "var(--blue-100)", fg: "var(--navy-900)", t: "A pagar"   },
    }[estado];
    return {
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 999,
      fontSize: 11.5, fontWeight: 600,
      background: p.bg, color: p.fg,
    };
  },
  pillEstadoLabel: (estado) => ({
    pagada: "Pagada", vencida: "Vencida", pendiente: "A pagar",
  }[estado]),

  pFoot: {
    padding: "18px 22px 22px",
    borderTop: "1px solid var(--line-2)",
    background: "oklch(0.985 0.008 245)",
  },
  renewBtn: (enabled) => ({
    width: "100%",
    height: 48, padding: "0 18px",
    borderRadius: 12,
    background: enabled ? "linear-gradient(180deg, var(--blue-600), var(--navy-800))" : "oklch(0.94 0.012 245)",
    color: enabled ? "white" : "var(--ink-400)",
    border: 0,
    cursor: enabled ? "pointer" : "not-allowed",
    fontSize: 15, fontWeight: 600, letterSpacing: "-0.005em",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9,
    boxShadow: enabled ? "0 8px 24px -10px oklch(0.30 0.10 250 / 0.45)" : "none",
  }),
  renewHint: { fontSize: 12, color: "var(--ink-500)", textAlign: "center", marginTop: 8 },

  // Modal
  modalBack: {
    position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.50)",
    backdropFilter: "blur(4px)",
    zIndex: 50, display: "grid", placeItems: "center",
    padding: 20,
  },
  modal: {
    width: 480, maxWidth: "100%",
    background: "var(--paper)",
    borderRadius: 18,
    boxShadow: "var(--shadow-lg)",
    overflow: "hidden",
  },

  // Receipt
  recHead: {
    padding: "26px 28px 18px",
    textAlign: "center",
  },
  recIcon: {
    width: 64, height: 64, borderRadius: "50%",
    background: "var(--ok-100)", color: "var(--ok-700)",
    margin: "0 auto 14px", display: "grid", placeItems: "center",
  },
  recTitle: { margin: 0, fontSize: 22, letterSpacing: "-0.02em", fontWeight: 600 },
  recSub: { margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14 },

  recBody: {
    margin: "0 28px",
    border: "1px dashed var(--line)",
    borderRadius: 12,
    padding: "16px 18px",
    background: "oklch(0.985 0.008 245)",
  },
  recRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 },
  recK: { color: "var(--ink-500)" },
  recV: { color: "var(--ink-900)", fontWeight: 500, textAlign: "right" },
  recTotal: {
    marginTop: 10, paddingTop: 12,
    borderTop: "1px solid var(--line)",
    display: "flex", justifyContent: "space-between",
    fontSize: 15, fontWeight: 700, color: "var(--ink-900)",
  },

  recActions: {
    padding: "20px 28px 24px",
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
  },
  recBtnPri: {
    height: 44, borderRadius: 10,
    background: "var(--navy-900)", color: "white",
    border: 0, cursor: "pointer",
    fontSize: 13.5, fontWeight: 600,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  recBtnSec: {
    height: 44, borderRadius: 10,
    background: "var(--paper)", color: "var(--ink-900)",
    border: "1.5px solid var(--line)", cursor: "pointer",
    fontSize: 13.5, fontWeight: 600,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  },
  recClose: {
    width: "100%",
    padding: "12px",
    background: "transparent",
    border: "none", borderTop: "1px solid var(--line-2)",
    color: "var(--ink-500)", fontSize: 13, cursor: "pointer",
  },

  sentToast: {
    display: "inline-flex", alignItems: "center", gap: 6,
    fontSize: 12, color: "var(--ok-700)", fontWeight: 500,
    marginTop: 4,
  },

  // Renovar modal
  renTitle: { margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" },
  renSub: { margin: "6px 0 18px", color: "var(--ink-500)", fontSize: 14 },
  renField: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "0 14px", height: 52,
    border: "1.5px solid var(--blue-500)",
    background: "var(--paper)",
    boxShadow: "0 0 0 4px oklch(0.62 0.16 243 / 0.12)",
    borderRadius: 11,
  },
  renInput: {
    flex: 1, border: 0, outline: 0, background: "transparent",
    fontSize: 22, fontWeight: 600, color: "var(--ink-900)",
    fontFamily: "'JetBrains Mono', monospace",
  },
  renCurrentBox: {
    background: "oklch(0.985 0.008 245)",
    border: "1px solid var(--line)",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 18,
    display: "flex", justifyContent: "space-between", fontSize: 13.5,
  },
};

function avaColor(name) {
  const palette = [
    "oklch(0.55 0.16 246)", "oklch(0.50 0.14 200)", "oklch(0.50 0.14 30)",
    "oklch(0.50 0.14 145)", "oklch(0.52 0.14 60)",  "oklch(0.45 0.13 280)",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}
function initials(name) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function Cobranzas({ onNavigate, onLogout }) {
  const session = cobSession();
  const isAM = session.role !== "vendedor";

  const [search, setSearch] = React.useState("");
  const [focusSearch, setFocusSearch] = React.useState(false);
  const [filterChip, setFilterChip] = React.useState("todos");
  const [data, setData] = React.useState(() => {
    const aplicadas = cobReadAplicadas();
    return SEED.map(c => ({
      ...c,
      cuotas: c.cuotas.map(q => {
        const hit = aplicadas.find(a => a.poliza === c.poliza && a.cuotaN === q.n);
        return hit ? { ...q, estado: "pendiente", pago: undefined } : q;
      })
    }));
  });
  const [selectedId, setSelectedId] = React.useState(SEED[0].id);

  const [paying, setPaying] = React.useState(null); // { cuotaN }
  const [comprobante, setComprobante] = React.useState(null); // shown after payment
  const [sentEmail, setSentEmail] = React.useState(false);
  const [renovarOpen, setRenovarOpen] = React.useState(false);
  const [renovarMonto, setRenovarMonto] = React.useState("");
  const [anulando, setAnulando] = React.useState(null); // cuotaN a anular
  const [pendientes, setPendientes] = React.useState(() => cobReadAnul().filter(a => a.estado === "pendiente"));
  const [toast, setToast] = React.useState(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const isPendingAnul = (poliza, cuotaN) =>
    pendientes.some(a => a.poliza === poliza && a.cuotaN === cuotaN && a.estado === "pendiente");

  // KPIs
  const allCuotas = data.flatMap(c => c.cuotas);
  const venc = allCuotas.filter(c => c.estado === "vencida").length;
  const pend = allCuotas.filter(c => c.estado === "pendiente").length;
  const cobradoHoy = allCuotas.filter(c => c.estado === "pagada").length;

  // List filter
  const q = search.trim().toLowerCase();
  let list = data;
  if (filterChip === "morosos") list = list.filter(c => c.cuotas.some(q2 => q2.estado === "vencida"));
  if (filterChip === "pendientes") list = list.filter(c => c.cuotas.some(q2 => q2.estado === "pendiente"));
  if (filterChip === "aldia") list = list.filter(c => c.cuotas.every(q2 => q2.estado === "pagada"));

  if (q) {
    list = [...list].sort((a, b) => {
      const score = (c) => {
        const t = (c.cliente + " " + c.dni + " " + c.poliza + " " + c.patente).toLowerCase();
        if (t.startsWith(q) || c.cliente.toLowerCase().startsWith(q)) return 0;
        if (t.includes(q)) return 1;
        return 2;
      };
      return score(a) - score(b);
    });
  }

  const selected = list.find(c => c.id === selectedId) || data.find(c => c.id === selectedId) || list[0];

  // Pay flow
  const pagarCuota = (cuotaN) => {
    const today = new Date().toLocaleDateString("es-AR");
    setData(prev => prev.map(c => {
      if (c.id !== selected.id) return c;
      return {
        ...c,
        cuotas: c.cuotas.map(q => q.n === cuotaN ? { ...q, estado: "pagada", pago: today } : q),
      };
    }));
    const cuota = selected.cuotas.find(c => c.n === cuotaN);
    setComprobante({
      cuotaN, monto: cuota.monto, fecha: today,
      cliente: selected.cliente, poliza: selected.poliza,
      compania: COB_COMPANIES[selected.co].n, ramo: selected.ramo,
      numero: "REC-2605-" + String(Math.floor(100000 + Math.random() * 899999)),
    });
    setSentEmail(false);
    setPaying(null);
  };

  const renovar = (nuevoNumero) => {
    const monto = parseFloat(String(renovarMonto).replace(/\./g, "").replace(",", "."));
    if (!monto || isNaN(monto)) return;
    const today = new Date();
    const next = (m) => {
      const d = new Date(today); d.setMonth(d.getMonth() + m);
      return d.toLocaleDateString("es-AR");
    };
    setData(prev => prev.map(c => c.id !== selected.id ? c : {
      ...c,
      poliza: (nuevoNumero && nuevoNumero.trim()) ? nuevoNumero.trim() : c.poliza,
      inicio: today.toLocaleDateString("es-AR"),
      cuotas: [
        { n: 1, ven: next(1), monto, estado: "pendiente" },
        { n: 2, ven: next(2), monto, estado: "pendiente" },
        { n: 3, ven: next(3), monto, estado: "pendiente" },
      ],
    }));
    setRenovarOpen(false);
    setRenovarMonto("");
  };

  // Anular cuota pagada
  const anularCuota = (cuotaN) => {
    const cuota = selected.cuotas.find(c => c.n === cuotaN);
    if (isAM) {
      setData(prev => prev.map(c => c.id !== selected.id ? c : {
        ...c, cuotas: c.cuotas.map(q => q.n === cuotaN ? { ...q, estado: "pendiente", pago: undefined } : q)
      }));
      const ap = cobReadAplicadas();
      ap.push({ poliza: selected.poliza, cuotaN });
      localStorage.setItem("amr_anulaciones_aplicadas", JSON.stringify(ap));
      setToast({ tone: "ok", msg: `Cuota ${cuotaN} anulada correctamente.` });
    } else {
      const list = cobReadAnul();
      list.unshift({
        id: "an-" + Date.now(),
        poliza: selected.poliza, cliente: selected.cliente, cuotaN,
        monto: cuota.monto, ramo: selected.ramo,
        solicitante: session.nombre,
        fecha: new Date().toLocaleString("es-AR"),
        estado: "pendiente"
      });
      cobWriteAnul(list);
      setPendientes(list.filter(a => a.estado === "pendiente"));
      setToast({ tone: "warn", msg: "Solicitud de anulación enviada al AM. Queda pendiente de aprobación." });
    }
    setAnulando(null);
  };

  const allPaid = selected && selected.cuotas.every(c => c.estado === "pagada");
  const status = selected ? sumStatus(selected.cuotas) : null;

  return (
    <div style={cobStyles.page}>
      <Navbar active="cobranzas" onNavigate={onNavigate} onLogout={onLogout}
              search={search} setSearch={setSearch} />

      <div style={cobStyles.hero}>
        <div>
          <div style={cobStyles.crumb}>Inicio · Cobranzas</div>
          <h1 style={cobStyles.h1}>Cobranzas</h1>
          <p style={cobStyles.sub}>Buscá al asegurado para registrar el cobro de cuotas y renovar pólizas.</p>
        </div>
        <div style={cobStyles.kpis}>
          <div style={cobStyles.kpi("red")}>
            <span style={cobStyles.kpiDot("red")} />
            <span style={cobStyles.kpiN}>{venc}</span> Cuotas vencidas
          </div>
          <div style={cobStyles.kpi("amber")}>
            <span style={cobStyles.kpiDot("amber")} />
            <span style={cobStyles.kpiN}>{pend}</span> Por cobrar
          </div>
          <div style={cobStyles.kpi("green")}>
            <span style={cobStyles.kpiDot("green")} />
            <span style={cobStyles.kpiN}>{cobradoHoy}</span> Cobradas
          </div>
        </div>
      </div>

      {/* Big search bar */}
      <div style={cobStyles.searchWrap}>
        <div style={cobStyles.searchBig(focusSearch)}>
          <IconSearch size={20} style={{ color: focusSearch ? "var(--blue-600)" : "var(--ink-400)" }} />
          <input
            style={cobStyles.searchInput}
            placeholder="Buscar asegurado por nombre, DNI, póliza o patente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocusSearch(true)}
            onBlur={() => setFocusSearch(false)}
          />
          {search && (
            <button onClick={() => setSearch("")}
                    style={{ border: 0, background: "transparent", color: "var(--ink-400)", cursor: "pointer", display: "grid", placeItems: "center" }}>
              <IconClose size={16} />
            </button>
          )}
          <span style={cobStyles.searchHint}>{list.length} resultado{list.length === 1 ? "" : "s"}</span>
        </div>
        {[
          ["todos", "Todos"],
          ["morosos", "Con deuda"],
          ["pendientes", "Por cobrar"],
          ["aldia", "Al día"],
        ].map(([k, l]) => (
          <button key={k} style={cobStyles.chip(filterChip === k)} onClick={() => setFilterChip(k)}>
            {l}
          </button>
        ))}
      </div>

      <section style={cobStyles.shell}>
        {/* LIST */}
        <div style={cobStyles.list}>
          <div style={cobStyles.listHead}>
            <span style={cobStyles.listTitle}>Asegurados</span>
            <span>Mostrando {list.length} de {data.length}</span>
          </div>
          {list.length === 0 && (
            <div style={{ padding: "40px 18px", textAlign: "center", color: "var(--ink-500)", fontSize: 14 }}>
              No se encontraron resultados para “{search}”.
            </div>
          )}
          {list.map((c, idx) => {
            const isMatch = q && idx === 0;
            return (
              <div key={c.id} style={cobStyles.row(c.id === selected?.id, isMatch)}
                   onClick={() => setSelectedId(c.id)}>
                {isMatch && <span style={cobStyles.matchTag}>● Coincide</span>}
                <div style={cobStyles.ava(avaColor(c.cliente))}>{initials(c.cliente)}</div>
                <div>
                  <div style={cobStyles.rowName}>{c.cliente}</div>
                  <div style={cobStyles.rowMeta}>
                    <span className="mono">{c.dni}</span>
                    <span style={{ color: "var(--ink-400)" }}>·</span>
                    <span className="mono">{c.poliza}</span>
                    {c.patente !== "—" && (
                      <>
                        <span style={{ color: "var(--ink-400)" }}>·</span>
                        <span className="mono">{c.patente}</span>
                      </>
                    )}
                  </div>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={cobStyles.cuotaDots}>
                      {c.cuotas.map(cu => (
                        <span key={cu.n} style={cobStyles.cuotaDot(cu.estado)} title={`Cuota ${cu.n}: ${cu.estado}`} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11.5, color: "var(--ink-500)" }}>
                      {c.cuotas.filter(x => x.estado === "pagada").length}/{c.cuotas.length} pagas
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={cobStyles.rowAmount}>{fmt(c.cuotas[0].monto)}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>/ cuota</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DETAIL PANEL */}
        {selected && (
          <aside style={cobStyles.panel}>
            <div style={cobStyles.pHead}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={cobStyles.pAva}>{initials(selected.cliente)}</div>
                <div style={{ flex: 1 }}>
                  <div style={cobStyles.pName}>{selected.cliente}</div>
                  <div style={cobStyles.pSub}>DNI {selected.dni} · {selected.tel}</div>
                </div>
                {status && (
                  <span style={cobStyles.pStat(status.k)}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%",
                                    background: { aldia: "var(--ok-500)", encurso: "var(--blue-500)", morosa: "var(--bad-500)" }[status.k] }} />
                    {status.l}
                  </span>
                )}
              </div>
              <div style={cobStyles.pBadges}>
                <span style={cobStyles.pBadge}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: COB_COMPANIES[selected.co].c }} />
                  {COB_COMPANIES[selected.co].n}
                </span>
                <span style={cobStyles.pBadge}>{selected.ramo}</span>
                <span style={cobStyles.pBadge} className="mono">{selected.poliza}</span>
              </div>
            </div>

            <div style={cobStyles.pBody}>
              <div style={cobStyles.infoGrid}>
                <div>
                  <div style={cobStyles.iL}>Bien asegurado</div>
                  <div style={cobStyles.iV}>{selected.bien}</div>
                </div>
                <div>
                  <div style={cobStyles.iL}>Cobertura</div>
                  <div style={cobStyles.iV}>{selected.cobertura}</div>
                </div>
                <div>
                  <div style={cobStyles.iL}>Periodicidad</div>
                  <div style={cobStyles.iV}>{selected.periodo}</div>
                </div>
                <div>
                  <div style={cobStyles.iL}>Vigencia desde</div>
                  <div style={cobStyles.iV} className="mono">{selected.inicio}</div>
                </div>
              </div>

              <div style={cobStyles.sectionTitle}>
                <span>Detalle de cuotas</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--ink-700)", fontSize: 12 }}>
                  Total: {fmt(selected.cuotas.reduce((a, c) => a + c.monto, 0))}
                </span>
              </div>

              {selected.cuotas.map(cu => (
                <div key={cu.n} style={cobStyles.cuotaItem(cu.estado)}>
                  <div style={cobStyles.cuotaN}>0{cu.n}</div>
                  <div>
                    <div style={cobStyles.cuotaLine1}>Cuota {cu.n} de {selected.cuotas.length}</div>
                    <div style={cobStyles.cuotaLine2}>
                      Vence <span className="mono">{cu.ven}</span>
                      {cu.estado === "pagada" && cu.pago && (
                        <> · Pagada el <span className="mono">{cu.pago}</span></>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={cobStyles.cuotaMonto}>{fmt(cu.monto)}</div>
                    <div style={{ marginTop: 4 }}>
                      <span style={cobStyles.pillEstado(cu.estado)}>
                        {cu.estado === "pagada" && <IconCheck size={11} sw={2.5} />}
                        {cobStyles.pillEstadoLabel(cu.estado)}
                      </span>
                    </div>
                  </div>
                  <div>
                    {cu.estado !== "pagada" ? (
                      <button style={cobStyles.payBtn} onClick={() => pagarCuota(cu.n)}>
                        Cobrar <IconArrowR size={13} />
                      </button>
                    ) : isPendingAnul(selected.poliza, cu.n) ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--warn-700)", background: "var(--warn-100)", padding: "5px 9px", borderRadius: 8, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <Icon size={11} d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>} /> Anulación pendiente
                      </span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "var(--ok-700)", display: "grid", placeItems: "center" }}>
                          <IconCheck size={18} sw={2.5} />
                        </span>
                        <button onClick={() => setAnulando(cu.n)} title="Anular pago"
                          style={{ height: 28, padding: "0 10px", borderRadius: 7, border: "1px solid oklch(0.85 0.08 28)", background: "var(--bad-100)", color: "var(--bad-700)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
                          Anular
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={cobStyles.pFoot}>
              <button style={cobStyles.renewBtn(allPaid)}
                      disabled={!allPaid}
                      onClick={() => allPaid && setRenovarOpen(true)}>
                <Icon size={17} d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />
                {allPaid ? "Renovar póliza" : `Faltan ${selected.cuotas.filter(c => c.estado !== "pagada").length} cuota${selected.cuotas.filter(c => c.estado !== "pagada").length === 1 ? "" : "s"} para renovar`}
              </button>
              <div style={cobStyles.renewHint}>
                {allPaid
                  ? "Las 3 cuotas están pagas. Podés iniciar el período siguiente."
                  : "La renovación se habilita cuando se cobran las 3 cuotas del período."}
              </div>
            </div>
          </aside>
        )}
      </section>

      {/* Comprobante modal */}
      {comprobante && (
        <Comprobante
          c={comprobante}
          sentEmail={sentEmail}
          onSendEmail={() => { setSentEmail(true); cobWriteEnvio(comprobante.poliza, todayISO(), "Online"); }}
          onSendWhatsapp={() => { setSentEmail("wa"); cobWriteEnvio(comprobante.poliza, todayISO(), "WhatsApp"); }}
          onPrint={() => printComprobante(comprobante, selected, COB_COMPANIES[selected.co].n)}
          onTicket={() => printTicket(comprobante, COB_COMPANIES[selected.co].n)}
          onClose={() => setComprobante(null)}
        />
      )}

      {/* Anular confirm modal */}
      {anulando != null && selected && (
        <AnularModal
          cuotaN={anulando}
          cuota={selected.cuotas.find(c => c.n === anulando)}
          selected={selected}
          isAM={isAM}
          onClose={() => setAnulando(null)}
          onConfirm={() => anularCuota(anulando)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 60,
          background: toast.tone === "warn" ? "oklch(0.42 0.10 70)" : "var(--navy-900)",
          color: "white", padding: "13px 20px", borderRadius: 12, boxShadow: "var(--shadow-lg)",
          fontSize: 13.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 10, maxWidth: 460 }}>
          <Icon size={16} d={toast.tone === "warn" ? <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></> : <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} />
          {toast.msg}
        </div>
      )}

      {/* Renovar modal */}
      {renovarOpen && selected && (
        <RenovarModal
          selected={selected}
          monto={renovarMonto}
          setMonto={setRenovarMonto}
          onClose={() => { setRenovarOpen(false); setRenovarMonto(""); }}
          onConfirm={(nuevoNumero) => renovar(nuevoNumero)}
        />
      )}
    </div>
  );
}

/* ───────────── Comprobante (modal) ───────────── */

function Comprobante({ c, sentEmail, onSendEmail, onSendWhatsapp, onPrint, onTicket, onClose }) {
  return (
    <div style={cobStyles.modalBack} onClick={onClose}>
      <div style={cobStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={cobStyles.recHead}>
          <div style={cobStyles.recIcon}>
            <IconCheck size={30} sw={2.6} />
          </div>
          <h3 style={cobStyles.recTitle}>Pago registrado</h3>
          <p style={cobStyles.recSub}>
            Cuota {c.cuotaN} cobrada el <span className="mono">{c.fecha}</span>
          </p>
        </div>

        <div style={cobStyles.recBody}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <strong style={{ fontSize: 13 }}>Comprobante de pago</strong>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--ink-500)", fontSize: 12 }}>
              N° {c.numero}
            </span>
          </div>
          <div style={cobStyles.recRow}><span style={cobStyles.recK}>Cliente</span><span style={cobStyles.recV}>{c.cliente}</span></div>
          <div style={cobStyles.recRow}><span style={cobStyles.recK}>Póliza</span><span style={cobStyles.recV} className="mono">{c.poliza}</span></div>
          <div style={cobStyles.recRow}><span style={cobStyles.recK}>Compañía</span><span style={cobStyles.recV}>{c.compania}</span></div>
          <div style={cobStyles.recRow}><span style={cobStyles.recK}>Ramo</span><span style={cobStyles.recV}>{c.ramo}</span></div>
          <div style={cobStyles.recRow}><span style={cobStyles.recK}>Cuota</span><span style={cobStyles.recV} className="mono">{c.cuotaN}</span></div>
          <div style={cobStyles.recTotal}>
            <span>Total cobrado</span>
            <span className="mono">{fmt(c.monto)}</span>
          </div>
        </div>

        {/* Enviar */}
        <div style={{ padding: "18px 28px 6px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Enviar comprobante</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button style={{ ...cobStyles.recBtnSec, borderColor: sentEmail === true ? "var(--ok-500)" : "var(--line)", color: sentEmail === true ? "var(--ok-700)" : "var(--ink-900)" }} onClick={onSendEmail}>
              <IconMail size={15} /> {sentEmail === true ? "Enviado ✓" : "Email / Online"}
            </button>
            <button style={{ ...cobStyles.recBtnSec, borderColor: sentEmail === "wa" ? "oklch(0.55 0.13 150)" : "var(--line)", color: sentEmail === "wa" ? "oklch(0.45 0.13 150)" : "var(--ink-900)" }} onClick={onSendWhatsapp}>
              <Icon size={15} d={<><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z"/><path d="M8.5 7.5c.3 0 .6 0 .8.6l.7 1.7c.1.3 0 .5-.1.7l-.5.6c-.2.2-.2.4-.1.6.5 1 1.5 2 2.6 2.4.3.1.5.1.7-.1l.5-.6c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.4.4.7 0 1.1-.9 2-2 2-3.6 0-7-3.4-7-7 0-1.1.9-2 2-2z" fill="currentColor" stroke="none"/></>} /> {sentEmail === "wa" ? "Enviado ✓" : "WhatsApp"}
            </button>
          </div>
        </div>

        {/* Imprimir */}
        <div style={cobStyles.recActions}>
          <button style={cobStyles.recBtnSec} onClick={onTicket}>
            <Icon size={15} d={<><path d="M4 4h16v16l-2-1.2L16 20l-2-1.2L12 20l-2-1.2L8 20l-2-1.2L4 20V4z"/><path d="M8 9h8M8 13h6"/></>} />
            Ticket
          </button>
          <button style={cobStyles.recBtnPri} onClick={onPrint}>
            <Icon size={15} d={<><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></>} />
            Comprobante
          </button>
        </div>
        {sentEmail && (
          <div style={{ textAlign: "center", marginTop: -6, paddingBottom: 14, fontSize: 12, color: sentEmail === "wa" ? "oklch(0.45 0.13 150)" : "var(--ok-700)" }}>
            ✓ Enviado {sentEmail === "wa" ? "por WhatsApp" : "al correo del asegurado"}
          </div>
        )}

        <button style={cobStyles.recClose} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

function printComprobante(c, selected, companyName) {
  const w = window.open("", "_blank", "width=480,height=720");
  if (!w) return;
  w.document.write(`
<!doctype html><html><head><meta charset="utf-8"><title>Comprobante ${c.numero}</title>
<style>
  body{font:14px/1.5 -apple-system, system-ui, sans-serif; color:#1c2233; max-width:420px; margin:24px auto; padding:0 20px;}
  h1{font-size:18px; letter-spacing:-0.02em; margin:0 0 4px;}
  .kicker{font-size:11px; color:#5a6478; letter-spacing:0.18em; text-transform:uppercase; font-weight:600;}
  hr{border:0; border-top:1px dashed #c8cfdc; margin:18px 0;}
  table{width:100%; border-collapse:collapse; font-size:13px;}
  td{padding:6px 0;}
  td:last-child{text-align:right; font-weight:500;}
  .total{font-weight:700; font-size:16px; padding-top:10px; border-top:1px solid #d0d6e2; margin-top:8px;}
  .mono{font-family:'JetBrains Mono', ui-monospace, monospace;}
  .foot{margin-top:24px; font-size:11px; color:#5a6478; text-align:center;}
</style></head><body>
<div class="kicker">AMR · Producción de Seguros</div>
<h1>Comprobante de pago</h1>
<div style="color:#5a6478; font-size:12px;">N° <span class="mono">${c.numero}</span> · ${c.fecha}</div>
<hr/>
<table>
  <tr><td style="color:#5a6478">Cliente</td><td>${c.cliente}</td></tr>
  <tr><td style="color:#5a6478">Póliza</td><td class="mono">${c.poliza}</td></tr>
  <tr><td style="color:#5a6478">Compañía</td><td>${companyName}</td></tr>
  <tr><td style="color:#5a6478">Ramo</td><td>${selected?.ramo || c.ramo}</td></tr>
  <tr><td style="color:#5a6478">Cuota N°</td><td class="mono">${c.cuotaN}</td></tr>
</table>
<div class="total">
  <table><tr><td>Total cobrado</td><td class="mono">${fmt(c.monto)}</td></tr></table>
</div>
<div class="foot">Gracias por tu pago. Conservar este comprobante.</div>
<script>window.print();</script>
</body></html>
  `);
  w.document.close();
}

function printTicket(c, companyName) {
  const w = window.open("", "_blank", "width=320,height=560");
  if (!w) return;
  w.document.write(`
<!doctype html><html><head><meta charset="utf-8"><title>Ticket ${c.numero}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  body{font:12px/1.45 ui-monospace,'JetBrains Mono',monospace; color:#111; width:72mm; margin:6mm auto; padding:0 4mm;}
  .c{text-align:center;}
  .big{font-size:15px; font-weight:700; letter-spacing:0.02em;}
  .mut{color:#555;}
  hr{border:0; border-top:1px dashed #999; margin:8px 0;}
  table{width:100%; border-collapse:collapse;}
  td{padding:2px 0; vertical-align:top;}
  td:last-child{text-align:right;}
  .tot{font-size:15px; font-weight:700; border-top:1px solid #111; padding-top:6px; margin-top:6px;}
</style></head><body>
<div class="c big">AMR SEGUROS</div>
<div class="c mut">Producción de Seguros</div>
<hr/>
<div class="c">TICKET DE PAGO</div>
<div class="c mut">N° ${c.numero}</div>
<div class="c mut">${c.fecha}</div>
<hr/>
<table>
  <tr><td class="mut">Cliente</td><td>${c.cliente}</td></tr>
  <tr><td class="mut">Póliza</td><td>${c.poliza}</td></tr>
  <tr><td class="mut">Compañía</td><td>${companyName}</td></tr>
  <tr><td class="mut">Cuota</td><td>${c.cuotaN}</td></tr>
</table>
<div class="tot"><table><tr><td>TOTAL</td><td>${fmt(c.monto)}</td></tr></table></div>
<hr/>
<div class="c mut">¡Gracias por su pago!</div>
<div class="c mut">Comprobante no válido como factura</div>
<script>window.print();</script>
</body></html>
  `);
  w.document.close();
}

/* ───────── Anular cuota (modal) ───────── */

function AnularModal({ cuotaN, cuota, selected, isAM, onClose, onConfirm }) {
  return (
    <div style={cobStyles.modalBack} onClick={onClose}>
      <div style={{ ...cobStyles.modal, width: 440 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "22px 24px 8px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bad-100)", color: "var(--bad-700)", display: "grid", placeItems: "center" }}>
              <Icon size={20} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4m0 4v.01"/></>} />
            </div>
            <div>
              <h3 style={{ ...cobStyles.renTitle, fontSize: 18 }}>Anular cuota {cuotaN}</h3>
              <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: 13 }}>
                {selected.cliente} · <span className="mono">{selected.poliza}</span>
              </p>
            </div>
          </div>
        </div>
        <div style={{ padding: "0 24px 18px" }}>
          <div style={cobStyles.renCurrentBox}>
            <span style={{ color: "var(--ink-500)" }}>Importe a anular</span>
            <span className="mono" style={{ fontWeight: 600 }}>{fmt(cuota?.monto || 0)}</span>
          </div>
          {isAM ? (
            <div style={{ padding: "12px 14px", background: "var(--bad-100)", border: "1px solid oklch(0.88 0.08 28)", borderRadius: 10, fontSize: 13, color: "var(--bad-700)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon size={15} d={<><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3v.01"/></>} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>La cuota volverá a estado <strong>pendiente</strong> y se anulará el comprobante. Esta acción queda registrada.</span>
            </div>
          ) : (
            <div style={{ padding: "12px 14px", background: "oklch(0.97 0.04 80)", border: "1px solid oklch(0.88 0.08 80)", borderRadius: 10, fontSize: 13, color: "oklch(0.42 0.10 70)", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon size={15} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Como vendedor, esta anulación requiere <strong>aprobación del AM</strong>. Se enviará una notificación y la cuota quedará marcada como “anulación pendiente”.</span>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 24px 22px", display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)" }}>
          <button style={cobStyles.recBtnSec} onClick={onClose}>Cancelar</button>
          <button style={{ ...cobStyles.recBtnPri, background: "var(--bad-600)" }} onClick={onConfirm}>
            {isAM ? "Anular cuota" : "Solicitar anulación"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RenovarModal({ selected, monto, setMonto, onClose, onConfirm }) {
  const current = selected.cuotas[0]?.monto || 0;
  const suggested = Math.round(current * 1.18);
  const [poliza, setPoliza] = React.useState(selected.poliza);
  const [editPoliza, setEditPoliza] = React.useState(false);
  return (
    <div style={cobStyles.modalBack} onClick={onClose}>
      <div style={cobStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "26px 28px 8px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--blue-100)",
                          color: "var(--navy-900)", display: "grid", placeItems: "center" }}>
              <Icon size={20} d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" sw={2} />
            </div>
            <div>
              <h3 style={cobStyles.renTitle}>Renovar póliza</h3>
              <p style={{ ...cobStyles.renSub, margin: 0 }}>
                {selected.cliente} · <span className="mono">{selected.poliza}</span>
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 28px 18px" }}>
          <div style={cobStyles.renCurrentBox}>
            <span style={{ color: "var(--ink-500)" }}>Cuota actual</span>
            <span className="mono" style={{ fontWeight: 600 }}>{fmt(current)}</span>
          </div>

          {/* Número de póliza */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)" }}>Número de póliza</div>
            {!editPoliza && (
              <button onClick={() => setEditPoliza(true)}
                style={{ border: 0, background: "transparent", color: "var(--blue-600)", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon size={13} d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /> Modificar
              </button>
            )}
          </div>
          {editPoliza ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", height: 48, border: "1.5px solid var(--blue-500)", background: "var(--paper)", boxShadow: "0 0 0 4px oklch(0.62 0.16 243 / 0.12)", borderRadius: 11, marginBottom: 18 }}>
              <Icon size={16} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} style={{ color: "var(--ink-400)" }} />
              <input value={poliza} onChange={(e) => setPoliza(e.target.value.toUpperCase())} autoFocus
                style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 15, fontWeight: 600, color: "var(--ink-900)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.03em" }} />
            </div>
          ) : (
            <div style={{ ...cobStyles.renCurrentBox, marginBottom: 18 }}>
              <span style={{ color: "var(--ink-500)" }}>Se mantiene</span>
              <span className="mono" style={{ fontWeight: 600 }}>{poliza}</span>
            </div>
          )}

          <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 8 }}>
            Nuevo valor de cuota
          </div>
          <div style={cobStyles.renField}>
            <span style={{ color: "var(--ink-500)", fontWeight: 500 }}>ARS $</span>
            <input
              style={cobStyles.renInput}
              placeholder="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^0-9.,]/g, ""))}
              autoFocus
            />
            <span style={{ color: "var(--ink-500)", fontSize: 13 }}>/ {selected.periodo.toLowerCase()}</span>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
            {[suggested, current, Math.round(current * 1.3)].map(v => (
              <button key={v} onClick={() => setMonto(String(v))}
                      style={{
                        padding: "6px 10px", borderRadius: 8,
                        border: "1px solid var(--line)",
                        background: "var(--paper)", color: "var(--ink-700)",
                        fontSize: 12, cursor: "pointer",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                {fmt(v)}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10,
                        background: "var(--blue-50)", border: "1px solid var(--blue-100)",
                        fontSize: 12.5, color: "var(--ink-700)" }}>
            Se generarán 3 cuotas nuevas a partir del próximo mes con el monto indicado.
          </div>
        </div>

        <div style={{ padding: "16px 28px 22px", display: "flex", gap: 10, justifyContent: "flex-end",
                      borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)" }}>
          <button style={cobStyles.recBtnSec} onClick={onClose}>Cancelar</button>
          <button style={cobStyles.recBtnPri} onClick={() => onConfirm(poliza)} disabled={!monto}>
            <IconCheck size={15} /> Confirmar renovación
          </button>
        </div>
      </div>
    </div>
  );
}

window.Cobranzas = Cobranzas;
