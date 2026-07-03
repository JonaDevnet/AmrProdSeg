// AMR — Dashboard: navbar + cartera de clientes

const COMPANIES = getCompanias();

const ROWS = [
  { co: 0, pol: "AUT-2410-887143", cli: "Martín Acosta",         pat: "AB 421 KS", est: "vigente",  ven: "12 Oct 2026", ramo: "Automotor" },
  { co: 2, pol: "HOG-2510-002411", cli: "Lucía Fernández",       pat: "—",         est: "vigente",  ven: "03 Nov 2026", ramo: "Hogar"     },
  { co: 1, pol: "AUT-2509-114902", cli: "Ricardo Pérez",         pat: "PFG 882",   est: "porvencer",ven: "02 Jun 2026", ramo: "Automotor" },
  { co: 3, pol: "VID-2403-771122", cli: "Camila Suárez",         pat: "—",         est: "vigente",  ven: "21 Mar 2027", ramo: "Vida"      },
  { co: 0, pol: "AUT-2401-558204", cli: "Federico Bianchi",      pat: "AC 991 XT", est: "vencida",  ven: "04 May 2026", ramo: "Automotor" },
  { co: 4, pol: "AUT-2506-339118", cli: "Sofía Romero",          pat: "KQA 312",   est: "vigente",  ven: "18 Jul 2026", ramo: "Automotor" },
  { co: 5, pol: "COM-2505-440099", cli: "Comercio La Estación SRL", pat: "—",      est: "vigente",  ven: "30 Sep 2026", ramo: "Comercio"  },
  { co: 3, pol: "AUT-2508-217733", cli: "Diego Molina",          pat: "AE 102 PH", est: "porvencer",ven: "10 Jun 2026", ramo: "Automotor" },
  { co: 4, pol: "ART-2412-558112", cli: "Construcciones Norte SA", pat: "—",       est: "vigente",  ven: "22 Dec 2026", ramo: "ART"       },
  { co: 2, pol: "AUT-2502-009912", cli: "Valentina Ortiz",       pat: "AD 778 LR", est: "vigente",  ven: "15 Feb 2027", ramo: "Automotor" },
  { co: 5, pol: "MOT-2511-321001", cli: "Joaquín Silva",         pat: "A210 BCJ",  est: "vigente",  ven: "07 Nov 2026", ramo: "Motovehículo" },
  { co: 1, pol: "AUT-2406-700218", cli: "Marcela Domínguez",     pat: "LIE 442",   est: "vencida",  ven: "28 Apr 2026", ramo: "Automotor" },
];

const normStr = s => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const ROWS_DETAIL = {
  "AUT-2410-887143": { dni: "28.456.789",    telefono: "11 4523-8891", email: "martin.acosta@gmail.com",       domicilio: "Av. Rivadavia 1840, 2° A, CABA",        marca: "Volkswagen", modelo: "Gol Trend 1.6",       anio: "2019", chasis: "9BWZZZ377VT004251", motor: "CFZ-A12345",    combustion: "Nafta"       },
  "HOG-2510-002411": { dni: "35.112.440",    telefono: "341 621-0092", email: "lu.fernandez@gmail.com",         domicilio: "Corrientes 2340, PB A, Rosario",         marca: "—",          modelo: "—",                   anio: "—",    chasis: "—",                 motor: "—",              combustion: "—"           },
  "AUT-2509-114902": { dni: "22.781.003",    telefono: "351 458-0012", email: "r.perez@outlook.com",            domicilio: "San Martín 815, 1° B, Córdoba",          marca: "Ford",       modelo: "Focus SE 2.0",        anio: "2018", chasis: "3FADP4BJ7JM149381", motor: "M50A-098761",   combustion: "Nafta"       },
  "VID-2403-771122": { dni: "40.330.881",    telefono: "11 5559-2211", email: "c.suarez@gmail.com",             domicilio: "Maipú 560, 7° C, CABA",                  marca: "—",          modelo: "—",                   anio: "—",    chasis: "—",                 motor: "—",              combustion: "—"           },
  "AUT-2401-558204": { dni: "29.009.112",    telefono: "11 4887-3300", email: "f.bianchi@hotmail.com",          domicilio: "Monroe 1247, Piso 3, CABA",               marca: "Fiat",       modelo: "Cronos Drive 1.3",    anio: "2022", chasis: "8AP1F6318NJ445892", motor: "E.torq-889201", combustion: "Nafta"       },
  "AUT-2506-339118": { dni: "38.001.776",    telefono: "11 5501-4432", email: "sofia.romero@gmail.com",         domicilio: "Av. Cabildo 2380, 4° D, CABA",           marca: "Chevrolet",  modelo: "Onix LT 1.0T",        anio: "2023", chasis: "8AGBA5534PE000811", motor: "LIY-338812",    combustion: "Nafta / GNC" },
  "COM-2505-440099": { dni: "30-71234567-9", telefono: "11 4300-5522", email: "admin@laestacion.com.ar",        domicilio: "Ruta 9 Km 55, Pilar, BA",                marca: "—",          modelo: "—",                   anio: "—",    chasis: "—",                 motor: "—",              combustion: "—"           },
  "AUT-2508-217733": { dni: "32.445.890",    telefono: "11 5677-3341", email: "diego.molina@yahoo.com.ar",      domicilio: "Balcarce 450, Lomas de Zamora",           marca: "Toyota",     modelo: "Corolla XEI 2.0",     anio: "2021", chasis: "JTNC52BE7M3060211", motor: "2ZR-FE-330912", combustion: "Nafta"       },
  "ART-2412-558112": { dni: "30-68901234-7", telefono: "11 4888-7700", email: "rrhh@construccionesnorte.com",  domicilio: "Paraguay 1234, Piso 2, CABA",             marca: "—",          modelo: "—",                   anio: "—",    chasis: "—",                 motor: "—",              combustion: "—"           },
  "AUT-2502-009912": { dni: "39.887.550",    telefono: "11 6110-8823", email: "v.ortiz@gmail.com",              domicilio: "Av. Santa Fe 3340, 8° E, CABA",          marca: "Renault",    modelo: "Sandero Stepway 1.6", anio: "2020", chasis: "VF1KSB20EH2334901", motor: "K4M-B-992110",  combustion: "GNC / Nafta" },
  "MOT-2511-321001": { dni: "44.122.003",    telefono: "341 700-4412", email: "joaco.silva@gmail.com",          domicilio: "Pellegrini 800, Rosario",                 marca: "Honda",      modelo: "CB 190R",             anio: "2022", chasis: "9C2JC7730LR000231", motor: "JC73E-2231001", combustion: "Nafta"       },
  "AUT-2406-700218": { dni: "27.334.509",    telefono: "11 4502-1180", email: "m.dominguez@outlook.com",        domicilio: "Nazca 1560, Villa del Parque, CABA",     marca: "Peugeot",    modelo: "208 Active 1.6",      anio: "2017", chasis: "VF3CCHNSHHE093411", motor: "TU5JP4-221891", combustion: "Nafta"       },
};

