// Shared top navigation bar

const navStyles = {
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
  navLogo: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" },
  logoMark: {
    width: 32, height: 32, borderRadius: 8,
    background: "white",
    color: "var(--navy-900)",
    display: "grid", placeItems: "center",
    fontWeight: 700, fontSize: 14,
  },
  navLinks: { display: "flex", alignItems: "center", gap: 4, marginLeft: 18 },
  navLink: (active) => ({
    padding: "8px 14px",
    borderRadius: 8,
    fontSize: 14, fontWeight: 500,
    color: active ? "white" : "oklch(0.80 0.04 240)",
    background: active ? "oklch(1 0 0 / 0.10)" : "transparent",
    cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 8,
    border: 0,
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
    fontSize: 11, padding: "2px 6px", borderRadius: 4,
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
    cursor: "pointer",
  },

  dropdownWrap: {
    position: "absolute",
    top: "100%", left: 0,
    paddingTop: 6,
    zIndex: 30,
  },
  dropdown: {
    minWidth: 260,
    background: "var(--paper)",
    border: "1px solid var(--line)",
    borderRadius: 12,
    boxShadow: "var(--shadow-lg)",
    padding: 6,
  },
  dropTitle: {
    fontSize: 11, fontWeight: 600,
    color: "var(--ink-500)",
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    padding: "8px 10px 6px",
  },
  dropItem: {
    width: "100%",
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 10px",
    borderRadius: 9,
    background: "transparent",
    border: 0, cursor: "pointer",
    textAlign: "left",
  },
  dropIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: "var(--blue-100)",
    color: "var(--navy-900)",
    display: "grid", placeItems: "center",
  },
};

function nbReadAnul() {
  try { return JSON.parse(localStorage.getItem("amr_anulaciones") || "[]"); } catch(e) { return []; }
}
function nbWriteAnul(list) { localStorage.setItem("amr_anulaciones", JSON.stringify(list)); }
function nbAplicarAnul(req) {
  try {
    const ap = JSON.parse(localStorage.getItem("amr_anulaciones_aplicadas") || "[]");
    ap.push({ poliza: req.poliza, cuotaN: req.cuotaN });
    localStorage.setItem("amr_anulaciones_aplicadas", JSON.stringify(ap));
  } catch(e) {}
}

