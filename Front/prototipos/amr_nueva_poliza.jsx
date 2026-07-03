// AMR — Nueva póliza wizard
// 3 pasos: Cliente · Vehículo · Detalles de póliza
// Vista hi-fi con stepper a la izquierda y resumen a la derecha.

const COMPANIES_NP = getCompanias();


const RAMOS = [
{ k: "Automotor", icon: <IconCar size={16} /> },
{ k: "Hogar", icon: <Icon size={16} d={<><path d="M3 11 12 4l9 7" /><path d="M5 10v9h14v-9" /></>} /> },
{ k: "Vida", icon: <Icon size={16} d="M20.84 4.6a5 5 0 0 0-7.08 0L12 6.34l-1.76-1.74a5 5 0 0 0-7.08 7.08l1.76 1.76L12 21l7.08-7.56 1.76-1.76a5 5 0 0 0 0-7.08Z" /> },
{ k: "Comercio", icon: <Icon size={16} d={<><path d="M3 9h18l-1 11H4L3 9Z" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></>} /> },
{ k: "Motovehículo", icon: <Icon size={16} d={<><circle cx="5.5" cy="16.5" r="3" /><circle cx="18.5" cy="16.5" r="3" /><path d="M5.5 16.5h7l3-5h4l-2-4h-3" /><path d="M14 6h3" /></>} /> },
{ k: "ART", icon: <IconShield size={16} /> },
{ k: "Caución", icon: <Icon size={16} d={<><path d="M12 2 4 5v6c0 5 3 8 8 9 5-1 8-4 8-9V5l-8-3Z" /><path d="m9 12 2 2 4-4" /></>} /> }];


const COBERTURAS = {
  Automotor: ["Responsabilidad Civil", "Terceros Completo", "Terceros Completo Premium", "Todo Riesgo c/Franquicia", "Todo Riesgo s/Franquicia"],
  Hogar: ["Básica", "Intermedia", "Premium", "Plus Contenido"],
  Vida: ["Vida Individual", "Vida con Ahorro", "Cobertura Total"],
  Comercio: ["Integral Comercio", "Premium Comercio"],
  Motovehículo: ["Responsabilidad Civil", "Terceros Completo", "Todo Riesgo"],
  ART: ["Cobertura Estándar", "Cobertura Plus"],
  Caución: ["Garantía de Obra", "Garantía Aduanera"]
};

