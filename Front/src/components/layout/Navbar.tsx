import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { getToken } from "../../security/axiosInstance";
import { useIsMobile } from "../../hooks/useMediaQuery";
import {
  IconSearch, IconLogout, IconLock, IconShield, IconPlus, IconUsers, IconBuilding,
  IconChevronD, IconEdit, IconCar, IconFile, IconMail, IconBan, IconEye, IconDownload,
} from "../Icons";
import CambiarPasswordModal from "../usuarios/CambiarPasswordModal";
import NotificacionesBell from "../NotificacionesBell";
import SearchModal from "../SearchModal";

interface Item { to: string; label: string; icon?: ReactNode; end?: boolean }

const itemsA: Item[] = [
  { to: "/cartera", label: "Cartera", icon: <IconShield size={15} />, end: true },
  { to: "/alta", label: "Nueva póliza", icon: <IconPlus size={15} /> },
];
const itemsB: Item[] = [
  { to: "/cobranzas", label: "Cobranzas", icon: <IconDownload size={15} /> },
  { to: "/bajas", label: "Bajas", icon: <IconBan size={15} /> },
  { to: "/reportes", label: "Reportes", icon: <IconEye size={15} /> },
];
const editarOpciones = [
  { to: "/editar/asegurado", label: "Asegurado", sub: "Buscar por DNI", icon: <IconUsers size={15} /> },
  { to: "/editar/vehiculo", label: "Vehículo", sub: "Buscar por patente", icon: <IconCar size={15} /> },
  { to: "/editar/cobertura", label: "Cobertura", sub: "Buscar por póliza", icon: <IconFile size={15} /> },
];

function emailDelToken(): string {
  const t = getToken();
  if (!t) return "";
  try {
    return JSON.parse(atob(t.split(".")[1])).email ?? "";
  } catch {
    return "";
  }
}

