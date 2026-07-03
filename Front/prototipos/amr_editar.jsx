// AMR — Editar (Asegurado / Vehículo / Cobertura)
// Flujo: pantalla de búsqueda (DNI / Patente / Póliza) → formulario pre-cargado → guardar.

const SAMPLE_REGISTRY = {
  asegurado: {
    "30.123.456": {
      idType: "DNI", idNumber: "30.123.456",
      nombre: "Martín", apellido: "Acosta",
      nac: "1985-04-12",
      telefono: "+54 11 5554-1234",
      email: "macosta@gmail.com",
      calle: "Av. Corrientes", numero: "3450", piso: "5° B",
      localidad: "CABA", provincia: "CABA",
    },
    "27.345.123": {
      idType: "DNI", idNumber: "27.345.123",
      nombre: "Lucía", apellido: "Fernández",
      nac: "1979-11-30",
      telefono: "+54 11 5566-2210",
      email: "lucia.fernandez@hotmail.com",
      calle: "Pasaje San Lorenzo", numero: "1142", piso: "",
      localidad: "Olivos", provincia: "Buenos Aires",
    },
  },
  vehiculo: {
    "AB421KS": {
      patente: "AB 421 KS", marca: "Volkswagen", modelo: "Gol Trend 1.6",
      anio: "2021", chasis: "9BWZZZ377VT004251", motor: "CFZ-A12345",
    },
    "PFG882": {
      patente: "PFG 882", marca: "Toyota", modelo: "Corolla XEi",
      anio: "2019", chasis: "JTDBR32E700112456", motor: "1ZR-FE-887721",
    },
    "AC991XT": {
      patente: "AC 991 XT", marca: "Ford", modelo: "Focus Titanium",
      anio: "2018", chasis: "9BFZF55N9JB104221", motor: "M8DA-3344-721",
    },
  },
  cobertura: {
    "AUT-2410-887143": {
      poliza: "AUT-2410-887143", titular: "Martín Acosta",
      compania: "NRE Cia Seguros", cobertura: "Terceros Completo Premium",
      vencimiento: "2026-10-12", cuota: "38500",
      periodoPoliza: "12 meses (anual)", periodoCuotas: "Mensual",
      formaPago: "Débito automático",
    },
    "HOG-2510-002411": {
      poliza: "HOG-2510-002411", titular: "Lucía Fernández",
      compania: "Libra", cobertura: "Hogar Premium",
      vencimiento: "2026-11-03", cuota: "78900",
      periodoPoliza: "12 meses (anual)", periodoCuotas: "Trimestral",
      formaPago: "CBU",
    },
    "AUT-2509-114902": {
      poliza: "AUT-2509-114902", titular: "Ricardo Pérez",
      compania: "La Perseverancia Seguros", cobertura: "Todo Riesgo c/Franquicia",
      vencimiento: "2026-06-02", cuota: "52400",
      periodoPoliza: "6 meses (semestral)", periodoCuotas: "Mensual",
      formaPago: "Tarjeta de crédito",
    },
  },
};