const dashStyles = {
  page: { background: "var(--canvas)", minHeight: "100vh" },

  nav: {
    position: "sticky", top: 0, zIndex: 10,
    background: "var(--navy-950)",
    color: "white",
    borderBottom: "1px solid oklch(1 0 0 / 0.08)",
  },
  navInner: {
    maxWidth: 1440, margin: "0 auto",
    padding: "0 28px",
    height: 64,
    display: "flex", alignItems: "center", gap: 22,
  },
  navLogo: {
    display: "flex", alignItems: "center", gap: 10,
    fontWeight: 600, letterSpacing: "-0.015em",
  },
  logoMark: {
    width: 32, height: 32, borderRadius: 8,
    background: "white",
    color: "var(--navy-900)",
    display: "grid", placeItems: "center",
    fontWeight: 700, fontSize: 14,
  },
  navLinks: {
    display: "flex", alignItems: "center", gap: 4,
    marginLeft: 18,
  },
  navLink: (active) => ({
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 14, fontWeight: 500,
    color: active ? "white" : "oklch(0.80 0.04 240)",
    background: active ? "oklch(1 0 0 / 0.10)" : "transparent",
    cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 8,
    border: 0,
    transition: "background .15s",
  }),
  search: {
    marginLeft: "auto",
    display: "flex", alignItems: "center", gap: 10,
    background: "oklch(1 0 0 / 0.08)",
    borderRadius: 10,
    padding: "0 12px",
    height: 40,
    width: 360,
    color: "oklch(0.85 0.03 240)",
    border: "1px solid oklch(1 0 0 / 0.10)",
  },
  searchInput: {
    flex: 1, border: 0, outline: 0, background: "transparent",
    color: "white", fontSize: 14,
  },
  kbd: {
    fontSize: 11,
    padding: "2px 6px",
    borderRadius: 4,
    background: "oklch(1 0 0 / 0.10)",
    color: "oklch(0.85 0.03 240)",
    border: "1px solid oklch(1 0 0 / 0.10)",
  },
  iconBtnNav: {
    width: 40, height: 40, display: "grid", placeItems: "center",
    borderRadius: 10, background: "transparent", color: "oklch(0.85 0.04 240)",
    border: 0, cursor: "pointer",
  },
  avatar: {
    width: 36, height: 36, borderRadius: "50%",
    background: "linear-gradient(135deg, var(--blue-500), oklch(0.50 0.16 200))",
    color: "white", display: "grid", placeItems: "center",
    fontSize: 13, fontWeight: 600,
    border: "2px solid oklch(1 0 0 / 0.10)",
  },

  // Page header
  hero: {
    maxWidth: 1440, margin: "0 auto",
    padding: "32px 28px 16px",
    display: "flex", alignItems: "flex-end", justifyContent: "space-between",
    gap: 24,
  },
  crumb: { fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8, letterSpacing: "0.01em" },
  h1: { margin: 0, fontSize: 30, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" },
  sub: { margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14.5 },

  // Stat strip
  stats: {
    maxWidth: 1440, margin: "0 auto", padding: "8px 28px 0",
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14,
  },
  stat: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 14,
    padding: "16px 18px",
  },
  statL: { fontSize: 12.5, color: "var(--ink-500)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 },
  statN: { fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 6, color: "var(--ink-900)" },
  statDelta: (pos) => ({
    fontSize: 12, fontWeight: 500, marginLeft: 8,
    color: pos ? "var(--ok-700)" : "var(--bad-700)",
  }),

  // Table card
  card: {
    maxWidth: 1440, margin: "20px auto 60px",
    padding: 0,
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "var(--shadow-sm)",
  },
  cardHead: {
    padding: "18px 22px",
    display: "flex", alignItems: "center", gap: 14,
    borderBottom: "1px solid var(--line-2)",
  },
  cardTitle: { fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em" },
  tabs: { display: "flex", gap: 4, marginLeft: 12 },
  tab: (active) => ({
    padding: "6px 12px", borderRadius: 8,
    fontSize: 13.5, fontWeight: 500,
    color: active ? "var(--navy-900)" : "var(--ink-500)",
    background: active ? "var(--blue-100)" : "transparent",
    border: 0, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 7,
  }),
  tabCount: (active) => ({
    fontSize: 11, padding: "1px 7px", borderRadius: 999,
    background: active ? "white" : "var(--blue-100)",
    color: active ? "var(--navy-900)" : "var(--ink-500)",
    fontWeight: 600,
  }),
  toolbar: {
    marginLeft: "auto",
    display: "flex", alignItems: "center", gap: 8,
  },
  toolBtn: {
    height: 36, padding: "0 12px",
    borderRadius: 9,
    background: "var(--paper)",
    border: "1px solid var(--line)",
    color: "var(--ink-700)",
    fontSize: 13, fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 7,
  },

  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    textAlign: "left",
    padding: "12px 18px",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--ink-500)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid var(--line-2)",
    background: "oklch(0.985 0.008 245)",
    whiteSpace: "nowrap",
    userSelect: "none",
  },
  thSortable: { cursor: "pointer" },
  td: {
    padding: "14px 18px",
    borderBottom: "1px solid var(--line-2)",
    color: "var(--ink-900)",
    verticalAlign: "middle",
  },
  rowHover: { background: "oklch(0.985 0.008 245)" },

  coTag: {
    display: "inline-flex", alignItems: "center", gap: 9,
    fontWeight: 500,
  },
  coDot: (c) => ({
    width: 10, height: 10, borderRadius: 3, background: c,
    flexShrink: 0,
  }),

  plate: {
    display: "inline-flex", alignItems: "center", gap: 0,
    border: "1.5px solid var(--ink-900)",
    borderRadius: 5,
    padding: "3px 9px",
    fontSize: 12.5,
    letterSpacing: "0.06em",
    fontWeight: 600,
    color: "var(--ink-900)",
    background: "oklch(0.99 0.005 245)",
    fontFamily: "'JetBrains Mono', monospace",
  },
  plateNone: { color: "var(--ink-400)", fontSize: 13 },

  pill: (kind) => {
    const palette = {
      vigente:   { bg: "var(--ok-100)",   fg: "var(--ok-700)",   dot: "var(--ok-500)"   },
      porvencer: { bg: "var(--warn-100)", fg: "var(--warn-700)", dot: "var(--warn-500)" },
      vencida:   { bg: "var(--bad-100)",  fg: "var(--bad-700)",  dot: "var(--bad-500)"  },
    }[kind];
    return {
      display: "inline-flex", alignItems: "center", gap: 7,
      background: palette.bg, color: palette.fg,
      padding: "4px 10px 4px 9px",
      borderRadius: 999,
      fontSize: 12.5, fontWeight: 600,
      "--dot": palette.dot,
    };
  },
  pillDot: (kind) => ({
    width: 7, height: 7, borderRadius: "50%",
    background: { vigente: "var(--ok-500)", porvencer: "var(--warn-500)", vencida: "var(--bad-500)" }[kind],
  }),

  cardFoot: {
    padding: "14px 22px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderTop: "1px solid var(--line-2)",
    background: "oklch(0.985 0.008 245)",
    fontSize: 13, color: "var(--ink-500)",
  },
  pager: { display: "flex", alignItems: "center", gap: 4 },
  pageBtn: (active, disabled) => ({
    minWidth: 32, height: 32,
    borderRadius: 7,
    border: "1px solid " + (active ? "var(--blue-600)" : "transparent"),
    background: active ? "var(--blue-100)" : "transparent",
    color: disabled ? "var(--ink-400)" : active ? "var(--navy-900)" : "var(--ink-700)",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13, fontWeight: 500,
    padding: "0 8px",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
  }),

  primaryBtn: {
    height: 40, padding: "0 16px",
    borderRadius: 10,
    background: "var(--navy-900)",
    color: "white", border: 0, cursor: "pointer",
    fontSize: 14, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 8,
  },

  filterChips: {
    display: "flex", gap: 8, padding: "12px 22px",
    borderBottom: "1px solid var(--line-2)",
    background: "var(--paper)",
    alignItems: "center",
    flexWrap: "wrap",
  },
  chip: (active) => ({
    padding: "5px 11px",
    borderRadius: 999,
    fontSize: 12.5,
    fontWeight: 500,
    border: "1px solid " + (active ? "var(--navy-900)" : "var(--line)"),
    background: active ? "var(--navy-900)" : "var(--paper)",
    color: active ? "white" : "var(--ink-700)",
    cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 6,
  }),
};

