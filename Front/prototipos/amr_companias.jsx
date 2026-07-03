// AMR — Modal de administración de compañías.
// Los helpers (getCompanias/addCompania/removeCompania/coAt) viven en un <script>
// plano en el <head> para estar disponibles antes que cualquier script Babel.

/* ───────────────── Modal de administración ───────────────── */

function CompaniasModal({ onClose }) {
  const [list, setList] = React.useState(() => getCompanias());
  const [nuevo, setNuevo] = React.useState("");
  const [focus, setFocus] = React.useState(false);
  const [confirmDel, setConfirmDel] = React.useState(null);
  const [dirty, setDirty] = React.useState(false);
  const inputRef = React.useRef(null);

  const agregar = () => {
    const clean = nuevo.trim();
    if (!clean) return;
    if (list.some(c => c.n.toLowerCase() === clean.toLowerCase())) {
      setNuevo("");
      return;
    }
    setList(addCompania(clean));
    setNuevo("");
    setDirty(true);
    inputRef.current && inputRef.current.focus();
  };

  const quitar = (name) => {
    setList(removeCompania(name));
    setConfirmDel(null);
    setDirty(true);
  };

  const cerrar = () => {
    if (dirty) { window.location.reload(); return; }
    onClose();
  };

  return (
    <div onClick={cerrar} style={cmStyles.back}>
      <div onClick={e => e.stopPropagation()} style={cmStyles.modal}>
        {/* Header */}
        <div style={cmStyles.head}>
          <div>
            <div style={cmStyles.kicker}>Configuración</div>
            <div style={cmStyles.title}>Compañías aseguradoras</div>
            <div style={cmStyles.sub}>Las que tu agencia opera. Aparecen al cargar pólizas, bajas y cobranzas.</div>
          </div>
          <button onClick={cerrar} style={cmStyles.close}>
            <IconClose size={16} />
          </button>
        </div>

        {/* Agregar */}
        <div style={{ padding: "18px 24px 6px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Agregar compañía
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ ...cmStyles.inputWrap, ...(focus ? cmStyles.inputWrapFocus : {}) }}>
              <Icon size={16} d={<><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></>} style={{ color: "var(--ink-400)" }} />
              <input
                ref={inputRef}
                value={nuevo}
                onChange={e => setNuevo(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") agregar(); }}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                placeholder="Nombre de la compañía"
                style={cmStyles.input}
              />
            </div>
            <button onClick={agregar} disabled={!nuevo.trim()} style={{ ...cmStyles.addBtn, opacity: nuevo.trim() ? 1 : 0.5, cursor: nuevo.trim() ? "pointer" : "default" }}>
              <Icon size={15} d={<><path d="M12 5v14M5 12h14"/></>} /> Agregar
            </button>
          </div>
        </div>

        {/* Lista */}
        <div style={{ padding: "14px 24px 8px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
            <span>Compañías activas</span>
            <span style={{ color: "var(--ink-400)" }}>{list.length}</span>
          </div>
          <div style={cmStyles.listBox}>
            {list.map((c) => (
              <div key={c.n} style={cmStyles.row}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: c.c, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--ink-900)" }}>{c.n}</span>
                {confirmDel === c.n ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--ink-500)" }}>¿Quitar?</span>
                    <button onClick={() => quitar(c.n)} style={cmStyles.delYes}>Sí</button>
                    <button onClick={() => setConfirmDel(null)} style={cmStyles.delNo}>No</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDel(c.n)} title="Quitar" style={cmStyles.delBtn}>
                    <Icon size={15} d={<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></>} />
                  </button>
                )}
              </div>
            ))}
            {list.length === 0 && (
              <div style={{ padding: "28px 0", textAlign: "center", color: "var(--ink-400)", fontSize: 13 }}>
                No hay compañías cargadas.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={cmStyles.foot}>
          <span style={{ fontSize: 12, color: "var(--ink-500)" }}>
            {dirty ? "Se aplicará al cerrar" : "Los cambios se guardan automáticamente"}
          </span>
          <button onClick={cerrar} style={cmStyles.doneBtn}>
            {dirty ? "Aplicar y cerrar" : "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const cmStyles = {
  back: { position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.50)", backdropFilter: "blur(5px)", zIndex: 60, display: "grid", placeItems: "center", padding: 24 },
  modal: { width: 540, maxWidth: "100%", maxHeight: "calc(100vh - 48px)", background: "var(--paper)", borderRadius: 16, boxShadow: "var(--shadow-lg)", overflow: "hidden", display: "flex", flexDirection: "column" },
  head: { padding: "20px 24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, borderBottom: "1px solid var(--line-2)" },
  kicker: { fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--blue-600)", marginBottom: 5 },
  title: { fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink-900)" },
  sub: { fontSize: 13, color: "var(--ink-500)", marginTop: 4, maxWidth: 400 },
  close: { width: 36, height: 36, borderRadius: 9, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-500)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 },
  inputWrap: { flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", height: 44, border: "1.5px solid var(--line)", borderRadius: 11, background: "var(--paper)", transition: "all .12s" },
  inputWrapFocus: { borderColor: "var(--blue-500)", boxShadow: "0 0 0 4px oklch(0.62 0.16 243 / 0.12)" },
  input: { flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14, color: "var(--ink-900)" },
  addBtn: { height: 44, padding: "0 18px", borderRadius: 11, background: "var(--navy-900)", color: "white", border: 0, fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7 },
  listBox: { border: "1px solid var(--line-2)", borderRadius: 12, overflow: "hidden", overflowY: "auto", maxHeight: 280 },
  row: { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: "1px solid var(--line-2)" },
  delBtn: { width: 30, height: 30, borderRadius: 7, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-400)", cursor: "pointer", display: "grid", placeItems: "center" },
  delYes: { height: 28, padding: "0 11px", borderRadius: 7, border: 0, background: "var(--bad-600)", color: "white", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  delNo: { height: 28, padding: "0 11px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" },
  foot: { marginTop: "auto", padding: "14px 24px", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", display: "flex", alignItems: "center", justifyContent: "space-between" },
  doneBtn: { height: 38, padding: "0 18px", borderRadius: 9, border: 0, background: "var(--navy-900)", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer" },
};

window.CompaniasModal = CompaniasModal;
