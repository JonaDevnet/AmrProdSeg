// AMR — Login screen
// Split layout: branded navy panel left, form right

const loginStyles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "minmax(420px, 1fr) minmax(520px, 1fr)",
    background: "var(--paper)",
  },
  brandSide: {
    position: "relative",
    background: "linear-gradient(165deg, var(--navy-950) 0%, var(--navy-800) 60%, var(--blue-600) 130%)",
    color: "white",
    padding: "44px 56px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  brandTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  logoMark: {
    width: 38, height: 38, borderRadius: 9,
    background: "white",
    color: "var(--navy-900)",
    display: "grid", placeItems: "center",
    fontWeight: 700, fontSize: 17, letterSpacing: "-0.03em",
  },
  brandBody: {
    marginTop: "auto",
    marginBottom: "auto",
    maxWidth: 460,
  },
  brandKicker: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: "oklch(0.85 0.05 240)",
    fontWeight: 600,
  },
  brandH: {
    fontSize: 44,
    lineHeight: 1.05,
    letterSpacing: "-0.025em",
    fontWeight: 600,
    margin: "18px 0 18px",
    textWrap: "balance",
  },
  brandSub: {
    fontSize: 16,
    lineHeight: 1.5,
    color: "oklch(0.88 0.025 240)",
    maxWidth: 420,
  },
  brandFoot: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12.5,
    color: "oklch(0.78 0.04 240)",
    paddingTop: 24,
    borderTop: "1px solid oklch(1 0 0 / 0.12)",
  },
  // Decorative
  ring: (size, top, left, opacity) => ({
    position: "absolute",
    width: size, height: size,
    borderRadius: "50%",
    border: "1px solid oklch(1 0 0 / " + opacity + ")",
    top, left,
    pointerEvents: "none",
  }),
  arc: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at 110% 110%, oklch(0.62 0.16 243 / 0.5), transparent 55%)",
    pointerEvents: "none",
  },

  // Form side
  formSide: {
    display: "flex",
    flexDirection: "column",
    padding: "44px 56px",
    background: "var(--paper)",
  },
  formTop: {
    display: "flex",
    justifyContent: "flex-end",
    fontSize: 13,
    color: "var(--ink-500)",
  },
  formCenter: {
    margin: "auto",
    width: "100%",
    maxWidth: 400,
  },
  formH: {
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    margin: 0,
    color: "var(--ink-900)",
  },
  formSub: {
    margin: "8px 0 32px",
    color: "var(--ink-500)",
    fontSize: 15,
  },
  field: { marginBottom: 16 },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 8,
    color: "var(--ink-700)",
  },
  inputWrap: (focused, hasError) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 14px",
    height: 46,
    background: "var(--paper)",
    borderRadius: 10,
    border: "1.5px solid " + (hasError ? "var(--bad-500)" : focused ? "var(--blue-500)" : "var(--line)"),
    boxShadow: focused ? "0 0 0 4px oklch(0.62 0.16 243 / 0.12)" : "none",
    transition: "all .15s ease",
  }),
  input: {
    flex: 1,
    border: 0,
    outline: 0,
    background: "transparent",
    fontSize: 14.5,
    color: "var(--ink-900)",
    height: "100%",
  },
  iconBtn: {
    border: 0,
    background: "transparent",
    cursor: "pointer",
    color: "var(--ink-500)",
    display: "grid",
    placeItems: "center",
    padding: 4,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "4px 0 22px",
  },
  check: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    fontSize: 13.5,
    color: "var(--ink-700)",
    cursor: "pointer",
    userSelect: "none",
  },
  checkbox: (on) => ({
    width: 17, height: 17, borderRadius: 5,
    border: "1.5px solid " + (on ? "var(--blue-600)" : "var(--line)"),
    background: on ? "var(--blue-600)" : "var(--paper)",
    display: "grid", placeItems: "center",
    color: "white",
    transition: "all .15s ease",
  }),
  forgot: {
    fontSize: 13.5,
    color: "var(--blue-600)",
    textDecoration: "none",
    fontWeight: 500,
  },
  submit: (loading) => ({
    width: "100%",
    height: 48,
    background: loading ? "var(--navy-700)" : "var(--navy-900)",
    color: "white",
    border: 0,
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: "-0.005em",
    cursor: loading ? "wait" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    transition: "background .15s",
  }),
  divider: {
    display: "flex", alignItems: "center", gap: 12,
    margin: "26px 0 18px",
    fontSize: 12,
    color: "var(--ink-400)",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  },
  dividerLine: { flex: 1, height: 1, background: "var(--line)" },
  ssoBtn: {
    width: "100%",
    height: 44,
    background: "var(--paper)",
    color: "var(--ink-900)",
    border: "1.5px solid var(--line)",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  formFoot: {
    textAlign: "center",
    fontSize: 13.5,
    color: "var(--ink-500)",
    marginTop: "auto",
    paddingTop: 32,
  },
  errorLine: {
    fontSize: 12.5,
    color: "var(--bad-700)",
    marginTop: 6,
  },
};

