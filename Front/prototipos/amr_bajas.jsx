// AMR — Gestión de Bajas

const MOTIVOS_BAJA = [
  "Venta del vehículo",
  "Cambio de compañía",
  "No renovación",
  "Solicitud del cliente",
  "Siniestro total",
  "Falta de pago",
  "Otro",
];

const BAJAS_SEED = [
  { id: "b-001", fecha: "2026-04-10", poliza: "AUT-2406-700218", cliente: "Marcela Domínguez", compania: "La Perseverancia Seguros",      ramo: "Automotor", pat: "LIE 442",   motivo: "Venta del vehículo",  obs: "",                            estado: "baja" },
  { id: "b-002", fecha: "2026-03-22", poliza: "VID-2403-771122", cliente: "Camila Suárez",     compania: "Paraná Seguros",             ramo: "Vida",      pat: "—",          motivo: "Solicitud del cliente", obs: "El cliente no desea renovar.", estado: "baja" },
  { id: "b-003", fecha: "2026-02-15", poliza: "AUT-2502-009912", cliente: "Valentina Ortiz",   compania: "Libra", ramo: "Automotor", pat: "RLK 219",   motivo: "Cambio de compañía",  obs: "",                            estado: "alta",
    altaFecha: "2026-04-01", altaCompania: "La Perseverancia Seguros", altaCobertura: "Todo Riesgo", altaPrecio: "52000" },
];

const COMPANIES_B = getCompanias().map(c => c.n).concat("Otra");
const COBERTURAS_B = ["Responsabilidad Civil","Terceros Completo","Todo Riesgo","Granizo","Robo Total","Incendio","Otro"];

function loadBajas() {
  try {
    const s = JSON.parse(localStorage.getItem("amr_bajas") || "null");
    if (!s) { localStorage.setItem("amr_bajas", JSON.stringify(BAJAS_SEED)); return BAJAS_SEED; }
    return s;
  } catch(e) { return []; }
}

function getAllRows() {
  try {
    const stored = JSON.parse(localStorage.getItem("amr_polizas") || "[]");
    const BASE = [
      { pol:"AUT-2410-887143", cli:"Martín Acosta",        pat:"ABC 123", co:"NRE Cia Seguros",             ramo:"Automotor", est:"vigente" },
      { pol:"HOG-2510-002411", cli:"Lucía Fernández",      pat:"—",       co:"Libra", ramo:"Hogar",     est:"vigente" },
      { pol:"AUT-2509-114902", cli:"Ricardo Pérez",        pat:"DEF 456", co:"La Perseverancia Seguros",      ramo:"Automotor", est:"vigente" },
      { pol:"VID-2403-771122", cli:"Camila Suárez",        pat:"—",       co:"Paraná Seguros",             ramo:"Vida",      est:"vigente" },
      { pol:"AUT-2401-558204", cli:"Federico Bianchi",     pat:"GHI 789", co:"NRE Cia Seguros",             ramo:"Automotor", est:"vigente" },
      { pol:"AUT-2506-339118", cli:"Sofía Romero",         pat:"JKL 012", co:"Agrosalta Coop Seg",    ramo:"Automotor", est:"vigente" },
      { pol:"COM-2505-440099", cli:"Comercio La Estación", pat:"—",       co:"ATM Seguros",       ramo:"Comercio",  est:"vigente" },
      { pol:"AUT-2508-217733", cli:"Diego Molina",         pat:"MNO 345", co:"NRE Cia Seguros",              ramo:"Automotor", est:"vigente" },
      { pol:"ART-2412-558112", cli:"Construcciones Norte", pat:"—",       co:"Libra", ramo:"ART",       est:"vigente" },
      { pol:"AUT-2502-009912", cli:"Valentina Ortiz",      pat:"RLK 219", co:"Libra", ramo:"Automotor", est:"vigente" },
      { pol:"MOT-2511-321001", cli:"Joaquín Silva",        pat:"PQR 678", co:"La Perseverancia Seguros",      ramo:"Automotor", est:"vigente" },
      { pol:"AUT-2406-700218", cli:"Marcela Domínguez",    pat:"LIE 442", co:"La Perseverancia Seguros",      ramo:"Automotor", est:"vencida" },
    ];
    return [...stored.map(p => ({ pol:p.pol, cli:p.cli, pat:p.pat||"—", co:p.co||"", ramo:p.ramo, est:p.est||"vigente" })), ...BASE];
  } catch(e) { return []; }
}