const PROVINCIAS = ["Buenos Aires", "CABA", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Salta", "Entre Ríos", "Otra"];

const COMBUSTION_OPTS = [
  { k: "Nafta",     color: "oklch(0.62 0.15 50)"  },
  { k: "Diesel",    color: "oklch(0.55 0.13 78)"  },
  { k: "GNC",       color: "oklch(0.55 0.14 250)" },
  { k: "Híbrido",   color: "oklch(0.56 0.14 155)" },
  { k: "Eléctrico", color: "oklch(0.58 0.15 220)" },
];

const npStyles = {
  page: { background: "var(--canvas)", minHeight: "100vh" },

  hero: {
    maxWidth: 1280, margin: "0 auto",
    padding: "32px 28px 12px",
    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24
  },
  crumb: { fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 },
  crumbA: { color: "var(--ink-500)", textDecoration: "none", cursor: "pointer" },
  h1: { margin: 0, fontSize: 28, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" },
  sub: { margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14 },

  headBtns: { display: "flex", gap: 10 },
  ghostBtn: {
    height: 38, padding: "0 14px",
    borderRadius: 9,
    background: "transparent",
    border: "1px solid var(--line)",
    color: "var(--ink-700)",
    fontSize: 13.5, fontWeight: 500, cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 7
  },

  shell: {
    maxWidth: 1280, margin: "16px auto 60px",
    padding: "0 28px",
    display: "grid",
    gridTemplateColumns: "240px minmax(0, 1fr) 320px",
    gap: 24,
    alignItems: "start"
  },

  // Stepper
  stepper: {
    position: "sticky", top: 88,
    background: "transparent",
    display: "flex", flexDirection: "column", gap: 4
  },
  stepperTitle: {
    fontSize: 11, fontWeight: 600,
    color: "var(--ink-500)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: 14
  },
  step: (state) => ({
    display: "flex", gap: 14, alignItems: "flex-start",
    padding: "12px 14px",
    borderRadius: 10,
    background: state === "active" ? "var(--paper)" : "transparent",
    border: state === "active" ? "1px solid var(--line)" : "1px solid transparent",
    boxShadow: state === "active" ? "var(--shadow-sm)" : "none",
    cursor: "pointer",
    transition: "background .15s",
    position: "relative"
  }),
  stepDot: (state) => ({
    width: 26, height: 26, borderRadius: "50%",
    flexShrink: 0,
    display: "grid", placeItems: "center",
    background: state === "done" ? "var(--ok-500)" : state === "active" ? "var(--navy-900)" : "var(--paper)",
    color: state === "pending" ? "var(--ink-500)" : "white",
    border: state === "pending" ? "1.5px solid var(--line)" : "0",
    fontSize: 12, fontWeight: 600
  }),
  stepLine: (done) => ({
    position: "absolute",
    left: 27, top: 38, bottom: -12,
    width: 1.5,
    background: done ? "var(--ok-500)" : "var(--line)"
  }),
  stepL: (active) => ({
    fontSize: 14, fontWeight: 600,
    color: active ? "var(--ink-900)" : "var(--ink-700)",
    lineHeight: 1.2
  }),
  stepSub: { fontSize: 12.5, color: "var(--ink-500)", marginTop: 3 },

  // Card
  card: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 16,
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden"
  },
  cardHead: {
    padding: "20px 26px 18px",
    borderBottom: "1px solid var(--line-2)"
  },
  cardKicker: {
    fontSize: 11.5, fontWeight: 600,
    color: "var(--blue-600)",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    marginBottom: 6
  },
  cardTitle: { margin: 0, fontSize: 20, letterSpacing: "-0.02em", fontWeight: 600, color: "var(--ink-900)" },
  cardSub: { margin: "4px 0 0", color: "var(--ink-500)", fontSize: 13.5 },

  cardBody: { padding: "22px 26px 26px" },

  grid: (cols) => ({
    display: "grid",
    gridTemplateColumns: cols,
    gap: 16
  }),

  field: { display: "flex", flexDirection: "column", gap: 7 },
  label: {
    fontSize: 12.5, fontWeight: 500,
    color: "var(--ink-700)",
    display: "flex", alignItems: "center", justifyContent: "space-between"
  },
  required: { color: "var(--bad-700)", marginLeft: 3 },
  hint: { fontSize: 11.5, color: "var(--ink-400)", fontWeight: 400 },
  inputWrap: (focused) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "0 12px",
    height: 42,
    background: "var(--paper)",
    borderRadius: 9,
    border: "1.5px solid " + (focused ? "var(--blue-500)" : "var(--line)"),
    boxShadow: focused ? "0 0 0 4px oklch(0.62 0.16 243 / 0.10)" : "none",
    transition: "all .15s"
  }),
  input: {
    flex: 1, border: 0, outline: 0, background: "transparent",
    fontSize: 14, color: "var(--ink-900)", height: "100%"
  },
  inputAdorn: { fontSize: 12, color: "var(--ink-400)", fontWeight: 500 },

  // Segmented control
  segWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 8
  },
  segItem: (active) => ({
    display: "flex", alignItems: "center", gap: 9,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1.5px solid " + (active ? "var(--navy-900)" : "var(--line)"),
    background: active ? "var(--blue-100)" : "var(--paper)",
    color: active ? "var(--navy-900)" : "var(--ink-700)",
    cursor: "pointer",
    fontSize: 13.5, fontWeight: 500,
    transition: "all .12s"
  }),

  // Card footer (actions)
  cardFoot: {
    padding: "16px 26px",
    borderTop: "1px solid var(--line-2)",
    background: "oklch(0.985 0.008 245)",
    display: "flex", alignItems: "center", justifyContent: "space-between"
  },
  footHint: { fontSize: 12.5, color: "var(--ink-500)" },
  primaryBtn: {
    height: 44, padding: "0 20px",
    borderRadius: 10,
    background: "var(--navy-900)",
    color: "white", border: 0, cursor: "pointer",
    fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em",
    display: "inline-flex", alignItems: "center", gap: 9
  },
  greenBtn: {
    height: 44, padding: "0 22px",
    borderRadius: 10,
    background: "linear-gradient(180deg, var(--blue-600), var(--navy-800))",
    color: "white", border: 0, cursor: "pointer",
    fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em",
    display: "inline-flex", alignItems: "center", gap: 9,
    boxShadow: "0 8px 24px -8px oklch(0.30 0.10 250 / 0.5)"
  },

  // Summary panel
  summary: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 16,
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
    position: "sticky", top: 88
  },
  summaryHead: {
    padding: "16px 18px",
    background: "linear-gradient(180deg, var(--navy-950), var(--navy-800))",
    color: "white"
  },
  summaryTitle: { fontSize: 12, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.8 },
  summaryAmt: { fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4 },
  summaryAmtSub: { fontSize: 12, color: "oklch(0.85 0.04 240)", marginTop: 2 },

  summaryBody: { padding: "14px 18px" },
  summaryRow: {
    display: "flex", justifyContent: "space-between", gap: 12,
    padding: "10px 0",
    borderBottom: "1px dashed var(--line)",
    fontSize: 13
  },
  summaryLast: { borderBottom: 0 },
  summaryK: { color: "var(--ink-500)" },
  summaryV: { color: "var(--ink-900)", fontWeight: 500, textAlign: "right", maxWidth: "60%", overflowWrap: "anywhere" },
  summaryEmpty: { color: "var(--ink-400)", fontStyle: "italic" },

  // Confirm modal
  modalBack: {
    position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.45)",
    backdropFilter: "blur(4px)",
    zIndex: 50, display: "grid", placeItems: "center",
    animation: "fadeIn .15s ease"
  },
  modal: {
    width: 440, background: "var(--paper)",
    borderRadius: 16, padding: 28,
    textAlign: "center",
    boxShadow: "var(--shadow-lg)"
  },
  modalIcon: {
    width: 64, height: 64, borderRadius: "50%",
    background: "var(--ok-100)", color: "var(--ok-700)",
    margin: "0 auto 16px", display: "grid", placeItems: "center"
  }
};