function LoginScreen({ onLogin }) {
  const [user, setUser] = React.useState("alejandro@amrseguros.com.ar");
  const [pass, setPass] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [showPass, setShowPass] = React.useState(false);
  const [focus, setFocus] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const AM_EMAIL = "alejandro@amrseguros.com.ar";

  const submit = (e) => {
    e?.preventDefault?.();
    setError("");
    const email = user.trim().toLowerCase();
    // Check AM
    if (email === AM_EMAIL) {
      setLoading(true);
      setTimeout(() => onLogin({ role: "am", nombre: "AM", email: AM_EMAIL }), 650);
      return;
    }
    // Check vendors
    try {
      const vendors = JSON.parse(localStorage.getItem("amr_vendedores") || "[]");
      const found = vendors.find(v => v.email.toLowerCase() === email && v.password === pass && v.activo);
      if (found) {
        setLoading(true);
        setTimeout(() => onLogin({ role: "vendedor", id: found.id, nombre: found.nombre, email: found.email }), 650);
        return;
      }
      if (vendors.find(v => v.email.toLowerCase() === email && !v.activo)) {
        setError("Este usuario está inactivo. Contactá al administrador.");
        return;
      }
    } catch(e) {}
    setError("Credenciales incorrectas. Verificá tu correo y contraseña.");
  };

  return (
    <div style={loginStyles.page}>
      {/* LEFT — Brand panel */}
      <aside style={loginStyles.brandSide}>
        <div style={loginStyles.arc} />
        <div style={loginStyles.ring(520, -180, -200, 0.08)} />
        <div style={loginStyles.ring(380, "auto", "auto", 0.10) }>
        </div>
        <div style={{...loginStyles.ring(380, "60%", "55%", 0.07)}} />
        <div style={{...loginStyles.ring(220, "12%", "62%", 0.10)}} />

        <div style={loginStyles.brandTop}>
          <div style={loginStyles.logoMark}>A</div>
          <div>
            <div style={{ fontSize: 15, lineHeight: 1.1 }}>AMR</div>
            <div style={{ fontSize: 11.5, color: "oklch(0.85 0.05 240)", letterSpacing: "0.04em" }}>
              PRODUCCIÓN DE SEGUROS
            </div>
          </div>
        </div>

        <div style={loginStyles.brandBody}>
          <div style={loginStyles.brandKicker}>Portal del productor</div>
          <h1 style={loginStyles.brandH}>
            Tu cartera, tus pólizas,<br/>todo en un solo lugar.
          </h1>
          <p style={loginStyles.brandSub}>
            Gestioná clientes, emití pólizas nuevas y seguí vencimientos
            con la velocidad que tu negocio necesita.
          </p>

          <div style={{ display: "flex", gap: 28, marginTop: 36 }}>
            <Stat n="1.284" l="Pólizas activas" />
            <Stat n="312" l="Clientes" />
            <Stat n="8" l="Compañías" />
          </div>
        </div>

        <div style={loginStyles.brandFoot}>
          <span>© 2026 AMR Producción de Seguros</span>
          <span>Mat. SSN nº 80.451</span>
        </div>
      </aside>

      {/* RIGHT — Form */}
      <main style={loginStyles.formSide}>
        <div style={loginStyles.formTop}>
          ¿No tenés cuenta? &nbsp;
          <a href="#" style={{ color: "var(--blue-600)", fontWeight: 500, textDecoration: "none" }}>
            Solicitá acceso
          </a>
        </div>

        <form style={loginStyles.formCenter} onSubmit={submit}>
          <h2 style={loginStyles.formH}>Iniciar sesión</h2>
          <p style={loginStyles.formSub}>Ingresá con tus credenciales del portal.</p>

          <div style={loginStyles.field}>
            <label style={loginStyles.label}>Correo electrónico</label>
            <div style={loginStyles.inputWrap(focus === "u")}>
              <IconMail size={17} />
              <input
                style={loginStyles.input}
                value={user}
                onChange={(e) => setUser(e.target.value)}
                onFocus={() => setFocus("u")}
                onBlur={() => setFocus(null)}
                placeholder="nombre@empresa.com.ar"
                autoComplete="email"
              />
            </div>
          </div>

          <div style={loginStyles.field}>
            <label style={loginStyles.label}>Contraseña</label>
            <div style={loginStyles.inputWrap(focus === "p")}>
              <IconLock size={17} />
              <input
                style={loginStyles.input}
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onFocus={() => setFocus("p")}
                onBlur={() => setFocus(null)}
                autoComplete="current-password"
              />
              <button
                type="button"
                style={loginStyles.iconBtn}
                onClick={() => setShowPass(!showPass)}
                aria-label="Mostrar contraseña"
              >
                <IconEye size={17} />
              </button>
            </div>
          </div>

          <div style={loginStyles.row}>
            <label style={loginStyles.check}>
              <span
                style={loginStyles.checkbox(remember)}
                onClick={() => setRemember(!remember)}
              >
                {remember && <IconCheck size={11} />}
              </span>
              Recordarme en este equipo
            </label>
            <a href="#" style={loginStyles.forgot}>¿Olvidaste tu clave?</a>
          </div>

          <button type="submit" style={loginStyles.submit(loading)}>
            {loading ? "Ingresando…" : <>Entrar al portal <IconArrowR size={17} /></>}
          </button>
          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)", display: "flex", gap: 8, alignItems: "center" }}>
              <Icon size={15} d={<><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3v.01"/></>} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div style={loginStyles.divider}>
            <div style={loginStyles.dividerLine} /> o <div style={loginStyles.dividerLine} />
          </div>

          <button type="button" style={loginStyles.ssoBtn}>
            <IconShield size={16} style={{ color: "var(--blue-600)" }} />
            Ingresar con SSO corporativo
          </button>

          <div style={loginStyles.formFoot}>
            Al continuar, aceptás los <a href="#" style={{ color: "var(--ink-700)" }}>Términos</a> y la{" "}
            <a href="#" style={{ color: "var(--ink-700)" }}>Política de privacidad</a>.
          </div>
        </form>
      </main>
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }} className="mono">{n}</div>
      <div style={{ fontSize: 12, color: "oklch(0.82 0.05 240)", marginTop: 2 }}>{l}</div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