export default function Navbar() {
  const { usuario, esAdmin, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [buscar, setBuscar] = useState(false);
  const [cambiarPass, setCambiarPass] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null);

  const mobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const email = emailDelToken();
  const initials = (usuario?.nombre ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  // Cierra el drawer al pasar a desktop o al navegar
  useEffect(() => { if (!mobile) setMenuOpen(false); }, [mobile]);
  function irA(to: string) { setMenuOpen(false); navigate(to); }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setBuscar(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (editRef.current && !editRef.current.contains(e.target as Node)) setEditOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  async function salir() {
    await cerrarSesion();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header style={nav}>
        <div style={navInner}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/cartera")}>
            <img src="/logo.png" alt="AMR" style={logoMark} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>AMR</span>
              <span style={{ fontSize: 10.5, color: "oklch(0.78 0.04 240)", letterSpacing: "0.04em" }}>PROD. DE SEGUROS</span>
            </div>
          </div>

          {/* ---------- Desktop ---------- */}
          {!mobile && (<>
          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 18 }}>
            {itemsA.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} style={({ isActive }) => navLink(isActive)}>
                {i.icon}{i.label}
              </NavLink>
            ))}

            {/* Editar ▾ */}
            <div ref={editRef} style={{ position: "relative" }}>
              <button style={{ ...navLink(window.location.pathname.startsWith("/editar")), cursor: "pointer" }} onClick={() => setEditOpen((o) => !o)}>
                <IconEdit size={14} /> Editar <IconChevronD size={13} />
              </button>
              {editOpen && (
                <div style={dropWrap}>
                  <div style={dropdown}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)", letterSpacing: "0.10em", textTransform: "uppercase", padding: "8px 10px 6px" }}>Editar</div>
                    {editarOpciones.map((o) => (
                      <DropItem key={o.to} icon={o.icon} titulo={o.label} sub={o.sub} onClick={() => { setEditOpen(false); navigate(o.to); }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {itemsB.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} style={({ isActive }) => navLink(isActive)}>
                {i.icon}{i.label}
              </NavLink>
            ))}
          </nav>

          {/* Buscador embebido (abre el command-palette) */}
          <button style={search} onClick={() => setBuscar(true)} title="Buscar (⌘K)">
            <IconSearch size={16} style={{ color: "oklch(0.78 0.04 240)" }} />
            <span style={{ flex: 1, textAlign: "left", color: "oklch(0.80 0.03 240)" }}>Buscar cliente, póliza o patente…</span>
            <span className="mono" style={kbd}>⌘K</span>
          </button>

          <NotificacionesBell />

          {/* Avatar + menú */}
          <div ref={userRef} style={{ position: "relative" }}>
            <button style={avatar} title={usuario?.nombre} onClick={() => setUserOpen((o) => !o)}>{initials}</button>
            {userOpen && (
              <div style={dropWrap}>
                <div style={dropdown}>
                  <div style={{ padding: "10px 12px 10px", borderBottom: "1px solid var(--line-2)", marginBottom: 4 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)" }}>{usuario?.nombre}</div>
                    {email && <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>{email}</div>}
                    <div style={{ marginTop: 6, display: "inline-flex", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: "var(--blue-100)", color: "var(--navy-900)" }}>
                      {usuario?.rol}
                    </div>
                  </div>

                  {esAdmin && (
                    <DropItem icon={<IconUsers size={15} />} titulo="Gestionar vendedores" sub="Usuarios y autorizaciones"
                      onClick={() => { setUserOpen(false); navigate("/usuarios"); }} />
                  )}
                  {esAdmin && (
                    <DropItem icon={<IconBuilding size={15} />} titulo="Compañías y métodos" sub="Catálogos del sistema"
                      onClick={() => { setUserOpen(false); navigate("/companias"); }} />
                  )}
                  {esAdmin && (
                    <DropItem icon={<IconBan size={15} />} titulo="Registro de movimientos" sub="Eliminaciones y anulaciones"
                      onClick={() => { setUserOpen(false); navigate("/registro"); }} />
                  )}
                  <DropItem icon={<IconMail size={15} />} titulo="Configuración de envío" sub="Tu correo y WhatsApp"
                    onClick={() => { setUserOpen(false); navigate("/configuracion"); }} />
                  <DropItem icon={<IconFile size={15} />} titulo="Mis finanzas" sub="Ingresos y egresos (privado)"
                    onClick={() => { setUserOpen(false); navigate("/finanzas"); }} />
                  <DropItem icon={<IconLock size={15} />} titulo="Cambiar mi contraseña"
                    onClick={() => { setUserOpen(false); setCambiarPass(true); }} />

                  <div style={{ borderTop: "1px solid var(--line-2)", margin: "4px 0" }} />
                  <button style={dropItem} onClick={() => { setUserOpen(false); salir(); }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bad-100)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ ...dropIcon, background: "oklch(0.96 0.02 30)", color: "var(--bad-600)" }}><IconLogout size={15} /></span>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-700)" }}>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          </>)}

          {/* ---------- Móvil: buscar + campana + hamburguesa ---------- */}
          {mobile && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
              <button style={iconBtn} onClick={() => setBuscar(true)} title="Buscar" aria-label="Buscar">
                <IconSearch size={20} />
              </button>
              <NotificacionesBell />
              <button style={iconBtn} onClick={() => setMenuOpen((o) => !o)} aria-label="Menú" aria-expanded={menuOpen}>
                {menuOpen
                  ? <span style={{ fontSize: 22, lineHeight: 1 }}>✕</span>
                  : <span style={{ display: "grid", gap: 4 }}><i style={burgerLine} /><i style={burgerLine} /><i style={burgerLine} /></span>}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ---------- Drawer móvil ---------- */}
      {mobile && menuOpen && (
        <>
          <div style={drawerBackdrop} onClick={() => setMenuOpen(false)} />
          <aside style={drawer}>
            <div style={drawerUser}>
              <div style={{ ...avatar, width: 40, height: 40 }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{usuario?.nombre}</div>
                {email && <div style={{ fontSize: 11.5, color: "oklch(0.80 0.03 240)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>}
              </div>
              <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 600, background: "oklch(1 0 0 / 0.14)", color: "white" }}>{usuario?.rol}</span>
            </div>

            <nav style={{ padding: 8, overflowY: "auto", flex: 1 }}>
              {[...itemsA, ...itemsB].map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end} onClick={() => setMenuOpen(false)}
                  style={({ isActive }) => drawerLink(isActive)}>
                  {i.icon}{i.label}
                </NavLink>
              ))}

              <div style={drawerLabel}>Editar</div>
              {editarOpciones.map((o) => (
                <button key={o.to} style={drawerLink(false)} onClick={() => irA(o.to)}>
                  {o.icon}{o.label}
                </button>
              ))}

              {esAdmin && (<>
                <div style={drawerLabel}>Administración</div>
                <button style={drawerLink(false)} onClick={() => irA("/usuarios")}><IconUsers size={16} />Vendedores</button>
                <button style={drawerLink(false)} onClick={() => irA("/companias")}><IconBuilding size={16} />Compañías y métodos</button>
                <button style={drawerLink(false)} onClick={() => irA("/registro")}><IconBan size={16} />Registro de movimientos</button>
              </>)}

              <div style={drawerLabel}>Cuenta</div>
              <button style={drawerLink(false)} onClick={() => irA("/configuracion")}><IconMail size={16} />Configuración de envío</button>
              <button style={drawerLink(false)} onClick={() => irA("/finanzas")}><IconFile size={16} />Mis finanzas</button>
              <button style={drawerLink(false)} onClick={() => { setMenuOpen(false); setCambiarPass(true); }}><IconLock size={16} />Cambiar contraseña</button>
              <button style={{ ...drawerLink(false), color: "oklch(0.80 0.13 28)" }} onClick={() => { setMenuOpen(false); salir(); }}>
                <IconLogout size={16} />Cerrar sesión
              </button>
            </nav>
          </aside>
        </>
      )}

      {cambiarPass && <CambiarPasswordModal onClose={() => setCambiarPass(false)} />}
      {buscar && <SearchModal onClose={() => setBuscar(false)} />}
    </>
  );
}