function NuevaPoliza({ onNavigate, onLogout, onSubmit, initialData }) {
  const [step, setStep] = React.useState(0);
  const [saved, setSaved] = React.useState(false);
  const [focus, setFocus] = React.useState(null);
  const [polNum, setPolNum] = React.useState("");

  const buildForm = (d) => {
    const base = {
      idType: "DNI", idNumber: "", nombre: "", apellido: "", nac: "",
      telefono: "", email: "",
      calle: "", numero: "", piso: "", localidad: "", provincia: "", cp: "",
      patente: "", marca: "", modelo: "", anio: "", chasis: "", motor: "", combustion: [],
      compania: "", ramo: "Automotor", cobertura: "", vencimiento: "", cuota: "",
      periodoPoliza: "12 meses (anual)", periodoCuotas: "Mensual"
    };
    if (!d) return base;
    const { row, detail, coName } = d;
    const parts = (row.cli || "").trim().split(" ");
    const apellido = parts.length > 1 ? parts[parts.length - 1] : "";
    const nombre = parts.slice(0, parts.length > 1 ? parts.length - 1 : 1).join(" ");
    const combustion = detail?.combustion && detail.combustion !== "—"
      ? detail.combustion.split(" / ").map(s => s.trim()).filter(Boolean)
      : [];
    return {
      ...base,
      nombre, apellido,
      idNumber: detail?.dni || "",
      telefono: detail?.telefono || "",
      email: detail?.email || "",
      calle: detail?.domicilio || "",
      patente: row.pat !== "—" ? (row.pat || "") : "",
      marca: detail?.marca !== "—" ? (detail?.marca || "") : "",
      modelo: detail?.modelo !== "—" ? (detail?.modelo || "") : "",
      anio: detail?.anio !== "—" ? (detail?.anio || "") : "",
      chasis: detail?.chasis !== "—" ? (detail?.chasis || "") : "",
      motor: detail?.motor !== "—" ? (detail?.motor || "") : "",
      combustion,
      compania: coName || "",
      ramo: row.ramo || "Automotor",
    };
  };

  const [form, setForm] = React.useState(() => buildForm(initialData));
  const set = (k) => (v) =>
  setForm((p) => ({ ...p, [k]: typeof v === "object" && !Array.isArray(v) ? v.target.value : v }));

  const steps = [
  { k: "cliente", l: "Datos del cliente", s: "DNI/CUIL, datos personales y domicilio" },
  { k: "vehiculo", l: "Datos del vehículo", s: "Patente, marca, modelo y motor" },
  { k: "poliza", l: "Detalles de póliza", s: "Compañía, ramo, cobertura y prima" }];


  const next = () => setStep((s) => Math.min(s + 1, 2));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const guardar = () => {
    const num = "E/T-" + Math.floor(100000 + Math.random() * 899999);
    setPolNum(num);
    const coIdx = COMPANIES_NP.findIndex(c => c.n === form.compania);
    const domFull = [form.calle, form.numero, form.piso, form.localidad].filter(Boolean).join(", ");
    let venFmt = "—";
    if (form.vencimiento) {
      try { venFmt = new Date(form.vencimiento + "T12:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }); } catch(e) {}
    }
    const newPol = {
      co: coIdx >= 0 ? coIdx : 0,
      pol: num,
      cli: [form.nombre, form.apellido].filter(Boolean).join(" ") || "—",
      pat: form.patente || "—",
      est: "vigente", ven: venFmt, ramo: form.ramo,
      dni: form.idNumber, telefono: form.telefono, email: form.email,
      domicilio: domFull || "—",
      marca: form.marca || "—", modelo: form.modelo || "—",
      anio: form.anio || "—", chasis: form.chasis || "—", motor: form.motor || "—",
      combustion: (form.combustion || []).join(" / ") || "—"
    };
    try {
      const stored = JSON.parse(localStorage.getItem("amr_polizas") || "[]");
      localStorage.setItem("amr_polizas", JSON.stringify([newPol, ...stored]));
    } catch(e) {}
    setSaved(true);
    setTimeout(() => { setSaved(false); onSubmit?.(); }, 1800);
  };

  return (
    <div style={npStyles.page}>
      <Navbar active="nueva" onNavigate={onNavigate} onLogout={onLogout} />

      <div style={npStyles.hero}>
        <div>
          <div style={npStyles.crumb}>
            <span style={npStyles.crumbA} onClick={() => onNavigate?.("dashboard")}>Inicio</span>
            {" · "}
            <span style={npStyles.crumbA} onClick={() => onNavigate?.("dashboard")}>Cartera</span>
            {" · Nueva póliza"}
          </div>
          <h1 style={npStyles.h1}>Nueva póliza</h1>
          <p style={npStyles.sub}>Completá los datos del cliente y el riesgo para emitir y archivar la póliza.</p>
        </div>
        <div style={npStyles.headBtns}>
          <button style={npStyles.ghostBtn} onClick={() => onNavigate?.("dashboard")}>
            <IconClose size={15} /> Cancelar
          </button>
          <button style={npStyles.ghostBtn}>Guardar borrador</button>
        </div>
      </div>

      <div style={npStyles.shell}>
        {/* STEPPER */}
        <aside style={npStyles.stepper}>
          <div style={npStyles.stepperTitle}>Progreso</div>
          {steps.map((s, i) => {
            const state = i === step ? "active" : i < step ? "done" : "pending";
            return (
              <div key={s.k} style={npStyles.step(state)} onClick={() => setStep(i)}>
                <div style={npStyles.stepDot(state)}>
                  {state === "done" ? <IconCheck size={13} /> : i + 1}
                </div>
                {i < 2 && <div style={npStyles.stepLine(state === "done")} />}
                <div style={{ paddingTop: 3 }}>
                  <div style={npStyles.stepL(state === "active")}>{s.l}</div>
                  <div style={npStyles.stepSub}>{s.s}</div>
                </div>
              </div>);

          })}
        </aside>

        {/* FORM CARD */}
        <main style={npStyles.card}>
          {step === 0 &&
          <ClienteStep form={form} set={set} focus={focus} setFocus={setFocus} />
          }
          {step === 1 &&
          <VehiculoStep form={form} set={set} focus={focus} setFocus={setFocus} />
          }
          {step === 2 &&
          <PolizaStep form={form} set={set} focus={focus} setFocus={setFocus} />
          }

          <div style={npStyles.cardFoot}>
            <div style={npStyles.footHint}>
              Paso {step + 1} de {steps.length} · Los campos con <span style={{ color: "var(--bad-700)" }}>*</span> son obligatorios
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {step > 0 &&
              <button style={npStyles.ghostBtn} onClick={back}>
                  <IconChevL size={15} /> Atrás
                </button>
              }
              {step < 2 ?
              <button style={npStyles.primaryBtn} onClick={next}>
                  Siguiente <IconChevR size={15} />
                </button> :

              <button style={npStyles.greenBtn} onClick={guardar}>
                  <IconCheck size={16} /> Guardar y archivar
                </button>
              }
            </div>
          </div>
        </main>

        {/* SUMMARY */}
        <SummaryPanel form={form} />
      </div>

      {saved &&
      <div style={npStyles.modalBack}>
          <div style={npStyles.modal}>
            <div style={npStyles.modalIcon}>
              <IconCheck size={28} sw={2.5} />
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, letterSpacing: "-0.02em" }}>Póliza guardada y archivada</h3>
            <p style={{ margin: 0, color: "var(--ink-500)", fontSize: 14 }}>
              Se generó el N° <span className="mono" style={{ color: "var(--ink-900)", fontWeight: 600 }}>
                {polNum}
              </span>.<br />
              La cartera se está actualizando…
            </p>
          </div>
        </div>
      }
    </div>);

}

