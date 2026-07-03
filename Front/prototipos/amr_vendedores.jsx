// AMR — Gestión de vendedores

const DEMO_VENDORS_SEED = [
  { id: "v1", nombre: "María García",  email: "mgarcia@amrseguros.com.ar", password: "vendedor123", activo: true,  createdAt: "2026-01-15" },
  { id: "v2", nombre: "Carlos López",  email: "clopez@amrseguros.com.ar",  password: "vendedor123", activo: false, createdAt: "2026-02-20" },
];

function loadVendors() {
  try {
    const stored = JSON.parse(localStorage.getItem("amr_vendedores") || "null");
    if (!stored) {
      localStorage.setItem("amr_vendedores", JSON.stringify(DEMO_VENDORS_SEED));
      return DEMO_VENDORS_SEED;
    }
    return stored;
  } catch(e) { return []; }
}

const vStyles = {
  page: { background: "var(--canvas)", minHeight: "100vh" },
  hero: {
    maxWidth: 1440, margin: "0 auto",
    padding: "32px 28px 20px",
    display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24,
  },
  crumb: { fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 },
  h1: { margin: 0, fontSize: 30, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" },
  sub: { margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14.5 },
  shell: { maxWidth: 1440, margin: "0 auto 60px", padding: "20px 28px" },
  addBtn: {
    height: 42, padding: "0 18px", borderRadius: 10,
    background: "var(--navy-900)", color: "white",
    border: 0, cursor: "pointer",
    fontSize: 13.5, fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 8,
  },
  card: {
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 16,
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
  },
  th: {
    textAlign: "left", padding: "11px 20px",
    fontSize: 11, fontWeight: 600,
    color: "var(--ink-500)",
    textTransform: "uppercase", letterSpacing: "0.07em",
    borderBottom: "1px solid var(--line-2)",
    background: "oklch(0.985 0.008 245)",
    whiteSpace: "nowrap",
  },
  td: { padding: "14px 20px", borderBottom: "1px solid var(--line-2)", color: "var(--ink-900)", verticalAlign: "middle" },
  badge: (activo) => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
    background: activo ? "var(--ok-100)" : "var(--bad-100)",
    color: activo ? "var(--ok-700)" : "var(--bad-700)",
  }),
  badgeDot: (activo) => ({
    width: 6, height: 6, borderRadius: "50%",
    background: activo ? "var(--ok-500)" : "var(--bad-500)",
  }),
  actionBtn: {
    width: 32, height: 32, borderRadius: 8,
    border: "1px solid var(--line)", background: "var(--paper)",
    color: "var(--ink-500)", cursor: "pointer",
    display: "grid", placeItems: "center",
  },
  emptyRow: {
    padding: "60px 0", textAlign: "center",
    color: "var(--ink-500)", fontSize: 14,
  },
};