const bStyles = {
  page: { background: "var(--canvas)", minHeight: "100vh" },
  hero: { maxWidth: 1440, margin: "0 auto", padding: "32px 28px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 },
  shell: { maxWidth: 1440, margin: "0 auto 60px", padding: "0 28px" },
  addBtn: { height: 42, padding: "0 18px", borderRadius: 10, background: "var(--bad-600)", color: "white", border: 0, cursor: "pointer", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 },
  card: { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-sm)", overflow: "hidden" },
  th: { textAlign: "left", padding: "11px 20px", fontSize: 11, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", whiteSpace: "nowrap" },
  td: { padding: "13px 20px", borderBottom: "1px solid var(--line-2)", color: "var(--ink-900)", verticalAlign: "middle" },
  badgeBaja: { display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "var(--bad-100)", color: "var(--bad-700)" },
  badgeAlta: { display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: "var(--ok-100)", color: "var(--ok-700)" },
};

const normStr = s => (s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();

function Bajas({ onNavigate, onLogout, initialData }) {
  const [bajas, setBajas]     = React.useState(loadBajas);
  const [tab, setTab]         = React.useState("todas");
  const [search, setSearch]   = React.useState("");
  const [modal, setModal]     = React.useState(() =>
    initialData ? "nueva" : null
  ); // "nueva" | { mode:"alta", baja } | { mode:"ver", baja }

  const save = (list) => { setBajas(list); localStorage.setItem("amr_bajas", JSON.stringify(list)); };

  const handleNueva = (entry) => {
    save([{ id: "b-" + Date.now(), ...entry, estado: "baja" }, ...bajas]);
    setModal(null);
  };

  const handleAlta = (id, altaData) => {
    const updated = bajas.map(b => b.id === id ? { ...b, estado: "alta", ...altaData } : b);
    save(updated);
    // Add as new vigente policy in localStorage
    try {
      const baja = bajas.find(b => b.id === id);
      const stored = JSON.parse(localStorage.getItem("amr_polizas") || "[]");
      const num = "E/T-" + Math.floor(100000 + Math.random() * 899999);
      const newPol = { co: 0, pol: num, cli: baja.cliente, pat: baja.pat || "—", est: "vigente", ven: "—", ramo: baja.ramo };
      localStorage.setItem("amr_polizas", JSON.stringify([newPol, ...stored]));
    } catch(e) {}
    setModal(null);
  };

  const filtered = bajas.filter(b => {
    if (tab === "baja" && b.estado !== "baja") return false;
    if (tab === "alta" && b.estado !== "alta") return false;
    if (search.trim()) {
      const q = normStr(search);
      return normStr(b.cliente).includes(q) || normStr(b.poliza).includes(q) || normStr(b.motivo).includes(q);
    }
    return true;
  });

  const counts = { todas: bajas.length, baja: bajas.filter(b => b.estado === "baja").length, alta: bajas.filter(b => b.estado === "alta").length };

  return (
    <div style={bStyles.page}>
      <Navbar active="bajas" onNavigate={onNavigate} onLogout={onLogout} />

      <div style={bStyles.hero}>
        <div>
          <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 }}>
            <span style={{ cursor: "pointer", color: "var(--blue-600)" }} onClick={() => onNavigate?.("dashboard")}>Inicio</span> · Bajas
          </div>
          <h1 style={{ margin: 0, fontSize: 30, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" }}>Gestión de bajas</h1>
          <p style={{ margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14.5 }}>Registrá bajas, consultá el historial y gestioná reactivaciones.</p>
        </div>
        <button style={bStyles.addBtn} onClick={() => setModal("nueva")}>
          <Icon size={15} d={<><path d="M12 5v14M5 12h14"/></>} /> Nueva baja
        </button>
      </div>

      <div style={bStyles.shell}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { l: "Total registradas", n: counts.todas, color: "var(--ink-900)" },
            { l: "En baja",           n: counts.baja,  color: "var(--bad-700)" },
            { l: "Dados de alta",     n: counts.alta,  color: "var(--ok-700)"  },
          ].map((s,i) => (
            <div key={i} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 20px" }}>
              <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 500 }}>{s.l}</div>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4, fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.n}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: 4 }}>
            {[["todas","Todas"], ["baja","En baja"], ["alta","Dados de alta"]].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                padding: "7px 14px", borderRadius: 7, border: 0, cursor: "pointer",
                background: tab === k ? "var(--navy-900)" : "transparent",
                color: tab === k ? "white" : "var(--ink-700)",
                fontSize: 13, fontWeight: 500
              }}>{l} <span style={{ opacity: 0.7, fontSize: 11 }}>({counts[k]})</span></button>
            ))}
          </div>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 10, padding: "0 12px", height: 40, flex: 1, maxWidth: 360 }}>
            <IconSearch size={15} style={{ color: "var(--ink-400)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente, póliza o motivo…"
              style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 13.5, color: "var(--ink-900)" }} />
          </div>
        </div>

        {/* Table */}
        <div style={bStyles.card}>
          {filtered.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ink-500)", fontSize: 14 }}>
              No hay bajas registradas con esos criterios.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr>
                  <th style={bStyles.th}>Cliente</th>
                  <th style={bStyles.th}>Póliza</th>
                  <th style={bStyles.th}>Compañía</th>
                  <th style={bStyles.th}>Ramo</th>
                  <th style={bStyles.th}>Fecha baja</th>
                  <th style={bStyles.th}>Motivo</th>
                  <th style={bStyles.th}>Estado</th>
                  <th style={{ ...bStyles.th, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => (
                  <tr key={b.id}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--blue-50)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ ...bStyles.td, fontWeight: 500 }}>{b.cliente}</td>
                    <td style={{ ...bStyles.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>{b.poliza}</td>
                    <td style={bStyles.td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: "oklch(0.55 0.13 78)", flexShrink: 0 }} />
                        {b.compania}
                      </span>
                    </td>
                    <td style={{ ...bStyles.td, color: "var(--ink-700)" }}>{b.ramo}</td>
                    <td style={{ ...bStyles.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>
                      {b.fecha.split("-").reverse().join("/")}
                    </td>
                    <td style={{ ...bStyles.td, color: "var(--ink-700)" }}>{b.motivo}</td>
                    <td style={bStyles.td}>
                      {b.estado === "baja"
                        ? <span style={bStyles.badgeBaja}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--bad-500)" }} />En baja</span>
                        : <span style={bStyles.badgeAlta}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ok-500)" }} />Dado de alta</span>
                      }
                    </td>
                    <td style={{ ...bStyles.td, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button title="Ver detalle"
                          onClick={() => setModal({ mode: "ver", baja: b })}
                          style={{ height: 30, padding: "0 10px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>
                          Ver
                        </button>
                        {b.estado === "baja" && (
                          <button title="Dar de alta"
                            onClick={() => setModal({ mode: "alta", baja: b })}
                            style={{ height: 30, padding: "0 10px", borderRadius: 7, border: 0, background: "var(--ok-700)", color: "white", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                            Dar de alta
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal === "nueva" && <NuevaBajaModal onClose={() => setModal(null)} onSave={handleNueva} preSelected={initialData || null} />}
      {modal?.mode === "alta" && <AltaModal baja={modal.baja} allBajas={bajas} onClose={() => setModal(null)} onSave={(altaData) => handleAlta(modal.baja.id, altaData)} />}
      {modal?.mode === "ver" && <VerModal baja={modal.baja} onClose={() => setModal(null)} onAlta={() => setModal({ mode: "alta", baja: modal.baja })} />}
    </div>
  );
}

/* ─── Nueva Baja Modal ─── */
function NuevaBajaModal({ onClose, onSave, preSelected }) {
  const [search, setSearch]     = React.useState("");
  const [selected, setSelected] = React.useState(() => preSelected || null);
  const [fecha, setFecha]       = React.useState(new Date().toISOString().slice(0,10));
  const [motivo, setMotivo]     = React.useState("");
  const [obs, setObs]           = React.useState("");
  const [errors, setErrors]     = React.useState({});
  const [focus, setFocus]       = React.useState(null);

  const allRows = React.useMemo(getAllRows, []);
  const suggestions = search.trim().length >= 2
    ? allRows.filter(r => normStr(r.cli).includes(normStr(search)) || normStr(r.pol).includes(normStr(search))).slice(0,5)
    : [];

  const validate = () => {
    const e = {};
    if (!selected) e.pol = "Seleccioná una póliza.";
    if (!fecha) e.fecha = "Ingresá la fecha de baja.";
    if (!motivo) e.motivo = "Seleccioná un motivo.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSave({ fecha, poliza: selected.pol, cliente: selected.cli, compania: selected.co, ramo: selected.ramo, pat: selected.pat, motivo, obs });
  };

  const inputBase = { flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14, color: "var(--ink-900)" };
  const IWrap = ({ fkey, children, err }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid " + (err ? "var(--bad-500)" : focus === fkey ? "var(--blue-500)" : "var(--line)"), boxShadow: focus === fkey ? "0 0 0 4px oklch(0.62 0.16 243/0.12)" : "none", borderRadius: 10, padding: "0 14px", height: 46, background: "var(--paper)", transition: "all .15s" }}>{children}</div>
  );
  const FRow = ({ label, err, children }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 7 }}>{label} <span style={{ color: "var(--bad-700)" }}>*</span></div>
      {children}
      {err && <div style={{ fontSize: 12, color: "var(--bad-700)", marginTop: 4 }}>{err}</div>}
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "oklch(0.18 0.06 252/0.50)", backdropFilter: "blur(5px)", zIndex: 50, display: "grid", placeItems: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 520, background: "var(--paper)", borderRadius: 16, boxShadow: "var(--shadow-lg)", overflow: "hidden", maxHeight: "calc(100vh - 48px)", display: "flex", flexDirection: "column" }}>

        <div style={{ padding: "20px 24px", background: "linear-gradient(160deg, oklch(0.42 0.10 28), oklch(0.30 0.10 25))", color: "white", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.65, marginBottom: 5 }}>Registrar baja</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Nueva baja de póliza</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid oklch(1 0 0/0.15)", background: "oklch(1 0 0/0.08)", color: "oklch(0.85 0.04 240)", cursor: "pointer", display: "grid", placeItems: "center" }}><IconClose size={15} /></button>
        </div>

        <div style={{ padding: "22px 24px", overflowY: "auto", flex: 1 }}>
          {/* Buscar póliza */}
          <FRow label="Póliza a dar de baja" err={errors.pol}>
            <div style={{ position: "relative" }}>
              <IWrap fkey="search" err={errors.pol}>
                <IconSearch size={15} style={{ color: "var(--ink-400)" }} />
                <input style={inputBase} placeholder="Buscar cliente o N° de póliza…"
                  value={selected ? `${selected.cli} — ${selected.pol}` : search}
                  onChange={e => { setSearch(e.target.value); setSelected(null); setErrors(p => ({...p, pol:""})); }}
                  onFocus={() => setFocus("search")} onBlur={() => setTimeout(() => setFocus(null), 150)} />
                {selected && <button onClick={() => { setSelected(null); setSearch(""); }} style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--ink-400)", display: "grid", placeItems: "center" }}><IconClose size={14} /></button>}
              </IWrap>
              {suggestions.length > 0 && !selected && (
                <div style={{ position: "absolute", top: "calc(100%+4px)", left: 0, right: 0, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "var(--shadow-lg)", zIndex: 20, padding: 4, marginTop: 4 }}>
                  {suggestions.map(r => (
                    <div key={r.pol} onClick={() => { setSelected(r); setSearch(""); setErrors(p => ({...p, pol:""})); }}
                      style={{ padding: "9px 12px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--blue-50)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 13.5 }}>{r.cli}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{r.pol} · {r.co} · {r.ramo}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: r.est === "vigente" ? "var(--ok-100)" : "var(--bad-100)", color: r.est === "vigente" ? "var(--ok-700)" : "var(--bad-700)", fontWeight: 600 }}>{r.est}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selected && (
              <div style={{ marginTop: 8, padding: "10px 14px", background: "oklch(0.97 0.015 245)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 13, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                <div><span style={{ color: "var(--ink-500)" }}>Compañía: </span><strong>{selected.co}</strong></div>
                <div><span style={{ color: "var(--ink-500)" }}>Ramo: </span><strong>{selected.ramo}</strong></div>
                <div><span style={{ color: "var(--ink-500)" }}>Patente: </span><strong className="mono">{selected.pat}</strong></div>
                <div><span style={{ color: "var(--ink-500)" }}>Estado: </span><strong style={{ color: selected.est === "vigente" ? "var(--ok-700)" : "var(--bad-700)" }}>{selected.est}</strong></div>
              </div>
            )}
          </FRow>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FRow label="Fecha de baja" err={errors.fecha}>
              <IWrap fkey="fecha" err={errors.fecha}>
                <IconCal size={15} style={{ color: "var(--ink-400)" }} />
                <input type="date" style={inputBase} value={fecha}
                  onChange={e => { setFecha(e.target.value); setErrors(p => ({...p, fecha:""})); }}
                  onFocus={() => setFocus("fecha")} onBlur={() => setFocus(null)} />
              </IWrap>
            </FRow>
            <FRow label="Motivo" err={errors.motivo}>
              <IWrap fkey="motivo" err={errors.motivo}>
                <select style={{ ...inputBase, cursor: "pointer" }} value={motivo}
                  onChange={e => { setMotivo(e.target.value); setErrors(p => ({...p, motivo:""})); }}
                  onFocus={() => setFocus("motivo")} onBlur={() => setFocus(null)}>
                  <option value="">Seleccionar…</option>
                  {MOTIVOS_BAJA.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </IWrap>
            </FRow>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 7 }}>Observaciones <span style={{ color: "var(--ink-400)", fontWeight: 400 }}>(opcional)</span></div>
            <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Detalle adicional sobre la baja…"
              style={{ width: "100%", minHeight: 80, padding: "10px 14px", border: "1.5px solid var(--line)", borderRadius: 10, background: "var(--paper)", fontSize: 13.5, color: "var(--ink-900)", resize: "vertical", outline: 0, boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>Cancelar</button>
          <button onClick={submit} style={{ height: 38, padding: "0 18px", borderRadius: 9, border: 0, background: "var(--bad-600)", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon size={14} d={<><path d="M12 5v14M5 12h14"/></>} /> Registrar baja
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Dar de Alta Modal ─── */
function AltaModal({ baja, allBajas, onClose, onSave }) {
  const [compania, setCompania]   = React.useState("");
  const [cobertura, setCobertura] = React.useState("");
  const [precio, setPrecio]       = React.useState("");
  const [fecha, setFecha]         = React.useState(new Date().toISOString().slice(0,10));
  const [focus, setFocus]         = React.useState(null);
  const [errors, setErrors]       = React.useState({});

  // Check if client has another vigente policy
  const allRows = React.useMemo(getAllRows, []);
  const tieneVigente = allRows.some(r => normStr(r.cli) === normStr(baja.cliente) && r.est === "vigente" && r.pol !== baja.poliza);

  const validate = () => {
    const e = {};
    if (!compania) e.compania = "Seleccioná la compañía.";
    if (!cobertura) e.cobertura = "Ingresá la cobertura.";
    if (!precio || isNaN(Number(precio))) e.precio = "Ingresá un precio válido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSave({ altaFecha: fecha, altaCompania: compania, altaCobertura: cobertura, altaPrecio: precio });
  };

  const inputBase = { flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14, color: "var(--ink-900)" };
  const IWrap = ({ fkey, children, err }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid " + (err ? "var(--bad-500)" : focus === fkey ? "var(--blue-500)" : "var(--line)"), boxShadow: focus === fkey ? "0 0 0 4px oklch(0.62 0.16 243/0.12)" : "none", borderRadius: 10, padding: "0 14px", height: 46, background: "var(--paper)", transition: "all .15s" }}>{children}</div>
  );
  const FRow = ({ label, err, children }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 7 }}>{label} <span style={{ color: "var(--bad-700)" }}>*</span></div>
      {children}
      {err && <div style={{ fontSize: 12, color: "var(--bad-700)", marginTop: 4 }}>{err}</div>}
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "oklch(0.18 0.06 252/0.50)", backdropFilter: "blur(5px)", zIndex: 50, display: "grid", placeItems: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 500, background: "var(--paper)", borderRadius: 16, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>

        <div style={{ padding: "20px 24px", background: "linear-gradient(160deg, var(--navy-950), var(--navy-800))", color: "white", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.65, marginBottom: 5 }}>Reactivación</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Dar de alta · {baja.cliente}</div>
            <div style={{ fontSize: 12.5, color: "oklch(0.78 0.04 240)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{baja.poliza}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid oklch(1 0 0/0.15)", background: "oklch(1 0 0/0.08)", color: "oklch(0.85 0.04 240)", cursor: "pointer", display: "grid", placeItems: "center" }}><IconClose size={15} /></button>
        </div>

        <div style={{ padding: "22px 24px" }}>
          {tieneVigente ? (
            <div style={{ padding: "16px", background: "var(--bad-100)", border: "1px solid oklch(0.85 0.08 28)", borderRadius: 12, marginBottom: 18, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Icon size={18} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4m0 4v.01"/></>} style={{ color: "var(--bad-600)", flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 600, color: "var(--bad-700)", fontSize: 13.5 }}>El cliente ya tiene una póliza vigente</div>
                <div style={{ fontSize: 13, color: "var(--bad-700)", marginTop: 4, opacity: 0.85 }}>
                  Para dar de alta esta póliza, primero debe darse de baja la póliza vigente de <strong>{baja.cliente}</strong>.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "12px 14px", background: "var(--ok-100)", border: "1px solid oklch(0.88 0.06 155)", borderRadius: 10, marginBottom: 18, display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "var(--ok-700)" }}>
              <Icon size={15} d={<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>} />
              <span>El cliente no tiene pólizas vigentes. Podés proceder con el alta.</span>
            </div>
          )}

          <FRow label="Nueva compañía" err={errors.compania}>
            <IWrap fkey="co" err={errors.compania}>
              <select style={{ ...inputBase, cursor: "pointer" }} value={compania}
                disabled={tieneVigente}
                onChange={e => { setCompania(e.target.value); setErrors(p => ({...p, compania:""})); }}
                onFocus={() => setFocus("co")} onBlur={() => setFocus(null)}>
                <option value="">Seleccionar compañía…</option>
                {COMPANIES_B.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </IWrap>
          </FRow>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FRow label="Cobertura" err={errors.cobertura}>
              <IWrap fkey="cob" err={errors.cobertura}>
                <select style={{ ...inputBase, cursor: "pointer" }} value={cobertura}
                  disabled={tieneVigente}
                  onChange={e => { setCobertura(e.target.value); setErrors(p => ({...p, cobertura:""})); }}
                  onFocus={() => setFocus("cob")} onBlur={() => setFocus(null)}>
                  <option value="">Seleccionar…</option>
                  {COBERTURAS_B.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </IWrap>
            </FRow>
            <FRow label="Precio ($/cuota)" err={errors.precio}>
              <IWrap fkey="precio" err={errors.precio}>
                <span style={{ color: "var(--ink-400)", fontSize: 14 }}>$</span>
                <input type="number" style={inputBase} placeholder="45000"
                  disabled={tieneVigente}
                  value={precio}
                  onChange={e => { setPrecio(e.target.value); setErrors(p => ({...p, precio:""})); }}
                  onFocus={() => setFocus("precio")} onBlur={() => setFocus(null)} />
              </IWrap>
            </FRow>
          </div>

          <FRow label="Fecha de alta" err={errors.fecha}>
            <IWrap fkey="falta">
              <IconCal size={15} style={{ color: "var(--ink-400)" }} />
              <input type="date" style={inputBase} value={fecha} disabled={tieneVigente}
                onChange={e => setFecha(e.target.value)}
                onFocus={() => setFocus("falta")} onBlur={() => setFocus(null)} />
            </IWrap>
          </FRow>
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>Cancelar</button>
          {!tieneVigente && (
            <button onClick={submit} style={{ height: 38, padding: "0 18px", borderRadius: 9, border: 0, background: "linear-gradient(180deg, var(--ok-500), var(--ok-700))", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <IconCheck size={14} sw={2.5} /> Confirmar alta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Ver Detalle Modal ─── */
function VerModal({ baja, onClose, onAlta }) {
  const Row = ({ l, v, mono }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--line-2)" }}>
      <div style={{ fontSize: 12, color: "var(--ink-500)", width: 120, flexShrink: 0 }}>{l}</div>
      <div style={{ flex: 1, fontWeight: 500, fontSize: mono ? 12.5 : 13.5, fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit", color: "var(--ink-900)" }}>{v || "—"}</div>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "oklch(0.18 0.06 252/0.50)", backdropFilter: "blur(5px)", zIndex: 50, display: "grid", placeItems: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 540, background: "var(--paper)", borderRadius: 16, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>

        <div style={{ padding: "20px 24px", background: "linear-gradient(160deg, oklch(0.42 0.10 28), oklch(0.30 0.10 25))", color: "white", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.65, marginBottom: 5 }}>Detalle de baja</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{baja.cliente}</div>
            <div style={{ fontSize: 12.5, color: "oklch(0.85 0.04 240)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>{baja.poliza}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid oklch(1 0 0/0.15)", background: "oklch(1 0 0/0.08)", color: "oklch(0.85 0.04 240)", cursor: "pointer", display: "grid", placeItems: "center" }}><IconClose size={15} /></button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bad-600)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Datos de la baja</div>
          <Row l="Compañía"      v={baja.compania} />
          <Row l="Ramo"          v={baja.ramo} />
          <Row l="Fecha de baja" v={baja.fecha.split("-").reverse().join("/")} mono />
          <Row l="Motivo"        v={baja.motivo} />
          {baja.obs && <Row l="Observaciones" v={baja.obs} />}

          {baja.estado === "alta" && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ok-700)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "18px 0 10px" }}>Datos del alta</div>
              <Row l="Fecha alta"   v={baja.altaFecha?.split("-").reverse().join("/")} mono />
              <Row l="Compañía"     v={baja.altaCompania} />
              <Row l="Cobertura"    v={baja.altaCobertura} />
              <Row l="Precio/cuota" v={baja.altaPrecio ? "$ " + Number(baja.altaPrecio).toLocaleString("es-AR") : null} mono />
            </>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>Cerrar</button>
          {baja.estado === "baja" && (
            <button onClick={() => { onClose(); onAlta(); }} style={{ height: 38, padding: "0 18px", borderRadius: 9, border: 0, background: "linear-gradient(180deg, var(--ok-500), var(--ok-700))", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <IconCheck size={14} sw={2.5} /> Dar de alta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

window.Bajas = Bajas;