/* ───────────────────────────── STEPS ───────────────────────────── */

function ClienteStep({ form, set, focus, setFocus }) {
  return (
    <>
      <div style={npStyles.cardHead}>
        <div style={npStyles.cardKicker}>Paso 1 · Cliente</div>
        <h2 style={npStyles.cardTitle}>Datos del tomador</h2>
        <p style={npStyles.cardSub}>Información de identidad y domicilio de la persona o razón social asegurada.</p>
      </div>
      <div style={npStyles.cardBody}>
        {/* Tipo de documento */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ ...npStyles.label, marginBottom: 8 }}>
            Tipo de documento <span style={npStyles.required}>*</span>
          </div>
          <div style={{ display: "inline-flex", border: "1.5px solid var(--line)", borderRadius: 10, padding: 3, gap: 2 }}>
            {["DNI", "CUIL", "CUIT", "Pasaporte"].map((t) =>
            <button key={t}
            onClick={() => set("idType")(t)}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: 0,
              background: form.idType === t ? "var(--navy-900)" : "transparent",
              color: form.idType === t ? "white" : "var(--ink-700)",
              fontSize: 13, fontWeight: 500, cursor: "pointer"
            }}>{t}</button>
            )}
          </div>
        </div>

        {/* DNI solo */}
        <Field label={form.idType} required hint="Sin puntos ni guiones">
          <InputBox focus={focus === "id"} onFocus={() => setFocus("id")} onBlur={() => setFocus(null)}>
            <input className="mono" style={npStyles.input}
            placeholder={form.idType === "CUIL" ? "20-12345678-9" : "27.345.123"}
            value={form.idNumber} onChange={set("idNumber")} />
          </InputBox>
        </Field>

        <div style={{ height: 16 }} />

        {/* Nombre + Apellido */}
        <div style={npStyles.grid("1fr 1fr")}>
          <Field label="Nombre" required>
            <InputBox focus={focus === "n"} onFocus={() => setFocus("n")} onBlur={() => setFocus(null)}>
              <input style={npStyles.input} placeholder="Juan Pedro"
              value={form.nombre} onChange={set("nombre")} />
            </InputBox>
          </Field>
          <Field label="Apellido" required>
            <InputBox focus={focus === "a"} onFocus={() => setFocus("a")} onBlur={() => setFocus(null)}>
              <input style={npStyles.input} placeholder="González"
              value={form.apellido} onChange={set("apellido")} />
            </InputBox>
          </Field>
        </div>

        <div style={{ height: 16 }} />

        {/* Fecha de nacimiento */}
        <Field label="Fecha de nacimiento" required>
          <InputBox focus={focus === "nac"} onFocus={() => setFocus("nac")} onBlur={() => setFocus(null)}>
            <IconCal size={16} style={{ color: "var(--ink-400)" }} />
            <input type="date" style={npStyles.input}
            value={form.nac} onChange={set("nac")} />
          </InputBox>
        </Field>

        <div style={{ height: 16 }} />

        {/* Domicilio */}
        <Field label="Domicilio" required hint="Calle y altura">
          <InputBox focus={focus === "dom"} onFocus={() => setFocus("dom")} onBlur={() => setFocus(null)}>
            <input style={npStyles.input} placeholder="Av. Corrientes"
            value={form.calle} onChange={set("calle")} />
          </InputBox>
        </Field>

        <div style={{ height: 12 }} />

        {/* Número + Piso */}
        <div style={npStyles.grid("1fr 1fr")}>
          <Field label="Número">
            <InputBox focus={focus === "num"} onFocus={() => setFocus("num")} onBlur={() => setFocus(null)}>
              <input className="mono" style={npStyles.input} placeholder="3450"
              value={form.numero} onChange={set("numero")} />
            </InputBox>
          </Field>
          <Field label="Piso / Dto.">
            <InputBox focus={focus === "piso"} onFocus={() => setFocus("piso")} onBlur={() => setFocus(null)}>
              <input style={npStyles.input} placeholder="5° B"
              value={form.piso} onChange={set("piso")} />
            </InputBox>
          </Field>
        </div>

        <div style={{ height: 12 }} />

        {/* Localidad + Provincia */}
        <div style={npStyles.grid("1fr 1fr")}>
          <Field label="Localidad">
            <InputBox focus={focus === "loc"} onFocus={() => setFocus("loc")} onBlur={() => setFocus(null)}>
              <input style={npStyles.input} placeholder="CABA"
              value={form.localidad} onChange={set("localidad")} />
            </InputBox>
          </Field>
          <Field label="Provincia">
            <SelectBox focus={focus === "prov"} onFocus={() => setFocus("prov")} onBlur={() => setFocus(null)}
            value={form.provincia} onChange={set("provincia")}
            placeholder="Seleccionar"
            options={PROVINCIAS} />
          </Field>
        </div>

        <div style={{ height: 16 }} />

        {/* Teléfono + Correo */}
        <div style={npStyles.grid("1fr 1.4fr")}>
          <Field label="Teléfono" required hint="Con código de área">
            <InputBox focus={focus === "tel"} onFocus={() => setFocus("tel")} onBlur={() => setFocus(null)}>
              <Icon size={16} d={<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7 2 2 0 0 1 1.72 2.03Z" /></>} style={{ color: "var(--ink-400)" }} />
              <input className="mono" style={npStyles.input} placeholder="+54 11 5555-1234"
              value={form.telefono} onChange={set("telefono")} />
            </InputBox>
          </Field>
          <Field label="Correo electrónico" required>
            <InputBox focus={focus === "email"} onFocus={() => setFocus("email")} onBlur={() => setFocus(null)}>
              <IconMail size={16} style={{ color: "var(--ink-400)" }} />
              <input type="email" style={npStyles.input} placeholder="nombre@correo.com"
              value={form.email} onChange={set("email")} />
            </InputBox>
          </Field>
        </div>
      </div>
    </>);

}