const editStyles = {
  page: { background: "var(--canvas)", minHeight: "100vh" },
  hero: {
    maxWidth: 980, margin: "0 auto",
    padding: "32px 28px 16px",
  },
  crumb: { fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 },
  crumbA: { color: "var(--ink-500)", textDecoration: "none", cursor: "pointer" },
  h1: { margin: 0, fontSize: 28, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" },
  sub: { margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14 },

  // Lookup card
  lookup: {
    maxWidth: 720, margin: "12px auto 60px",
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 16,
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
  },
  lookupHead: {
    padding: "26px 28px 18px",
    borderBottom: "1px solid var(--line-2)",
  },
  lookupKicker: {
    fontSize: 11.5, fontWeight: 600,
    color: "var(--blue-600)",
    textTransform: "uppercase", letterSpacing: "0.14em",
    marginBottom: 6,
  },
  lookupTitle: { margin: 0, fontSize: 20, letterSpacing: "-0.02em", fontWeight: 600 },
  lookupSub: { margin: "4px 0 0", color: "var(--ink-500)", fontSize: 14 },

  lookupBody: { padding: "24px 28px" },
  lookupSearchWrap: (focused) => ({
    display: "flex", alignItems: "center", gap: 12,
    padding: "0 18px",
    height: 60,
    background: "var(--paper)",
    border: "1.5px solid " + (focused ? "var(--blue-500)" : "var(--line)"),
    boxShadow: focused ? "0 0 0 4px oklch(0.62 0.16 243 / 0.12)" : "none",
    borderRadius: 12,
  }),
  lookupSearchInput: {
    flex: 1, border: 0, outline: 0, background: "transparent",
    fontSize: 18, fontWeight: 500, color: "var(--ink-900)",
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.04em",
    height: "100%",
  },
  lookupBtn: {
    height: 44, padding: "0 18px",
    borderRadius: 10,
    background: "var(--navy-900)", color: "white",
    border: 0, cursor: "pointer",
    fontSize: 14, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 8,
  },

  suggestionsLabel: { fontSize: 11.5, fontWeight: 600, color: "var(--ink-500)",
                      textTransform: "uppercase", letterSpacing: "0.10em", marginTop: 22, marginBottom: 10 },
  suggestions: { display: "flex", gap: 8, flexWrap: "wrap" },
  suggChip: {
    padding: "8px 12px", borderRadius: 8,
    background: "var(--blue-50)", color: "var(--navy-900)",
    border: "1px solid var(--blue-100)",
    fontSize: 12.5, fontWeight: 500,
    fontFamily: "'JetBrains Mono', monospace",
    cursor: "pointer",
  },

  notFound: {
    marginTop: 18, padding: "12px 14px",
    borderRadius: 10,
    background: "var(--bad-100)", color: "var(--bad-700)",
    fontSize: 13, display: "flex", gap: 10,
  },

  // Form card (similar to nueva poliza)
  shell: {
    maxWidth: 1080, margin: "12px auto 60px",
    padding: "0 28px",
    display: "grid", gridTemplateColumns: "1fr 320px", gap: 22,
    alignItems: "start",
  },
  card: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 16,
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
  },
  ctxPanel: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 16,
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
    position: "sticky", top: 88,
  },
  ctxHead: {
    padding: "16px 18px",
    background: "linear-gradient(180deg, var(--navy-950), var(--navy-800))",
    color: "white",
  },
  ctxKicker: { fontSize: 11, fontWeight: 600, letterSpacing: "0.10em",
               textTransform: "uppercase", opacity: 0.75 },
  ctxName: { fontSize: 17, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 4 },
  ctxId: { fontSize: 12, color: "oklch(0.85 0.04 240)", marginTop: 4,
           fontFamily: "'JetBrains Mono', monospace" },
  ctxBody: { padding: "14px 18px" },
  ctxRow: { display: "flex", justifyContent: "space-between", padding: "8px 0",
            borderBottom: "1px dashed var(--line)", fontSize: 13 },
  ctxK: { color: "var(--ink-500)" },
  ctxV: { color: "var(--ink-900)", fontWeight: 500, textAlign: "right" },

  savedModalBack: {
    position: "fixed", inset: 0,
    background: "oklch(0.18 0.06 252 / 0.45)", backdropFilter: "blur(4px)",
    display: "grid", placeItems: "center", zIndex: 50,
  },
  savedModal: {
    background: "var(--paper)", borderRadius: 16, padding: 28,
    textAlign: "center", width: 420,
    boxShadow: "var(--shadow-lg)",
  },
};