function DropItem({ icon, titulo, sub, onClick }: { icon: ReactNode; titulo: string; sub?: string; onClick: () => void }) {
  return (
    <button style={dropItem} onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--blue-50)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      <span style={dropIcon}>{icon}</span>
      <span style={{ flex: 1, textAlign: "left" }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-900)" }}>{titulo}</div>
        {sub && <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 1 }}>{sub}</div>}
      </span>
    </button>
  );
}

const nav: CSSProperties = {
  position: "sticky", top: 0, zIndex: 20,
  background: "var(--navy-950)", color: "white",
  borderBottom: "1px solid oklch(1 0 0 / 0.08)",
};
const navInner: CSSProperties = {
  maxWidth: 1440, margin: "0 auto", padding: "0 clamp(14px, 4vw, 28px)", height: 64,
  display: "flex", alignItems: "center", gap: 18,
};
// Logo original en blanco (se funde con el navbar navy)
const logoMark: CSSProperties = {
  height: 34, width: "auto", filter: "brightness(0) invert(1)",
};

// ── Móvil ──
const iconBtn: CSSProperties = {
  width: 40, height: 40, borderRadius: 10, border: 0, background: "transparent",
  color: "white", display: "grid", placeItems: "center", cursor: "pointer",
};
const burgerLine: CSSProperties = { display: "block", width: 20, height: 2, borderRadius: 2, background: "white" };
const drawerBackdrop: CSSProperties = {
  position: "fixed", inset: 0, top: 64, background: "oklch(0.18 0.06 252 / 0.45)",
  backdropFilter: "blur(2px)", zIndex: 30,
};
const drawer: CSSProperties = {
  position: "fixed", top: 64, right: 0, bottom: 0, width: "min(84vw, 320px)", zIndex: 31,
  background: "var(--navy-950)", borderLeft: "1px solid oklch(1 0 0 / 0.08)",
  display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)",
};
const drawerUser: CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
  borderBottom: "1px solid oklch(1 0 0 / 0.08)",
};
const drawerLabel: CSSProperties = {
  fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
  color: "oklch(0.70 0.05 240)", padding: "14px 12px 6px",
};
function drawerLink(active: boolean): CSSProperties {
  return {
    width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px",
    borderRadius: 10, border: 0, cursor: "pointer", textAlign: "left",
    fontSize: 15, fontWeight: 500, textDecoration: "none",
    color: active ? "white" : "oklch(0.82 0.04 240)",
    background: active ? "oklch(1 0 0 / 0.10)" : "transparent",
  };
}
function navLink(active: boolean): CSSProperties {
  return {
    padding: "8px 14px", borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none",
    color: active ? "white" : "oklch(0.80 0.04 240)",
    background: active ? "oklch(1 0 0 / 0.10)" : "transparent",
    display: "inline-flex", alignItems: "center", gap: 8,
  };
}
const search: CSSProperties = {
  marginLeft: "auto", display: "flex", alignItems: "center", gap: 10,
  background: "oklch(1 0 0 / 0.08)", borderRadius: 10, padding: "0 12px", height: 40, width: 340,
  border: "1px solid oklch(1 0 0 / 0.10)", cursor: "pointer", fontSize: 14,
};
const kbd: CSSProperties = {
  fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "oklch(1 0 0 / 0.10)",
  color: "oklch(0.85 0.03 240)", border: "1px solid oklch(1 0 0 / 0.10)",
};
const avatar: CSSProperties = {
  width: 36, height: 36, borderRadius: "50%",
  background: "linear-gradient(135deg, var(--blue-500), oklch(0.50 0.16 200))",
  color: "white", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600,
  border: "2px solid oklch(1 0 0 / 0.10)", cursor: "pointer",
};
const dropWrap: CSSProperties = { position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 40 };
const dropdown: CSSProperties = {
  minWidth: 256, background: "var(--paper)", border: "1px solid var(--line)",
  borderRadius: 12, boxShadow: "var(--shadow-lg)", padding: 6,
};
const dropItem: CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px",
  borderRadius: 9, background: "transparent", border: 0, cursor: "pointer", textAlign: "left",
};
const dropIcon: CSSProperties = {
  width: 32, height: 32, borderRadius: 8, background: "var(--blue-100)", color: "var(--navy-900)",
  display: "grid", placeItems: "center", flexShrink: 0,
};