function VehiculoStep({ form, set, focus, setFocus }) {
  return (
    <>
      <div style={npStyles.cardHead}>
        <div style={npStyles.cardKicker}>Paso 2 · Vehículo</div>
        <h2 style={npStyles.cardTitle}>Datos del bien asegurado</h2>
        <p style={npStyles.cardSub}>Identificación del vehículo. Si la póliza no es vehicular, podés omitir esta sección.</p>
      </div>
      <div style={npStyles.cardBody}>
        <div style={npStyles.grid("1fr 1fr")}>
          <Field label="Patente" required hint="Formato AB123CD o ABC123">
            <InputBox focus={focus === "pat"} onFocus={() => setFocus("pat")} onBlur={() => setFocus(null)}>
              <input className="mono" style={{ ...npStyles.input, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}
              placeholder="AB 123 CD" maxLength={9}
              value={form.patente} onChange={(e) => set("patente")(e.target.value.toUpperCase())} />
            </InputBox>
          </Field>
          <Field label="Año" required>
            <InputBox focus={focus === "anio"} onFocus={() => setFocus("anio")} onBlur={() => setFocus(null)}>
              <input className="mono" style={npStyles.input} placeholder="2021" maxLength={4}
              value={form.anio} onChange={set("anio")} />
            </InputBox>
          </Field>
        </div>

        <div style={{ height: 16 }} />

        <div style={npStyles.grid("1fr 1.5fr")}>
          <Field label="Marca" required>
            <InputBox focus={focus === "marca"} onFocus={() => setFocus("marca")} onBlur={() => setFocus(null)}>
              <input style={npStyles.input} placeholder="Ej. Volkswagen"
              value={form.marca} onChange={set("marca")} />
            </InputBox>
          </Field>
          <Field label="Modelo" required>
            <InputBox focus={focus === "modelo"} onFocus={() => setFocus("modelo")} onBlur={() => setFocus(null)}>
              <input style={npStyles.input} placeholder="Ej. Gol Trend 1.6"
              value={form.modelo} onChange={set("modelo")} />
            </InputBox>
          </Field>
        </div>

        <div style={{ height: 16 }} />

        <div style={npStyles.grid("1fr 1fr")}>
          <Field label="N° de motor" required>
            <InputBox focus={focus === "motor"} onFocus={() => setFocus("motor")} onBlur={() => setFocus(null)}>
              <input className="mono" style={{ ...npStyles.input, textTransform: "uppercase" }}
              placeholder="CFZ-A12345"
              value={form.motor} onChange={(e) => set("motor")(e.target.value.toUpperCase())} />
            </InputBox>
          </Field>
          <Field label="N° de chasis" required hint="17 caracteres">
            <InputBox focus={focus === "chasis"} onFocus={() => setFocus("chasis")} onBlur={() => setFocus(null)}>
              <input className="mono" style={{ ...npStyles.input, textTransform: "uppercase" }}
              placeholder="9BWZZZ377VT004251" maxLength={17}
              value={form.chasis} onChange={(e) => set("chasis")(e.target.value.toUpperCase())} />
            </InputBox>
          </Field>
        </div>

        <div style={{ height: 16 }} />

        <Field label="Tipo de combustión" hint="Seleccioná hasta 2 opciones">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {COMBUSTION_OPTS.map(({ k, color }) => {
              const sel = (form.combustion || []).includes(k);
              const maxed = !sel && (form.combustion || []).length >= 2;
              return (
                <button key={k}
                  onClick={() => {
                    if (maxed) return;
                    const curr = form.combustion || [];
                    set("combustion")(sel ? curr.filter(c => c !== k) : [...curr, k]);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 16px", borderRadius: 10,
                    border: "1.5px solid " + (sel ? "var(--navy-900)" : maxed ? "var(--line-2)" : "var(--line)"),
                    background: sel ? "var(--blue-100)" : maxed ? "var(--canvas)" : "var(--paper)",
                    color: sel ? "var(--navy-900)" : maxed ? "var(--ink-400)" : "var(--ink-700)",
                    cursor: maxed ? "not-allowed" : "pointer",
                    fontSize: 13.5, fontWeight: 500,
                    opacity: maxed ? 0.55 : 1,
                    transition: "all .12s"
                  }}>
                  {sel
                    ? <IconCheck size={13} />
                    : <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  }
                  {k}
                </button>
              );
            })}
          </div>
          {(form.combustion || []).length === 2 && (
            <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 5 }}>
              Máx. 2 tipos seleccionados. Destildá uno para cambiar.
            </div>
          )}
        </Field>

        <div style={{
          marginTop: 16,
          padding: "14px 16px",
          background: "var(--blue-50)",
          border: "1px solid var(--blue-100)",
          borderRadius: 10,
          fontSize: 13,
          color: "var(--ink-700)",
          display: "flex", gap: 12, alignItems: "flex-start"
        }}>
          <div style={{ color: "var(--blue-600)", marginTop: 1 }}>
            <Icon size={16} d={<><circle cx="12" cy="12" r="9" /><path d="M12 8v5m0 3v.01" /></>} />
          </div>
          <div>
            <strong style={{ color: "var(--ink-900)" }}>Tip:</strong>{" "}
            ingresá la patente y el sistema autocompletará marca, modelo y año desde la base
            del Registro Automotor cuando esté disponible.
          </div>
        </div>
      </div>
    </>);

}