function Editar({ mode, onNavigate, onLogout }) {
  const config = {
    asegurado: {
      title: "Editar asegurado",
      sub:   "Modificá los datos personales y de domicilio del tomador.",
      lookupKicker: "Paso 1",
      lookupTitle: "Buscar asegurado",
      lookupSub: "Ingresá el DNI o CUIL del cliente para cargar sus datos.",
      label: "DNI / CUIL",
      placeholder: "27.345.123",
      hint: "Sin puntos: 27345123 también funciona",
      suggestions: Object.keys(SAMPLE_REGISTRY.asegurado),
      lookup: (key) => {
        const norm = key.replace(/[.\-\s]/g, "");
        for (const k of Object.keys(SAMPLE_REGISTRY.asegurado)) {
          if (k.replace(/[.\-\s]/g, "") === norm) return SAMPLE_REGISTRY.asegurado[k];
        }
        return null;
      },
    },
    vehiculo: {
      title: "Editar vehículo",
      sub:   "Modificá los datos del bien asegurado.",
      lookupKicker: "Paso 1",
      lookupTitle: "Buscar vehículo",
      lookupSub: "Ingresá la patente del vehículo a editar.",
      label: "Patente",
      placeholder: "AB 421 KS",
      hint: "Formato AB123CD o ABC123",
      suggestions: Object.keys(SAMPLE_REGISTRY.vehiculo),
      lookup: (key) => {
        const norm = key.replace(/\s/g, "").toUpperCase();
        return SAMPLE_REGISTRY.vehiculo[norm] || null;
      },
    },
    cobertura: {
      title: "Editar cobertura",
      sub:   "Modificá compañía, cobertura, vigencia y valores de la póliza.",
      lookupKicker: "Paso 1",
      lookupTitle: "Buscar póliza",
      lookupSub: "Ingresá el número de póliza para cargar los datos de cobertura.",
      label: "N° de póliza",
      placeholder: "AUT-2410-887143",
      hint: "Tal como figura en el certificado",
      suggestions: Object.keys(SAMPLE_REGISTRY.cobertura),
      lookup: (key) => SAMPLE_REGISTRY.cobertura[key.trim().toUpperCase()] || null,
    },
  }[mode] || {};

  const [query, setQuery] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [record, setRecord] = React.useState(null);
  const [notFound, setNotFound] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const buscar = (q) => {
    const r = config.lookup(q || query);
    if (r) {
      setRecord({ ...r });
      setNotFound(false);
    } else {
      setRecord(null);
      setNotFound(true);
    }
  };
  const update = (k) => (v) => setRecord(p => ({ ...p, [k]: typeof v === "object" && v?.target ? v.target.value : v }));

  return (
    <div style={editStyles.page}>
      <Navbar active="editar" onNavigate={onNavigate} onLogout={onLogout} />

      <div style={editStyles.hero}>
        <div style={editStyles.crumb}>
          <span style={editStyles.crumbA} onClick={() => onNavigate?.("dashboard")}>Inicio</span>
          {" · Editar · "}{({asegurado:"Asegurado",vehiculo:"Vehículo",cobertura:"Cobertura"}[mode])}
        </div>
        <h1 style={editStyles.h1}>{config.title}</h1>
        <p style={editStyles.sub}>{config.sub}</p>
      </div>

      {!record ? (
        <div style={editStyles.lookup}>
          <div style={editStyles.lookupHead}>
            <div style={editStyles.lookupKicker}>{config.lookupKicker}</div>
            <h2 style={editStyles.lookupTitle}>{config.lookupTitle}</h2>
            <p style={editStyles.lookupSub}>{config.lookupSub}</p>
          </div>
          <div style={editStyles.lookupBody}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 8 }}>
              {config.label} <span style={{ color: "var(--ink-400)", marginLeft: 6, fontWeight: 400, fontSize: 11.5 }}>{config.hint}</span>
            </div>
            <div style={editStyles.lookupSearchWrap(focused)}>
              <IconSearch size={20} style={{ color: focused ? "var(--blue-600)" : "var(--ink-400)" }} />
              <input
                style={editStyles.lookupSearchInput}
                placeholder={config.placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && buscar()}
              />
              <button style={editStyles.lookupBtn} onClick={() => buscar()}>
                <IconSearch size={16} /> Buscar
              </button>
            </div>

            {notFound && (
              <div style={editStyles.notFound}>
                <Icon size={16} d={<><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3v.01"/></>} />
                <div>
                  <strong>No se encontró el registro.</strong>{" "}
                  Verificá el dato ingresado o probá con una de las sugerencias.
                </div>
              </div>
            )}

            <div style={editStyles.suggestionsLabel}>Búsquedas recientes</div>
            <div style={editStyles.suggestions}>
              {config.suggestions.map(s => (
                <button key={s} style={editStyles.suggChip}
                        onClick={() => { setQuery(s); buscar(s); }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={editStyles.shell}>
          <main style={editStyles.card}>
            {mode === "asegurado" && <FormAsegurado rec={record} update={update} />}
            {mode === "vehiculo"  && <FormVehiculo  rec={record} update={update} />}
            {mode === "cobertura" && <FormCobertura rec={record} update={update} />}
            <FormFooter onBack={() => { setRecord(null); setQuery(""); }}
                        onSave={() => setSaved(true)} />
          </main>

          <ContextPanel mode={mode} rec={record} />
        </div>
      )}

      {saved && (
        <div style={editStyles.savedModalBack}>
          <div style={editStyles.savedModal}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "var(--ok-100)", color: "var(--ok-700)",
              margin: "0 auto 16px", display: "grid", placeItems: "center",
            }}>
              <IconCheck size={30} sw={2.5} />
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, letterSpacing: "-0.02em" }}>
              Cambios guardados
            </h3>
            <p style={{ margin: 0, color: "var(--ink-500)", fontSize: 14 }}>
              Los datos se actualizaron correctamente.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
              <button onClick={() => { setSaved(false); setRecord(null); setQuery(""); }}
                      style={{ height: 40, padding: "0 16px", borderRadius: 9,
                               background: "var(--paper)", border: "1.5px solid var(--line)",
                               color: "var(--ink-900)", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                Editar otro
              </button>
              <button onClick={() => onNavigate?.("dashboard")}
                      style={{ height: 40, padding: "0 16px", borderRadius: 9,
                               background: "var(--navy-900)", border: 0,
                               color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                Volver a cartera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── Sub-forms ─────────── */

function FormAsegurado({ rec, update }) {
  const A = window.npAtoms;
  const [focus, setFocus] = React.useState(null);

  return (
    <>
      <div style={A.npStyles.cardHead}>
        <div style={A.npStyles.cardKicker}>Paso 2 · Editar</div>
        <h2 style={A.npStyles.cardTitle}>Datos del asegurado</h2>
        <p style={A.npStyles.cardSub}>Los datos cargados vienen del registro existente. Modificá lo necesario y guardá.</p>
      </div>
      <div style={A.npStyles.cardBody}>
        <div style={A.npStyles.grid("1fr 1fr 1fr")}>
          <A.Field label={rec.idType} required>
            <A.InputBox focus={focus === "id"} onFocus={() => setFocus("id")} onBlur={() => setFocus(null)}>
              <input className="mono" style={A.npStyles.input}
                value={rec.idNumber} onChange={update("idNumber")} />
            </A.InputBox>
          </A.Field>
          <A.Field label="Nombre" required>
            <A.InputBox focus={focus === "n"} onFocus={() => setFocus("n")} onBlur={() => setFocus(null)}>
              <input style={A.npStyles.input} value={rec.nombre} onChange={update("nombre")} />
            </A.InputBox>
          </A.Field>
          <A.Field label="Apellido" required>
            <A.InputBox focus={focus === "a"} onFocus={() => setFocus("a")} onBlur={() => setFocus(null)}>
              <input style={A.npStyles.input} value={rec.apellido} onChange={update("apellido")} />
            </A.InputBox>
          </A.Field>
        </div>

        <div style={{ height: 14 }} />

        <div style={A.npStyles.grid("1fr 1fr 1.4fr")}>
          <A.Field label="Fecha de nacimiento" required>
            <A.InputBox focus={focus === "nac"} onFocus={() => setFocus("nac")} onBlur={() => setFocus(null)}>
              <IconCal size={16} style={{ color: "var(--ink-400)" }} />
              <input type="date" style={A.npStyles.input} value={rec.nac} onChange={update("nac")} />
            </A.InputBox>
          </A.Field>
          <A.Field label="Teléfono" required>
            <A.InputBox focus={focus === "tel"} onFocus={() => setFocus("tel")} onBlur={() => setFocus(null)}>
              <Icon size={16} style={{ color: "var(--ink-400)" }}
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7 2 2 0 0 1 1.72 2.03Z" />
              <input className="mono" style={A.npStyles.input} value={rec.telefono} onChange={update("telefono")} />
            </A.InputBox>
          </A.Field>
          <A.Field label="Correo electrónico" required>
            <A.InputBox focus={focus === "email"} onFocus={() => setFocus("email")} onBlur={() => setFocus(null)}>
              <IconMail size={16} style={{ color: "var(--ink-400)" }} />
              <input type="email" style={A.npStyles.input} value={rec.email} onChange={update("email")} />
            </A.InputBox>
          </A.Field>
        </div>

        <div style={{ height: 14 }} />

        <A.Field label="Domicilio" required hint="Calle y altura">
          <A.InputBox focus={focus === "dom"} onFocus={() => setFocus("dom")} onBlur={() => setFocus(null)}>
            <input style={A.npStyles.input} value={rec.calle} onChange={update("calle")} />
          </A.InputBox>
        </A.Field>

        <div style={{ height: 12 }} />

        <div style={A.npStyles.grid("repeat(4, 1fr)")}>
          <A.Field label="Número">
            <A.InputBox focus={focus === "num"} onFocus={() => setFocus("num")} onBlur={() => setFocus(null)}>
              <input className="mono" style={A.npStyles.input} value={rec.numero} onChange={update("numero")} />
            </A.InputBox>
          </A.Field>
          <A.Field label="Piso / Dto.">
            <A.InputBox focus={focus === "piso"} onFocus={() => setFocus("piso")} onBlur={() => setFocus(null)}>
              <input style={A.npStyles.input} value={rec.piso} onChange={update("piso")} />
            </A.InputBox>
          </A.Field>
          <A.Field label="Localidad">
            <A.InputBox focus={focus === "loc"} onFocus={() => setFocus("loc")} onBlur={() => setFocus(null)}>
              <input style={A.npStyles.input} value={rec.localidad} onChange={update("localidad")} />
            </A.InputBox>
          </A.Field>
          <A.Field label="Provincia">
            <A.SelectBox focus={focus === "prov"} onFocus={() => setFocus("prov")} onBlur={() => setFocus(null)}
              value={rec.provincia} onChange={update("provincia")}
              options={A.PROVINCIAS} />
          </A.Field>
        </div>
      </div>
    </>
  );
}

function FormVehiculo({ rec, update }) {
  const A = window.npAtoms;
  const [focus, setFocus] = React.useState(null);

  return (
    <>
      <div style={A.npStyles.cardHead}>
        <div style={A.npStyles.cardKicker}>Paso 2 · Editar</div>
        <h2 style={A.npStyles.cardTitle}>Datos del vehículo</h2>
        <p style={A.npStyles.cardSub}>Modificá los datos del bien asegurado y guardá los cambios.</p>
      </div>
      <div style={A.npStyles.cardBody}>
        <div style={A.npStyles.grid("1.1fr 2fr")}>
          <A.Field label="Patente" required>
            <A.InputBox focus={focus === "pat"} onFocus={() => setFocus("pat")} onBlur={() => setFocus(null)}>
              <input className="mono"
                style={{...A.npStyles.input, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600}}
                value={rec.patente} onChange={(e) => update("patente")(e.target.value.toUpperCase())} />
            </A.InputBox>
          </A.Field>
          <A.Field label="Marca y modelo" required>
            <div style={A.npStyles.grid("1fr 1.4fr")}>
              <A.SelectBox focus={focus === "marca"} onFocus={() => setFocus("marca")} onBlur={() => setFocus(null)}
                value={rec.marca} onChange={update("marca")}
                options={["Volkswagen","Toyota","Ford","Fiat","Chevrolet","Renault","Peugeot","Citroën","Honda","Nissan","Otra"]} />
              <A.InputBox focus={focus === "modelo"} onFocus={() => setFocus("modelo")} onBlur={() => setFocus(null)}>
                <input style={A.npStyles.input} value={rec.modelo} onChange={update("modelo")} />
              </A.InputBox>
            </div>
          </A.Field>
        </div>

        <div style={{ height: 14 }} />

        <div style={A.npStyles.grid("0.6fr 1.4fr 1.4fr")}>
          <A.Field label="Año" required>
            <A.InputBox focus={focus === "anio"} onFocus={() => setFocus("anio")} onBlur={() => setFocus(null)}>
              <input className="mono" style={A.npStyles.input} value={rec.anio} onChange={update("anio")} />
            </A.InputBox>
          </A.Field>
          <A.Field label="N° de chasis" required hint="17 caracteres">
            <A.InputBox focus={focus === "chasis"} onFocus={() => setFocus("chasis")} onBlur={() => setFocus(null)}>
              <input className="mono"
                style={{...A.npStyles.input, textTransform: "uppercase"}}
                value={rec.chasis} onChange={(e) => update("chasis")(e.target.value.toUpperCase())} />
            </A.InputBox>
          </A.Field>
          <A.Field label="N° de motor" required>
            <A.InputBox focus={focus === "motor"} onFocus={() => setFocus("motor")} onBlur={() => setFocus(null)}>
              <input className="mono"
                style={{...A.npStyles.input, textTransform: "uppercase"}}
                value={rec.motor} onChange={(e) => update("motor")(e.target.value.toUpperCase())} />
            </A.InputBox>
          </A.Field>
        </div>
      </div>
    </>
  );
}

function FormCobertura({ rec, update }) {
  const A = window.npAtoms;
  const [focus, setFocus] = React.useState(null);

  return (
    <>
      <div style={A.npStyles.cardHead}>
        <div style={A.npStyles.cardKicker}>Paso 2 · Editar</div>
        <h2 style={A.npStyles.cardTitle}>Detalles de la cobertura</h2>
        <p style={A.npStyles.cardSub}>Compañía, cobertura, vigencia y valores de la cuota.</p>
      </div>
      <div style={A.npStyles.cardBody}>
        <A.Field label="Compañía aseguradora" required>
          <A.SelectBox focus={focus === "co"} onFocus={() => setFocus("co")} onBlur={() => setFocus(null)}
            value={rec.compania} onChange={update("compania")}
            options={A.COMPANIES_NP.map(c => c.n)}
            renderOption={(name) => {
              const c = A.COMPANIES_NP.find(x => x.n === name);
              return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: c?.c || "var(--ink-400)" }} />
                  {name}
                </span>
              );
            }} />
        </A.Field>

        <div style={{ height: 16 }} />

        <A.Field label="Tipo de cobertura" required>
          <A.SelectBox focus={focus === "cob"} onFocus={() => setFocus("cob")} onBlur={() => setFocus(null)}
            value={rec.cobertura} onChange={update("cobertura")}
            options={Object.values(A.COBERTURAS).flat()} />
        </A.Field>

        <div style={{ height: 16 }} />

        <div style={A.npStyles.grid("1fr 1fr")}>
          <A.Field label="Período de póliza" required>
            <A.SelectBox focus={focus === "perPol"} onFocus={() => setFocus("perPol")} onBlur={() => setFocus(null)}
              value={rec.periodoPoliza} onChange={update("periodoPoliza")}
              options={[
                "1 mes (mensual)","2 meses (bimestral)","3 meses (trimestral)",
                "4 meses (cuatrimestral)","6 meses (semestral)","9 meses","12 meses (anual)",
              ]} />
          </A.Field>
          <A.Field label="Vencimiento" required>
            <A.InputBox focus={focus === "ven"} onFocus={() => setFocus("ven")} onBlur={() => setFocus(null)}>
              <IconCal size={16} style={{ color: "var(--ink-400)" }} />
              <input type="date" style={A.npStyles.input} value={rec.vencimiento} onChange={update("vencimiento")} />
            </A.InputBox>
          </A.Field>
        </div>

        <div style={{ height: 16 }} />

        <div style={A.npStyles.grid("1fr 1fr")}>
          <A.Field label="Período de cuotas" required>
            <div style={{ display: "flex", gap: 6, height: 42 }}>
              {["Mensual","Bimestral","Trimestral"].map(p => (
                <button key={p} onClick={() => update("periodoCuotas")(p)}
                  style={{
                    flex: 1, borderRadius: 9,
                    border: "1.5px solid " + (rec.periodoCuotas === p ? "var(--navy-900)" : "var(--line)"),
                    background: rec.periodoCuotas === p ? "var(--blue-100)" : "var(--paper)",
                    color: rec.periodoCuotas === p ? "var(--navy-900)" : "var(--ink-700)",
                    fontSize: 13, fontWeight: 500, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                  {rec.periodoCuotas === p && <IconCheck size={13} />}
                  {p}
                </button>
              ))}
            </div>
          </A.Field>
          <A.Field label={"Valor de la cuota " + (rec.periodoCuotas || "Mensual").toLowerCase()} required>
            <A.InputBox focus={focus === "cuota"} onFocus={() => setFocus("cuota")} onBlur={() => setFocus(null)}>
              <span style={A.npStyles.inputAdorn}>ARS $</span>
              <input className="mono" style={A.npStyles.input} value={rec.cuota} onChange={update("cuota")} />
              <span style={A.npStyles.inputAdorn}>
                / {({Mensual:"mes",Bimestral:"bimestre",Trimestral:"trimestre"}[rec.periodoCuotas]||"mes")}
              </span>
            </A.InputBox>
          </A.Field>
        </div>
      </div>
    </>
  );
}

function FormFooter({ onBack, onSave }) {
  return (
    <div style={{
      padding: "16px 26px",
      borderTop: "1px solid var(--line-2)",
      background: "oklch(0.985 0.008 245)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>
        Los cambios reemplazarán los datos actuales del registro.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onBack}
                style={{ height: 44, padding: "0 16px", borderRadius: 10,
                         background: "transparent", border: "1px solid var(--line)",
                         color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer",
                         display: "inline-flex", alignItems: "center", gap: 7 }}>
          <IconChevL size={15} /> Buscar otro
        </button>
        <button onClick={onSave}
                style={{ height: 44, padding: "0 22px", borderRadius: 10,
                         background: "linear-gradient(180deg, var(--blue-600), var(--navy-800))",
                         color: "white", border: 0, cursor: "pointer",
                         fontSize: 14, fontWeight: 600,
                         display: "inline-flex", alignItems: "center", gap: 9,
                         boxShadow: "0 8px 24px -8px oklch(0.30 0.10 250 / 0.5)" }}>
          <IconCheck size={16} /> Guardar cambios
        </button>
      </div>
    </div>
  );
}

function ContextPanel({ mode, rec }) {
  return (
    <aside style={editStyles.ctxPanel}>
      <div style={editStyles.ctxHead}>
        <div style={editStyles.ctxKicker}>Registro</div>
        {mode === "asegurado" && (
          <>
            <div style={editStyles.ctxName}>{rec.nombre} {rec.apellido}</div>
            <div style={editStyles.ctxId}>{rec.idType} {rec.idNumber}</div>
          </>
        )}
        {mode === "vehiculo" && (
          <>
            <div style={editStyles.ctxName}>{rec.marca} {rec.modelo}</div>
            <div style={editStyles.ctxId}>{rec.patente}</div>
          </>
        )}
        {mode === "cobertura" && (
          <>
            <div style={editStyles.ctxName}>{rec.titular}</div>
            <div style={editStyles.ctxId}>{rec.poliza}</div>
          </>
        )}
      </div>
      <div style={editStyles.ctxBody}>
        {mode === "asegurado" && (
          <>
            <Row k="Teléfono" v={rec.telefono} />
            <Row k="Email" v={rec.email} />
            <Row k="Domicilio" v={[rec.calle, rec.numero].filter(Boolean).join(" ")} />
            <Row k="Localidad" v={rec.localidad} />
            <Row k="Provincia" v={rec.provincia} last />
          </>
        )}
        {mode === "vehiculo" && (
          <>
            <Row k="Año"     v={rec.anio} />
            <Row k="Chasis"  v={rec.chasis} mono />
            <Row k="Motor"   v={rec.motor} mono last />
          </>
        )}
        {mode === "cobertura" && (
          <>
            <Row k="Compañía"   v={rec.compania} />
            <Row k="Cobertura"  v={rec.cobertura} />
            <Row k="Vencimiento" v={rec.vencimiento} mono />
            <Row k="Cuota"      v={"$ " + rec.cuota} mono />
            <Row k="Vigencia"   v={rec.periodoPoliza} />
            <Row k="Cuotas"     v={rec.periodoCuotas} last />
          </>
        )}
      </div>
    </aside>
  );
}

function Row({ k, v, mono, last }) {
  return (
    <div style={{ ...editStyles.ctxRow, ...(last ? { borderBottom: 0 } : {}) }}>
      <span style={editStyles.ctxK}>{k}</span>
      <span style={{ ...editStyles.ctxV, ...(mono ? { fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 } : {}) }}>
        {v || "—"}
      </span>
    </div>
  );
}

window.Editar = Editar;