function Dashboard({ onLogout, onNavigate }) {
  const [tab, setTab] = React.useState("todas");
  const [search, setSearch] = React.useState("");
  const [ramo, setRamo] = React.useState("todos");
  const [page, setPage] = React.useState(1);
  const PER_PAGE = 8;
  const [hover, setHover] = React.useState(null);
  const [ficha, setFicha]         = React.useState(null);
  const [editPol, setEditPol]     = React.useState(null);
  const [bajaConfirm, setBajaConfirm] = React.useState(null);

  const [rows, setRows] = React.useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("amr_polizas") || "[]");
      const storedRows = stored.map(p => ({
        co: typeof p.co === "number" ? Math.min(p.co, COMPANIES.length - 1) : 0,
        pol: p.pol, cli: p.cli, pat: p.pat || "—",
        est: p.est || "vigente", ven: p.ven || "—", ramo: p.ramo
      }));
      return [...storedRows, ...ROWS];
    } catch(e) { return [...ROWS]; }
  });

  const allDetail = React.useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("amr_polizas") || "[]");
      const extra = {};
      stored.forEach(p => {
        extra[p.pol] = { dni: p.dni, telefono: p.telefono, email: p.email,
          domicilio: p.domicilio, marca: p.marca, modelo: p.modelo,
          anio: p.anio, chasis: p.chasis, motor: p.motor, combustion: p.combustion };
      });
      return { ...ROWS_DETAIL, ...extra };
    } catch(e) { return ROWS_DETAIL; }
  }, []);

  const searchResults = React.useMemo(() => {
    if (!search || search.trim().length < 2) return [];
    const q = normStr(search);
    return rows
      .filter(r =>
        normStr(r.cli).includes(q) ||
        normStr(r.pol).includes(q) ||
        normStr(r.pat).includes(q)
      )
      .slice(0, 6)
      .map(r => ({ ...r, coName: COMPANIES[r.co].n, coColor: COMPANIES[r.co].c }));
  }, [search, rows]);

  const tabCounts = React.useMemo(() => ({
    todas: rows.length,
    vigente: rows.filter(r => r.est === "vigente").length,
    porvencer: rows.filter(r => r.est === "porvencer").length,
    vencida: rows.filter(r => r.est === "vencida").length,
  }), [rows]);

  const filtered = rows.filter(r => {
    if (tab !== "todas" && r.est !== tab) return false;
    if (ramo !== "todos" && r.ramo !== ramo) return false;
    if (search.trim()) {
      const q = normStr(search);
      if (!normStr(r.cli).includes(q)
       && !normStr(r.pol).includes(q)
       && !normStr(r.pat).includes(q)
       && !normStr(COMPANIES[r.co].n).includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PER_PAGE;
  const paged = filtered.slice(pageStart, pageStart + PER_PAGE);

  // Volver a página 1 cuando cambian filtros/búsqueda
  React.useEffect(() => { setPage(1); }, [tab, ramo, search]);
  React.useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  // Lista compacta de páginas con elipsis
  const pageList = React.useMemo(() => {
    const out = [];
    const add = (p) => { if (!out.includes(p) && p >= 1 && p <= totalPages) out.push(p); };
    if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p++) out.push(p);
      return out;
    }
    add(1);
    if (safePage > 3) out.push("…");
    add(safePage - 1); add(safePage); add(safePage + 1);
    if (safePage < totalPages - 2) out.push("…");
    add(totalPages);
    return out;
  }, [totalPages, safePage]);

  return (
    <div style={dashStyles.page}>
      <Navbar active="cartera" onNavigate={onNavigate} onLogout={onLogout}
              search={search} setSearch={setSearch}
              searchResults={searchResults}
              onViewFicha={(pol) => { setFicha(rows.find(r => r.pol === pol) || null); setSearch(""); }}
              onCargarBaja={(pol) => { setBajaConfirm(rows.find(r => r.pol === pol) || null); setSearch(""); }} />

      {/* HERO */}
      <div style={dashStyles.hero}>
        <div>
          <div style={dashStyles.crumb}>Inicio · Cartera</div>
          <h1 style={dashStyles.h1}>Cartera de clientes</h1>
          <p style={dashStyles.sub}>
            {filtered.length} de {rows.length} pólizas · actualizado hace 4 min
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{...dashStyles.toolBtn, height: 40}}>
            <IconDown size={15} /> Exportar
          </button>
          <button style={dashStyles.primaryBtn} onClick={() => onNavigate?.("nueva")}>
            <IconPlus size={16} /> Nueva póliza
          </button>
        </div>
      </div>

      {/* STATS */}
      <section style={dashStyles.stats}>
        <StatCard label="Pólizas vigentes" n="1.184" delta="+12 este mes" pos icon={<IconShield size={14} />} />
        <StatCard label="Por vencer (30 días)" n="38" delta="+6" warn icon={<IconCal size={14} />} />
        <StatCard label="Prima mensual" n="$ 24.8M" delta="+4.2%" pos />
        <StatCard label="Cobranzas pendientes" n="$ 1.92M" delta="-8.1%" pos />
      </section>

      {/* TABLE CARD */}
      <section style={dashStyles.card}>
        <div style={dashStyles.cardHead}>
          <div style={dashStyles.cardTitle}>Pólizas</div>
          <div style={dashStyles.tabs}>
            {[
              ["todas", "Todas"],
              ["vigente", "Vigentes"],
              ["porvencer", "Por vencer"],
              ["vencida", "Vencidas"],
            ].map(([k, l]) => (
              <button key={k} style={dashStyles.tab(tab === k)} onClick={() => setTab(k)}>
                {l} <span style={dashStyles.tabCount(tab === k)}>{tabCounts[k]}</span>
              </button>
            ))}
          </div>

          <div style={dashStyles.toolbar}>
            <button style={dashStyles.toolBtn}>
              <IconFilter size={14} /> Filtros
            </button>
            <button style={dashStyles.toolBtn}>
              Ordenar por: Vencimiento <IconChevD size={13} />
            </button>
          </div>
        </div>

        <div style={dashStyles.filterChips}>
          <span style={{ fontSize: 12, color: "var(--ink-500)", marginRight: 4 }}>Ramo:</span>
          {["todos", "Automotor", "Hogar", "Vida", "Comercio", "Motovehículo", "ART"].map(r => (
            <button key={r} style={dashStyles.chip(ramo === r)} onClick={() => setRamo(r)}>
              {r === "todos" ? "Todos los ramos" : r}
            </button>
          ))}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={dashStyles.table}>
            <thead>
              <tr>
                <th style={dashStyles.th}>Compañía</th>
                <th style={dashStyles.th}>Póliza</th>
                <th style={dashStyles.th}>Nombre</th>
                <th style={dashStyles.th}>Patente</th>
                <th style={dashStyles.th}>Vencimiento</th>
                <th style={dashStyles.th}>Estado</th>
                <th style={{...dashStyles.th, width: 50}}></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r, i) => {
                const co = COMPANIES[r.co];
                const hovered = hover === i;
                return (
                  <tr key={i}
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                      style={hovered ? dashStyles.rowHover : null}>
                    <td style={dashStyles.td}>
                      <div style={dashStyles.coTag}>
                        <span style={dashStyles.coDot(co.c)} />
                        {co.n}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2, marginLeft: 19 }}>
                        {r.ramo}
                      </div>
                    </td>
                    <td style={dashStyles.td}>
                      <span className="mono" style={{ fontSize: 13.5, fontWeight: 500 }}>{r.pol}</span>
                    </td>
                    <td style={dashStyles.td}>
                      <div style={{ fontWeight: 500 }}>{r.cli}</div>
                    </td>
                    <td style={dashStyles.td}>
                      {r.pat === "—"
                        ? <span style={dashStyles.plateNone}>—</span>
                        : <span style={dashStyles.plate}>{r.pat}</span>}
                    </td>
                    <td style={{...dashStyles.td, color: "var(--ink-700)", fontSize: 13.5}}>
                      {r.ven}
                    </td>
                    <td style={dashStyles.td}>
                      <span style={dashStyles.pill(r.est)}>
                        <span style={dashStyles.pillDot(r.est)} />
                        {r.est === "vigente" ? "Vigente" : r.est === "porvencer" ? "Por vencer" : "Vencida"}
                      </span>
                    </td>
                    <td style={dashStyles.td}>
                      <RowMenu row={r} allDetail={allDetail}
                        onNavigate={onNavigate}
                        onViewFicha={(pol) => setFicha(rows.find(x => x.pol === pol) || null)}
                        onEditPol={(row) => setEditPol(row)}
                        onCargarBaja={(row) => setBajaConfirm(row)} />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="7" style={{...dashStyles.td, textAlign: "center", padding: "60px 0", color: "var(--ink-500)"}}>
                  No se encontraron pólizas con esos criterios.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={dashStyles.cardFoot}>
          <div>
            {filtered.length === 0 ? (
              <>Sin resultados para los filtros actuales</>
            ) : (
              <>
                Mostrando <strong style={{ color: "var(--ink-900)" }}>{pageStart + 1}–{Math.min(pageStart + PER_PAGE, filtered.length)}</strong> de{" "}
                <strong style={{ color: "var(--ink-900)" }}>{filtered.length}</strong> resultados
              </>
            )}
          </div>
          <div style={dashStyles.pager}>
            <button style={dashStyles.pageBtn(false, safePage === 1)} disabled={safePage === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}>
              <IconChevL size={14} />
            </button>
            {pageList.map((p, idx) =>
              p === "…" ? (
                <span key={"e" + idx} style={{ padding: "0 6px", color: "var(--ink-400)" }}>…</span>
              ) : (
                <button key={p} style={dashStyles.pageBtn(p === safePage)} onClick={() => setPage(p)}>{p}</button>
              )
            )}
            <button style={dashStyles.pageBtn(false, safePage === totalPages)} disabled={safePage === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              <IconChevR size={14} />
            </button>
          </div>
        </div>
      </section>
      {ficha && <FichaModal row={ficha} detail={allDetail[ficha.pol] || {}} onClose={() => setFicha(null)} />}
      {bajaConfirm && (
        <ConfirmBajaModal
          row={bajaConfirm}
          onClose={() => setBajaConfirm(null)}
          onConfirm={() => {
            const r = bajaConfirm;
            setBajaConfirm(null);
            onNavigate?.("bajas", { pol: r.pol, cli: r.cli, co: COMPANIES[r.co]?.n || "", ramo: r.ramo, pat: r.pat });
          }}
        />
      )}
      {editPol && (
        <EditPolModal
          row={editPol}
          onClose={() => setEditPol(null)}
          onSave={(oldPol, newPol) => {
            setRows(prev => prev.map(r => r.pol === oldPol ? { ...r, pol: newPol } : r));
            try {
              const stored = JSON.parse(localStorage.getItem("amr_polizas") || "[]");
              const updated = stored.map(p => p.pol === oldPol ? { ...p, pol: newPol } : p);
              localStorage.setItem("amr_polizas", JSON.stringify(updated));
            } catch(e) {}
            setEditPol(null);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, n, delta, pos, warn, icon }) {
  return (
    <div style={dashStyles.stat}>
      <div style={dashStyles.statL}>
        {icon && <span style={{ color: warn ? "var(--warn-700)" : "var(--blue-600)" }}>{icon}</span>}
        {label}
      </div>
      <div>
        <span style={dashStyles.statN} className="mono">{n}</span>
        {delta && (
          <span style={{
            fontSize: 12, fontWeight: 500, marginLeft: 8,
            color: warn ? "var(--warn-700)" : pos ? "var(--ok-700)" : "var(--bad-700)",
          }}>{delta}</span>
        )}
      </div>
    </div>
  );
}

function FichaModal({ row, detail, onClose }) {
  const [copied, setCopied] = React.useState(null);
  const co = COMPANIES[row.co];

  const copy = (key, val) => {
    if (!val || val === "—") return;
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const CopyBtn = ({ fkey, val }) => (
    <button
      onClick={() => copy(fkey, val)}
      title="Copiar"
      style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        border: "1.5px solid " + (copied === fkey ? "var(--ok-500)" : "var(--line)"),
        background: copied === fkey ? "var(--ok-100)" : "var(--paper)",
        color: copied === fkey ? "var(--ok-700)" : "var(--ink-400)",
        cursor: val && val !== "—" ? "pointer" : "default",
        display: "grid", placeItems: "center",
        transition: "all .15s", opacity: val && val !== "—" ? 1 : 0.35
      }}>
      {copied === fkey
        ? <IconCheck size={12} sw={2.5} />
        : <Icon size={13} d={<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>} />
      }
    </button>
  );

  const FieldRow = ({ label, fkey, val, mono }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 0", borderBottom: "1px solid var(--line-2)"
    }}>
      <div style={{ fontSize: 12, color: "var(--ink-500)", width: 108, flexShrink: 0 }}>{label}</div>
      <div style={{
        flex: 1, fontWeight: 500,
        color: val && val !== "—" ? "var(--ink-900)" : "var(--ink-400)",
        fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
        fontSize: mono ? 12.5 : 13.5,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
      }}>{val || "—"}</div>
      <CopyBtn fkey={fkey} val={val} />
    </div>
  );

  const personalFields = [
    { label: "Nombre completo", fkey: "cli",      val: row.cli },
    { label: "DNI / CUIL",      fkey: "dni",      val: detail.dni },
    { label: "Teléfono",        fkey: "telefono", val: detail.telefono },
    { label: "Email",           fkey: "email",    val: detail.email },
    { label: "Domicilio",       fkey: "domicilio",val: detail.domicilio },
  ];

  const vehicleFields = [
    { label: "Patente",    fkey: "pat",       val: row.pat !== "—" ? row.pat : null, mono: true },
    { label: "Marca",      fkey: "marca",     val: detail.marca },
    { label: "Modelo",     fkey: "modelo",    val: detail.modelo },
    { label: "Año",        fkey: "anio",      val: detail.anio,    mono: true },
    { label: "N° Chasis",  fkey: "chasis",    val: detail.chasis,  mono: true },
    { label: "N° Motor",   fkey: "motor",     val: detail.motor,   mono: true },
    { label: "Combustión", fkey: "combustion",val: detail.combustion },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "oklch(0.18 0.06 252 / 0.50)",
        backdropFilter: "blur(5px)",
        zIndex: 50, display: "grid", placeItems: "center", padding: 24
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 700, maxWidth: "100%",
          background: "var(--paper)",
          borderRadius: 16,
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          maxHeight: "calc(100vh - 48px)",
          display: "flex", flexDirection: "column"
        }}>

        {/* Header */}
        <div style={{
          padding: "20px 24px",
          background: "linear-gradient(160deg, var(--navy-950), var(--navy-800))",
          color: "white",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
          flexShrink: 0
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.65, marginBottom: 5 }}>
              Ficha del asegurado
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{row.cli}</div>
            <div style={{ fontSize: 13, color: "oklch(0.78 0.04 240)", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: co.c, display: "inline-block" }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{row.pol}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              {co.n}
              <span style={{ opacity: 0.5 }}>·</span>
              {row.ramo}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 9,
            border: "1px solid oklch(1 0 0 / 0.15)",
            background: "oklch(1 0 0 / 0.08)",
            color: "oklch(0.85 0.04 240)",
            cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0
          }}>
            <IconClose size={16} />
          </button>
        </div>

        {/* Body */}
      <div style={{
        flex: 1, minHeight: 0,
        padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, overflowY: "auto"
      }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--blue-600)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
              Datos del asegurado
            </div>
            {personalFields.map(f => <FieldRow key={f.fkey} {...f} />)}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--blue-600)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
              Datos del vehículo
            </div>
            {vehicleFields.map(f => <FieldRow key={f.fkey} {...f} />)}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid var(--line-2)",
          background: "oklch(0.985 0.008 245)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--ink-700)" }}>
            <span style={dashStyles.pill(row.est)}>
              <span style={dashStyles.pillDot(row.est)} />
              {row.est === "vigente" ? "Vigente" : row.est === "porvencer" ? "Por vencer" : "Vencida"}
            </span>
            <span>Vence: <strong style={{ color: "var(--ink-900)" }}>{row.ven}</strong></span>
          </div>
          <button onClick={onClose} style={{
            height: 36, padding: "0 16px", borderRadius: 9,
            border: "1px solid var(--line)", background: "var(--paper)",
            color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer"
          }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPolModal({ row, onClose, onSave }) {
  const [val, setVal] = React.useState("");
  const [err, setErr] = React.useState("");
  const inputRef = React.useRef(null);
  const isET = row.pol.startsWith("E/T-");

  React.useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const handleSave = () => {
    const trimmed = val.trim();
    if (!trimmed) { setErr("Ingresá el número de póliza."); return; }
    if (trimmed === row.pol) { setErr("El número ingresado es igual al actual."); return; }
    onSave(row.pol, trimmed);
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: "oklch(0.18 0.06 252 / 0.50)",
      backdropFilter: "blur(5px)",
      zIndex: 50, display: "grid", placeItems: "center", padding: 24
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 480, background: "var(--paper)",
        borderRadius: 16, boxShadow: "var(--shadow-lg)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          background: "linear-gradient(160deg, var(--navy-950), var(--navy-800))",
          color: "white",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.65, marginBottom: 5 }}>
              {isET ? "Asignar número definitivo" : "Editar número de póliza"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>{row.cli}</div>
            <div style={{ fontSize: 12.5, color: "oklch(0.78 0.04 240)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              Actual: {row.pol}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 8,
            border: "1px solid oklch(1 0 0 / 0.15)",
            background: "oklch(1 0 0 / 0.08)",
            color: "oklch(0.85 0.04 240)",
            cursor: "pointer", display: "grid", placeItems: "center"
          }}><IconClose size={15} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 24px" }}>
          {isET && (
            <div style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              padding: "12px 14px", borderRadius: 10, marginBottom: 18,
              background: "oklch(0.97 0.04 80)",
              border: "1px solid oklch(0.88 0.08 80)"
            }}>
              <Icon size={16} d={<><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3v.01"/></>}
                style={{ color: "oklch(0.55 0.13 78)", flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: "oklch(0.42 0.10 70)" }}>
                Esta póliza fue cargada como <strong>E/T (en trámite)</strong>. Una vez que la compañía emita el número definitivo, ingresalo acá para actualizar la cartera.
              </div>
            </div>
          )}

          <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 8 }}>
            Nuevo número de póliza <span style={{ color: "var(--bad-700)" }}>*</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            border: "1.5px solid " + (err ? "var(--bad-500)" : "var(--blue-500)"),
            boxShadow: err ? "0 0 0 4px oklch(0.62 0.16 28 / 0.12)" : "0 0 0 4px oklch(0.62 0.16 243 / 0.12)",
            borderRadius: 10, padding: "0 14px", height: 48, background: "var(--paper)"
          }}>
            <Icon size={16} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}
              style={{ color: "var(--ink-400)", flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={val}
              onChange={e => { setVal(e.target.value.toUpperCase()); setErr(""); }}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="AUT-2611-123456"
              style={{
                flex: 1, border: 0, outline: 0, background: "transparent",
                fontSize: 15, fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600, color: "var(--ink-900)", letterSpacing: "0.04em"
              }}
            />
          </div>
          {err && <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--bad-700)" }}>{err}</div>}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid var(--line-2)",
          background: "oklch(0.985 0.008 245)",
          display: "flex", justifyContent: "flex-end", gap: 10
        }}>
          <button onClick={onClose} style={{
            height: 38, padding: "0 16px", borderRadius: 9,
            border: "1px solid var(--line)", background: "var(--paper)",
            color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer"
          }}>Cancelar</button>
          <button onClick={handleSave} style={{
            height: 38, padding: "0 18px", borderRadius: 9,
            border: 0,
            background: "linear-gradient(180deg, var(--navy-800), var(--navy-950))",
            color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8
          }}>
            <IconCheck size={14} sw={2.5} /> Guardar número
          </button>
        </div>
      </div>
    </div>
  );
}