function PolizaStep({ form, set, focus, setFocus }) {
  const cobOpts = COBERTURAS[form.ramo] || [];
  return (
    <>
      <div style={npStyles.cardHead}>
        <div style={npStyles.cardKicker}>Paso 3 · Póliza</div>
        <h2 style={npStyles.cardTitle}>Detalles de la cobertura</h2>
        <p style={npStyles.cardSub}>Definí compañía, ramo, tipo de cobertura, vigencia y valor de la cuota.</p>
      </div>
      <div style={npStyles.cardBody}>
        <Field label="Compañía aseguradora" required>
          <SelectBox focus={focus === "co"} onFocus={() => setFocus("co")} onBlur={() => setFocus(null)}
          value={form.compania} onChange={set("compania")}
          placeholder="Seleccioná una compañía"
          options={COMPANIES_NP.map((c) => c.n)}
          renderOption={(name) => {
            const c = COMPANIES_NP.find((x) => x.n === name);
            return (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: c?.c || "var(--ink-400)" }} />
                  {name}
                </span>);

          }} />
          
        </Field>

        <div style={{ height: 18 }} />

        <Field label="Tipo de póliza (ramo)" required>
          <div style={npStyles.segWrap}>
            {RAMOS.map((r) =>
            <button key={r.k} onClick={() => {set("ramo")(r.k);set("cobertura")("");}}
            style={npStyles.segItem(form.ramo === r.k)}>
                <span style={{ color: form.ramo === r.k ? "var(--navy-900)" : "var(--blue-600)" }}>{r.icon}</span>
                {r.k}
              </button>
            )}
          </div>
        </Field>

        <div style={{ height: 18 }} />

        <div style={npStyles.grid("1fr 1fr")}>
          <Field label="Tipo de cobertura" required>
            <SelectBox focus={focus === "cob"} onFocus={() => setFocus("cob")} onBlur={() => setFocus(null)}
            value={form.cobertura} onChange={set("cobertura")}
            placeholder="Seleccionar cobertura"
            options={cobOpts} />
          </Field>
          <Field label="Período de póliza" required hint="Duración de la vigencia">
            <SelectBox focus={focus === "perPol"} onFocus={() => setFocus("perPol")} onBlur={() => setFocus(null)}
            value={form.periodoPoliza} onChange={set("periodoPoliza")}
            options={[
            "1 mes (mensual)",
            "2 meses (bimestral)",
            "3 meses (trimestral)",
            "4 meses (cuatrimestral)",
            "6 meses (semestral)",
            "9 meses",
            "12 meses (anual)"]
            } />
          </Field>
        </div>

        <div style={{ height: 16 }} />

        <div style={npStyles.grid("1fr 1fr")}>
          <Field label="Vencimiento" required>
            <InputBox focus={focus === "ven"} onFocus={() => setFocus("ven")} onBlur={() => setFocus(null)}>
              <IconCal size={16} style={{ color: "var(--ink-400)" }} />
              <input type="date" style={npStyles.input}
              value={form.vencimiento} onChange={set("vencimiento")} />
            </InputBox>
          </Field>
          <Field label="Período de cuotas" required hint="Frecuencia de pago">
            <div style={{ display: "flex", gap: 6, height: 42 }}>
              {["Mensual", "Bimestral", "Trimestral"].map((p) =>
              <button key={p}
              onClick={() => set("periodoCuotas")(p)}
              style={{
                flex: 1,
                borderRadius: 9,
                border: "1.5px solid " + (form.periodoCuotas === p ? "var(--navy-900)" : "var(--line)"),
                background: form.periodoCuotas === p ? "var(--blue-100)" : "var(--paper)",
                color: form.periodoCuotas === p ? "var(--navy-900)" : "var(--ink-700)",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6
              }}>
                  {form.periodoCuotas === p && <IconCheck size={13} />}
                  {p}
                </button>
              )}
            </div>
          </Field>
        </div>

        <div style={{ height: 16 }} />

        <div style={npStyles.grid("1fr 1fr")}>
          <Field label={"Valor de la cuota " + (form.periodoCuotas || "Mensual").toLowerCase()} required hint="En pesos argentinos">
            <InputBox focus={focus === "cuota"} onFocus={() => setFocus("cuota")} onBlur={() => setFocus(null)}>
              <span style={npStyles.inputAdorn}>ARS $</span>
              <input className="mono" style={npStyles.input} placeholder="38.500"
              value={form.cuota} onChange={set("cuota")} />
              <span style={npStyles.inputAdorn}>
                / {{ Mensual: "mes", Bimestral: "bimestre", Trimestral: "trimestre" }[form.periodoCuotas] || "mes"}
              </span>
            </InputBox>
          </Field>
          <Field label="Forma de pago">
            <SelectBox focus={focus === "pago"} onFocus={() => setFocus("pago")} onBlur={() => setFocus(null)}
            value={form.formaPago || "Débito automático"} onChange={set("formaPago")}
            options={["Débito automático", "Tarjeta de crédito", "CBU", "Efectivo"]} />
          </Field>
        </div>


      </div>
    </>);

}