function Navbar({ active, onNavigate, onLogout, search, setSearch, searchResults, onViewFicha, onCargarBaja }) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [userOpen, setUserOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [companiasOpen, setCompaniasOpen] = React.useState(false);
  const [notifs, setNotifs] = React.useState(() => nbReadAnul());
  const editRef = React.useRef(null);
  const userRef = React.useRef(null);
  const notifRef = React.useRef(null);

  const session = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("amr_session")) || { role: "am", nombre: "AM", email: "alejandro@amrseguros.com.ar" }; }
    catch(e) { return { role: "am", nombre: "AM", email: "alejandro@amrseguros.com.ar" }; }
  }, []);

  const isAM = session.role !== "vendedor";
  const initials = session.role === "vendedor"
    ? session.nombre.split(" ").map(p => p[0]).slice(0, 2).join("")
    : "AM";

  React.useEffect(() => {
    const h = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  const pendNotifs = notifs.filter(n => n.estado === "pendiente");
  const resolverAnul = (id, aprobar) => {
    const list = nbReadAnul();
    const idx = list.findIndex(n => n.id === id);
    if (idx >= 0) {
      if (aprobar) nbAplicarAnul(list[idx]);
      list[idx] = { ...list[idx], estado: aprobar ? "aprobada" : "rechazada" };
      nbWriteAnul(list);
      setNotifs(list);
    }
  };

  return (
    <header style={navStyles.nav}>
      <div style={navStyles.navInner}>
        <div style={navStyles.navLogo} onClick={() => onNavigate?.("dashboard")}>
          <div style={navStyles.logoMark}>A</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>AMR</span>
            <span style={{ fontSize: 10.5, color: "oklch(0.78 0.04 240)", letterSpacing: "0.04em" }}>
              PROD. DE SEGUROS
            </span>
          </div>
        </div>

        <nav style={navStyles.navLinks}>
          <button style={navStyles.navLink(active === "cartera")}
                  onClick={() => onNavigate?.("dashboard")}>
            <IconShield size={15} /> Cartera
          </button>
          <button style={navStyles.navLink(active === "nueva")}
                  onClick={() => onNavigate?.("nueva")}>
            <IconPlus size={15} /> Nueva póliza
          </button>
          <div ref={editRef}
               onMouseEnter={() => setEditOpen(true)}
               onMouseLeave={() => setEditOpen(false)}
               style={{ position: "relative", paddingBottom: 6, marginBottom: -6 }}>
            <button style={navStyles.navLink(active === "editar")}>
              <Icon size={14} d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
              Editar <IconChevD size={12} />
            </button>
            {editOpen && (
              <div style={navStyles.dropdownWrap}>
                <div style={navStyles.dropdown}>
                  <div style={navStyles.dropTitle}>Editar</div>
                  {[
                    { k: "asegurado", l: "Asegurado",  s: "Buscar por DNI",     icon: <IconUser size={15} /> },
                    { k: "vehiculo",  l: "Vehículo",   s: "Buscar por patente", icon: <IconCar size={15} /> },
                    { k: "cobertura", l: "Cobertura",  s: "Buscar por póliza",  icon: <IconShield size={15} /> },
                  ].map(o => (
                    <button key={o.k}
                            style={navStyles.dropItem}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--blue-50)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                            onClick={() => { setEditOpen(false); onNavigate?.("editar-" + o.k); }}>
                      <span style={navStyles.dropIcon}>{o.icon}</span>
                      <span style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-900)" }}>{o.l}</div>
                        <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 1 }}>{o.s}</div>
                      </span>
                      <IconChevR size={13} style={{ color: "var(--ink-400)" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button style={navStyles.navLink(active === "cobranzas")}
                  onClick={() => onNavigate?.("cobranzas")}>
            Cobranzas
          </button>
          <button style={navStyles.navLink(active === "bajas")}
                  onClick={() => onNavigate?.("bajas")}>
            Bajas
          </button>
          <button style={navStyles.navLink(active === "reportes")}
                  onClick={() => onNavigate?.("reportes")}>
            Reportes <IconChevD size={13} />
          </button>
          {companiasOpen && <CompaniasModal onClose={() => setCompaniasOpen(false)} />}
    </nav>

        <div style={{ position: "relative", marginLeft: "auto" }}>
          <div style={{ ...navStyles.search, marginLeft: 0 }}>
            <IconSearch size={16} style={{ color: "oklch(0.78 0.04 240)" }} />
            <input
              style={navStyles.searchInput}
              placeholder="Buscar cliente, póliza o patente…"
              value={search ?? ""}
              onChange={(e) => setSearch?.(e.target.value)}
            />
            <span style={navStyles.kbd}>⌘K</span>
          </div>

          {searchResults && searchResults.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 460,
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              boxShadow: "var(--shadow-lg)",
              padding: 4,
              zIndex: 40,
              maxHeight: 360, overflowY: "auto"
            }}>
              <div style={{ padding: "8px 12px 4px", fontSize: 11, fontWeight: 600, color: "var(--ink-500)", letterSpacing: "0.10em", textTransform: "uppercase" }}>
                {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""}
              </div>
              {searchResults.map((r, i) => (
                <div key={i}
                  style={{ padding: "10px 10px", borderRadius: 9, display: "flex", alignItems: "center", gap: 10 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "oklch(0.97 0.008 245)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: r.coColor, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14, color: "var(--ink-900)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.cli}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 1 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}>{r.pol}</span>
                      {" · "}{r.ramo}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999, flexShrink: 0,
                    background: r.est === "vigente" ? "var(--ok-100)" : r.est === "porvencer" ? "var(--warn-100)" : "var(--bad-100)",
                    color: r.est === "vigente" ? "var(--ok-700)" : r.est === "porvencer" ? "var(--warn-700)" : "var(--bad-700)",
                  }}>
                    {r.est === "vigente" ? "Vigente" : r.est === "porvencer" ? "Por vencer" : "Vencida"}
                  </span>
                  <button
                    onClick={() => onViewFicha?.(r.pol)}
                    style={{
                      height: 30, padding: "0 11px", borderRadius: 7,
                      border: "1px solid var(--line)",
                      background: "var(--paper)", color: "var(--ink-700)",
                      fontSize: 12.5, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0
                    }}>
                    Ver ficha
                  </button>
                  <button
                    onClick={() => onCargarBaja?.(r.pol)}
                    style={{
                      height: 30, padding: "0 11px", borderRadius: 7,
                      border: "1px solid oklch(0.85 0.08 28)",
                      background: "var(--bad-100)", color: "var(--bad-700)",
                      fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0
                    }}>
                    Baja
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notificaciones */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button style={navStyles.iconBtnNav} title="Notificaciones"
            onClick={() => { setNotifs(nbReadAnul()); setNotifOpen(o => !o); }}>
            <IconBell size={18} />
            {isAM && pendNotifs.length > 0 && (
              <span style={{ position: "absolute", top: 6, right: 6, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "var(--bad-500)", color: "white", fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center", border: "2px solid var(--navy-950)" }}>
                {pendNotifs.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 40 }}>
              <div style={{ ...navStyles.dropdown, minWidth: 340, maxWidth: 360 }}>
                <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid var(--line-2)", marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)" }}>Notificaciones</span>
                  {isAM && pendNotifs.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--bad-700)", background: "var(--bad-100)", padding: "2px 8px", borderRadius: 999 }}>{pendNotifs.length} pendiente{pendNotifs.length !== 1 ? "s" : ""}</span>
                  )}
                </div>
                {!isAM ? (
                  <div style={{ padding: "22px 14px", textAlign: "center", color: "var(--ink-500)", fontSize: 13 }}>
                    No tenés notificaciones nuevas.
                  </div>
                ) : pendNotifs.length === 0 ? (
                  <div style={{ padding: "22px 14px", textAlign: "center", color: "var(--ink-500)", fontSize: 13 }}>
                    Sin solicitudes pendientes.
                  </div>
                ) : (
                  <div style={{ maxHeight: 380, overflowY: "auto" }}>
                    {pendNotifs.map(n => (
                      <div key={n.id} style={{ padding: "10px 12px", borderBottom: "1px solid var(--line-2)" }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--bad-100)", color: "var(--bad-700)", display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>
                            <Icon size={15} d={<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4m0 4v.01"/></>} />
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>Solicitud de anulación</div>
                            <div style={{ fontSize: 12, color: "var(--ink-600)", marginTop: 2 }}>
                              {n.solicitante} solicita anular la <strong>cuota {n.cuotaN}</strong> de {n.cliente}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                              {n.poliza} · $ {Number(n.monto).toLocaleString("es-AR")}
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                              <button onClick={() => resolverAnul(n.id, true)}
                                style={{ flex: 1, height: 32, borderRadius: 8, border: 0, background: "var(--ok-700)", color: "white", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                                Aceptar baja
                              </button>
                              <button onClick={() => resolverAnul(n.id, false)}
                                style={{ flex: 1, height: 32, borderRadius: 8, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                                Rechazar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div ref={userRef} style={{ position: "relative" }}>
          <button
            style={{ ...navStyles.avatar, background: isAM ? "linear-gradient(135deg, var(--blue-500), oklch(0.50 0.16 200))" : "linear-gradient(135deg, oklch(0.52 0.14 60), oklch(0.45 0.13 30))" }}
            title={session.nombre}
            onClick={() => setUserOpen(o => !o)}>
            {initials}
          </button>
          {userOpen && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 40 }}>
              <div style={{ ...navStyles.dropdown, minWidth: 240 }}>
                {/* User info */}
                <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid var(--line-2)", marginBottom: 4 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)" }}>{session.nombre}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>{session.email}</div>
                  <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: isAM ? "var(--blue-100)" : "oklch(0.95 0.04 60)",
                    color: isAM ? "var(--navy-900)" : "oklch(0.42 0.10 55)" }}>
                    {isAM ? "Usuario AM" : "Vendedor"}
                  </div>
                </div>
                {isAM && (
                  <button style={navStyles.dropItem}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--blue-50)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => { setUserOpen(false); onNavigate?.("vendedores"); }}>
                    <span style={{ ...navStyles.dropIcon, background: "var(--blue-100)" }}>
                      <Icon size={15} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>} />
                    </span>
                    <span style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-900)" }}>Gestionar vendedores</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 1 }}>Agregar y editar accesos</div>
                    </span>
                  </button>
                )}
                {isAM && (
                  <button style={navStyles.dropItem}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--blue-50)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => { setUserOpen(false); setCompaniasOpen(true); }}>
                    <span style={{ ...navStyles.dropIcon, background: "var(--blue-100)" }}>
                      <Icon size={15} d={<><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></>} />
                    </span>
                    <span style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-900)" }}>Compañías aseguradoras</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 1 }}>Agregar y administrar</div>
                    </span>
                  </button>
                )}
                <div style={{ borderTop: "1px solid var(--line-2)", margin: "4px 0" }} />
                <button style={{ ...navStyles.dropItem }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bad-100)"; e.currentTarget.querySelector("span").style.color = "var(--bad-700)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.querySelector("span").style.color = "var(--ink-700)"; }}
                  onClick={() => { setUserOpen(false); onLogout?.(); }}>
                  <span style={{ ...navStyles.dropIcon, background: "oklch(0.96 0.02 30)" }}>
                    <Icon size={15} d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>} style={{ color: "var(--bad-600)" }} />
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-700)", transition: "color .1s" }}>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

window.Navbar = Navbar;