function Vendedores({ onNavigate, onLogout }) {
  const [vendors, setVendors] = React.useState(loadVendors);
  const [modal, setModal] = React.useState(null);   // null | { mode:"add" } | { mode:"edit", vendor }
  const [confirmDel, setConfirmDel] = React.useState(null);

  const saveAll = (list) => {
    setVendors(list);
    localStorage.setItem("amr_vendedores", JSON.stringify(list));
  };

  const handleSave = (v) => {
    if (v.id) {
      saveAll(vendors.map(x => x.id === v.id ? v : x));
    } else {
      saveAll([...vendors, { ...v, id: "v" + Date.now(), createdAt: new Date().toISOString().slice(0, 10), activo: true }]);
    }
    setModal(null);
  };

  const handleToggle = (id) => saveAll(vendors.map(v => v.id === id ? { ...v, activo: !v.activo } : v));
  const handleDelete = (id) => { saveAll(vendors.filter(v => v.id !== id)); setConfirmDel(null); };

  return (
    <div style={vStyles.page}>
      <Navbar active="" onNavigate={onNavigate} onLogout={onLogout} />

      <div style={vStyles.hero}>
        <div>
          <div style={vStyles.crumb}>
            <span style={{ cursor: "pointer", color: "var(--blue-600)" }} onClick={() => onNavigate?.("dashboard")}>Inicio</span>
            {" · "}Vendedores
          </div>
          <h1 style={vStyles.h1}>Gestión de vendedores</h1>
          <p style={vStyles.sub}>Administrá los accesos y credenciales de tu equipo de ventas.</p>
        </div>
        <button style={vStyles.addBtn} onClick={() => setModal({ mode: "add" })}>
          <IconPlus size={15} /> Agregar vendedor
        </button>
      </div>

      <div style={vStyles.shell}>
        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { l: "Total vendedores", n: vendors.length },
            { l: "Activos",  n: vendors.filter(v => v.activo).length,  ok: true },
            { l: "Inactivos", n: vendors.filter(v => !v.activo).length, bad: true },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 20px" }}>
              <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 500 }}>{s.l}</div>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4, fontFamily: "'JetBrains Mono', monospace",
                color: s.ok ? "var(--ok-700)" : s.bad ? "var(--bad-700)" : "var(--ink-900)" }}>{s.n}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={vStyles.card}>
          {vendors.length === 0 ? (
            <div style={vStyles.emptyRow}>
              No hay vendedores registrados.{" "}
              <button onClick={() => setModal({ mode: "add" })}
                style={{ color: "var(--blue-600)", background: "none", border: 0, cursor: "pointer", fontWeight: 500, fontSize: 14 }}>
                Agregar el primero
              </button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr>
                  <th style={vStyles.th}>Nombre</th>
                  <th style={vStyles.th}>Correo electrónico</th>
                  <th style={vStyles.th}>Alta</th>
                  <th style={vStyles.th}>Estado</th>
                  <th style={{ ...vStyles.th, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v, i) => (
                  <tr key={v.id}
                    style={{ background: i % 2 === 0 ? "transparent" : "oklch(0.99 0.004 245)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--blue-50)"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "oklch(0.99 0.004 245)"}>
                    <td style={vStyles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--blue-500), oklch(0.50 0.16 200))",
                          color: "white", display: "grid", placeItems: "center",
                          fontSize: 13, fontWeight: 600, flexShrink: 0
                        }}>
                          {v.nombre.split(" ").map(p => p[0]).slice(0, 2).join("")}
                        </div>
                        <span style={{ fontWeight: 500 }}>{v.nombre}</span>
                      </div>
                    </td>
                    <td style={{ ...vStyles.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}>{v.email}</td>
                    <td style={{ ...vStyles.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: "var(--ink-500)" }}>{v.createdAt}</td>
                    <td style={vStyles.td}>
                      <button
                        onClick={() => handleToggle(v.id)}
                        title={v.activo ? "Desactivar" : "Activar"}
                        style={{ ...vStyles.badge(v.activo), cursor: "pointer", border: 0 }}>
                        <span style={vStyles.badgeDot(v.activo)} />
                        {v.activo ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td style={{ ...vStyles.td, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button style={vStyles.actionBtn} title="Editar"
                          onClick={() => setModal({ mode: "edit", vendor: v })}
                          onMouseEnter={e => { e.currentTarget.style.background = "var(--blue-50)"; e.currentTarget.style.color = "var(--navy-900)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "var(--paper)"; e.currentTarget.style.color = "var(--ink-500)"; }}>
                          <Icon size={14} d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                        </button>
                        <button style={vStyles.actionBtn} title="Eliminar"
                          onClick={() => setConfirmDel(v)}
                          onMouseEnter={e => { e.currentTarget.style.background = "var(--bad-100)"; e.currentTarget.style.color = "var(--bad-700)"; e.currentTarget.style.borderColor = "var(--bad-300)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "var(--paper)"; e.currentTarget.style.color = "var(--ink-500)"; e.currentTarget.style.borderColor = "var(--line)"; }}>
                          <Icon size={14} d={<><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info box */}
        <div style={{ marginTop: 16, padding: "14px 18px", background: "oklch(0.97 0.03 245)", border: "1px solid var(--blue-100)", borderRadius: 12, fontSize: 13, color: "var(--ink-700)", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon size={16} d={<><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3v.01"/></>} style={{ color: "var(--blue-600)", flexShrink: 0, marginTop: 1 }} />
          <div>
            Los vendedores pueden gestionar la cartera, cargar pólizas y ver cobranzas.
            <strong style={{ color: "var(--ink-900)" }}> No pueden ver reportes del usuario AM</strong> ni acceder a la gestión de vendedores.
          </div>
        </div>
      </div>

      {modal && (
        <VendorModal
          vendor={modal.vendor || null}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {confirmDel && (
        <div onClick={() => setConfirmDel(null)} style={{ position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.45)", backdropFilter: "blur(4px)", zIndex: 50, display: "grid", placeItems: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--paper)", borderRadius: 14, padding: "28px 28px 20px", width: 380, boxShadow: "var(--shadow-lg)" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-900)", marginBottom: 8 }}>¿Eliminar vendedor?</div>
            <div style={{ fontSize: 14, color: "var(--ink-500)", marginBottom: 22 }}>
              Se eliminarán el acceso y las credenciales de <strong style={{ color: "var(--ink-900)" }}>{confirmDel.nombre}</strong>. Esta acción no se puede deshacer.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDel(null)} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDel.id)} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: 0, background: "var(--bad-600)", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VendorModal({ vendor, onClose, onSave }) {
  const isEdit = !!vendor;
  const [nombre, setNombre] = React.useState(vendor?.nombre || "");
  const [email, setEmail]   = React.useState(vendor?.email   || "");
  const [pass, setPass]     = React.useState(vendor?.password || "");
  const [showPass, setShowPass] = React.useState(false);
  const [focus, setFocus]   = React.useState(null);
  const [errors, setErrors] = React.useState({});

  const validate = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = "Ingresá el nombre completo.";
    if (!email.trim() || !email.includes("@")) e.email = "Email inválido.";
    if (!pass.trim() || pass.length < 6) e.pass = "Mínimo 6 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSave({ ...vendor, nombre: nombre.trim(), email: email.trim().toLowerCase(), password: pass });
  };

  const FRow = ({ label, err, children }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 7 }}>{label} <span style={{ color: "var(--bad-700)" }}>*</span></div>
      {children}
      {err && <div style={{ fontSize: 12, color: "var(--bad-700)", marginTop: 5 }}>{err}</div>}
    </div>
  );

  const IWrap = ({ fkey, children }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      border: "1.5px solid " + (errors[fkey] ? "var(--bad-500)" : focus === fkey ? "var(--blue-500)" : "var(--line)"),
      boxShadow: focus === fkey ? "0 0 0 4px oklch(0.62 0.16 243 / 0.12)" : "none",
      borderRadius: 10, padding: "0 14px", height: 46, background: "var(--paper)", transition: "all .15s"
    }}>{children}</div>
  );

  const inputBase = { flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14, color: "var(--ink-900)" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.50)", backdropFilter: "blur(5px)", zIndex: 50, display: "grid", placeItems: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 480, background: "var(--paper)", borderRadius: 16, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", background: "linear-gradient(160deg, var(--navy-950), var(--navy-800))", color: "white", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.65, marginBottom: 5 }}>
              {isEdit ? "Editar vendedor" : "Nuevo vendedor"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{isEdit ? vendor.nombre : "Agregar al equipo"}</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid oklch(1 0 0 / 0.15)", background: "oklch(1 0 0 / 0.08)", color: "oklch(0.85 0.04 240)", cursor: "pointer", display: "grid", placeItems: "center" }}>
            <IconClose size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 24px" }}>
          <FRow label="Nombre completo" err={errors.nombre}>
            <IWrap fkey="nombre">
              <IconUser size={16} style={{ color: "var(--ink-400)" }} />
              <input style={inputBase} placeholder="Ej. María García"
                value={nombre} onChange={e => { setNombre(e.target.value); setErrors(p => ({...p, nombre: ""})); }}
                onFocus={() => setFocus("nombre")} onBlur={() => setFocus(null)} />
            </IWrap>
          </FRow>
          <FRow label="Correo electrónico" err={errors.email}>
            <IWrap fkey="email">
              <IconMail size={16} style={{ color: "var(--ink-400)" }} />
              <input type="email" style={inputBase} placeholder="vendedor@amrseguros.com.ar"
                value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email: ""})); }}
                onFocus={() => setFocus("email")} onBlur={() => setFocus(null)} />
            </IWrap>
          </FRow>
          <FRow label={isEdit ? "Nueva contraseña" : "Contraseña"} err={errors.pass}>
            <IWrap fkey="pass">
              <IconLock size={16} style={{ color: "var(--ink-400)" }} />
              <input type={showPass ? "text" : "password"} style={inputBase}
                placeholder={isEdit ? "Dejá vacío para no cambiar" : "Mínimo 6 caracteres"}
                value={pass} onChange={e => { setPass(e.target.value); setErrors(p => ({...p, pass: ""})); }}
                onFocus={() => setFocus("pass")} onBlur={() => setFocus(null)}
                onKeyDown={e => e.key === "Enter" && submit()} />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--ink-400)", display: "grid", placeItems: "center", padding: 4 }}>
                <IconEye size={16} />
              </button>
            </IWrap>
            {!isEdit && <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 5 }}>El vendedor usará este correo y contraseña para iniciar sesión.</div>}
          </FRow>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>Cancelar</button>
          <button onClick={submit} style={{ height: 38, padding: "0 18px", borderRadius: 9, border: 0, background: "linear-gradient(180deg, var(--navy-800), var(--navy-950))", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <IconCheck size={14} sw={2.5} /> {isEdit ? "Guardar cambios" : "Agregar vendedor"}
          </button>
        </div>
      </div>
    </div>
  );
}

window.Vendedores = Vendedores;