/* ───────────────────────────── ATOMS ───────────────────────────── */

function Field({ label, required, hint, children }) {
  return (
    <div style={npStyles.field}>
      <div style={npStyles.label}>
        <span>{label}{required && <span style={npStyles.required}>*</span>}</span>
        {hint && <span style={npStyles.hint}>{hint}</span>}
      </div>
      {children}
    </div>);

}

function InputBox({ focus, onFocus, onBlur, children }) {
  return (
    <div style={npStyles.inputWrap(focus)} onFocus={onFocus} onBlur={onBlur}>
      {children}
    </div>);

}

function SelectBox({ focus, onFocus, onBlur, value, onChange, placeholder, options, renderOption }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={npStyles.inputWrap(focus || open)}
      onClick={() => setOpen((o) => !o)}
      onFocus={onFocus} onBlur={onBlur}
      tabIndex={0}>
        <div style={{ flex: 1, fontSize: 14, color: value ? "var(--ink-900)" : "var(--ink-400)" }}>
          {value ?
          renderOption ? renderOption(value) : value :
          placeholder || "Seleccionar"}
        </div>
        <IconChevD size={15} style={{ color: "var(--ink-400)", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </div>
      {open &&
      <div style={{
        position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
        background: "var(--paper)", border: "1px solid var(--line)",
        borderRadius: 10, boxShadow: "var(--shadow-lg)",
        padding: 4, zIndex: 20, maxHeight: 280, overflowY: "auto"
      }}>
          {options.map((o) =>
        <div key={o}
        onClick={() => {onChange(o);setOpen(false);}}
        style={{
          padding: "9px 12px", borderRadius: 7, cursor: "pointer",
          fontSize: 14, color: "var(--ink-900)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: value === o ? "var(--blue-100)" : "transparent"
        }}
        onMouseEnter={(e) => {if (value !== o) e.currentTarget.style.background = "var(--blue-50)";}}
        onMouseLeave={(e) => {if (value !== o) e.currentTarget.style.background = "transparent";}}>
              <span>{renderOption ? renderOption(o) : o}</span>
              {value === o && <IconCheck size={14} style={{ color: "var(--blue-600)" }} />}
            </div>
        )}
        </div>
      }
    </div>);

}

/* ───────────────────────────── SUMMARY ───────────────────────────── */

function SummaryPanel({ form }) {
  const fullName = [form.nombre, form.apellido].filter(Boolean).join(" ") || null;
  const dom = [form.calle, form.numero].filter(Boolean).join(" ");
  const vehicle = [form.marca, form.modelo].filter(Boolean).join(" ");
  const cuotaFmt = form.cuota ? "$ " + form.cuota : "—";

  return (
    <aside style={npStyles.summary}>
      <div style={npStyles.summaryHead}>
        <div style={npStyles.summaryTitle}>Resumen</div>
        <div style={npStyles.summaryAmt} className="mono">
          {cuotaFmt}
        </div>
        <div style={npStyles.summaryAmtSub}>
          {form.ramo}{form.cobertura ? " · " + form.cobertura : ""}
        </div>
      </div>
      <div style={npStyles.summaryBody}>
        <Row k="Tomador" v={fullName} />
        <Row k={form.idType} v={form.idNumber} mono />
        <Row k="Teléfono" v={form.telefono || null} mono />
        <Row k="Email" v={form.email || null} />
        <Row k="Domicilio" v={dom || null} />
        <Row k="Patente" v={form.patente || null} mono />
        <Row k="Vehículo" v={vehicle || null} />
        <Row k="Año" v={form.anio || null} mono />
        <Row k="Combustión" v={form.combustion && form.combustion.length > 0 ? form.combustion.join(" / ") : null} />
        <Row k="Compañía" v={form.compania || null} />
        <Row k="Vigencia" v={form.periodoPoliza || null} />
        <Row k="Cuotas" v={form.periodoCuotas || null} />
        <Row k="Vencimiento" v={form.vencimiento || null} mono last />
      </div>
    </aside>);

}

function Row({ k, v, mono, last }) {
  return (
    <div style={{ ...npStyles.summaryRow, ...(last ? npStyles.summaryLast : {}) }}>
      <span style={npStyles.summaryK}>{k}</span>
      <span style={{ ...npStyles.summaryV, ...(mono ? { fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 } : {}) }}>
        {v || <span style={npStyles.summaryEmpty}>—</span>}
      </span>
    </div>);

}

window.NuevaPoliza = NuevaPoliza;
window.npAtoms = {
  Field, InputBox, SelectBox, npStyles,
  COMPANIES_NP, COBERTURAS, RAMOS, PROVINCIAS, COMBUSTION_OPTS
};