function RowMenu({ row, allDetail, onNavigate, onViewFicha, onEditPol }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  const isET = row.pol.startsWith("E/T-");

  const items = [
    {
      l: "Ver ficha",
      action: () => { onViewFicha(row.pol); setOpen(false); }
    },
    {
      l: isET ? "Asignar N° de póliza" : "Editar N° de póliza",
      highlight: isET,
      action: () => { setOpen(false); onEditPol?.(row); }
    },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ ...dashStyles.iconBtnNav, color: open ? "var(--ink-700)" : "var(--ink-400)", width: 30, height: 30 }}>
        <IconDots size={18} />
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)",
          background: "var(--paper)", border: "1px solid var(--line)",
          borderRadius: 10, boxShadow: "var(--shadow-lg)",
          padding: 4, zIndex: 30, minWidth: 210
        }}>
              {items.map((item, i) => (
            <button key={i} onClick={item.action}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "9px 12px", borderRadius: 7,
                border: 0,
                background: item.highlight ? "oklch(0.97 0.04 80)" : item.danger ? "transparent" : "transparent",
                color: item.highlight ? "oklch(0.42 0.10 70)" : item.danger ? "var(--bad-700)" : "var(--ink-700)",
                fontSize: 13.5, fontWeight: item.highlight || item.danger ? 600 : 500,
                cursor: "pointer", textAlign: "left"
              }}
              onMouseEnter={e => e.currentTarget.style.background = item.highlight ? "oklch(0.93 0.06 80)" : item.danger ? "var(--bad-100)" : "var(--blue-50)"}
              onMouseLeave={e => e.currentTarget.style.background = item.highlight ? "oklch(0.97 0.04 80)" : "transparent"}>
              {item.highlight && <Icon size={13} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} />}
              {item.danger && <Icon size={13} d={<><path d="M12 5v14M5 12h14"/></>} style={{ transform: "rotate(45deg)" }} />}
              {item.l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfirmBajaModal({ row, onClose, onConfirm }) {
  const co = COMPANIES[row.co] || { n: "", c: "var(--ink-400)" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "oklch(0.18 0.06 252/0.50)", backdropFilter: "blur(5px)", zIndex: 50, display: "grid", placeItems: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 440, background: "var(--paper)", borderRadius: 16, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", background: "linear-gradient(160deg, oklch(0.42 0.10 28), oklch(0.30 0.10 25))", color: "white" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.65, marginBottom: 5 }}>Cargar baja</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>¿Estas seguro?</div>
        </div>
        <div style={{ padding: "22px 24px" }}>
          <div style={{ padding: "14px 16px", background: "oklch(0.985 0.008 245)", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 13 }}>
            <div><span style={{ color: "var(--ink-500)" }}>Cliente: </span><strong style={{ color: "var(--ink-900)" }}>{row.cli}</strong></div>
            <div><span style={{ color: "var(--ink-500)" }}>Póliza: </span><strong style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{row.pol}</strong></div>
            <div><span style={{ color: "var(--ink-500)" }}>Compañía: </span><strong style={{ color: "var(--ink-900)" }}>{co.n}</strong></div>
            <div><span style={{ color: "var(--ink-500)" }}>Ramo: </span><strong style={{ color: "var(--ink-900)" }}>{row.ramo}</strong></div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "var(--bad-100)", border: "1px solid oklch(0.88 0.08 28)", borderRadius: 10, fontSize: 13, color: "var(--bad-700)" }}>
            <Icon size={15} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4m0 4v.01"/></>} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Esta acción registrará la baja de la póliza. Podrás darla de alta nuevamente desde la sección Bajas.</span>
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>Cancelar</button>
          <button onClick={onConfirm} style={{ height: 38, padding: "0 18px", borderRadius: 9, border: 0, background: "var(--bad-600)", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon size={14} d={<><path d="M12 5v14M5 12h14"/></>} /> Sí, cargar baja
          </button>
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
