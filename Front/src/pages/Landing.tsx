// Landing pública de AMR Producción de Seguros.
// Secciones: Inicio (hero) · Contáctanos · Trabajá con nosotros. Contacto por correo o WhatsApp.
// Respeta la paleta del portal (variables de index.css: navy / blue / ink).
import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────
//  Datos de contacto — EDITÁ estos valores con los reales de AMR.
// ─────────────────────────────────────────────────────────────
const EMAIL = "amrinaliprogseg@gmail.com";
const WHATSAPP = "5492617025624";          // sólo números, con código de país (54 9 …)
const WHATSAPP_LINDO = "+54 9 261 702-5624"; // cómo se muestra en pantalla

const mailtoContacto = `mailto:${EMAIL}?subject=${encodeURIComponent("Consulta desde la web")}`;
const waContacto = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola AMR, quisiera hacer una consulta.")}`;
const mailtoCV = `mailto:${EMAIL}?subject=${encodeURIComponent("Trabajá con nosotros — Envío de CV")}&body=${encodeURIComponent("Hola AMR, quisiera sumarme al equipo. Adjunto mi CV.")}`;
const waCV = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola AMR, quisiera sumarme al equipo comercial.")}`;

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Landing() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  return (
    <div style={page}>
      {/* ── Navbar ── */}
      <header style={nav}>
        <div style={navInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => scrollTo("inicio")}>
            <img src="/logo.png" alt="AMR" style={{ height: 38, width: "auto" }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>AMR</span>
              <span style={{ fontSize: 10, color: "var(--blue-300)", letterSpacing: "0.06em" }}>PRODUCCIÓN DE SEGUROS</span>
            </div>
          </div>

          <nav style={navLinks(menu)}>
            <button style={navLink} onClick={() => { scrollTo("inicio"); setMenu(false); }}>Inicio</button>
            <button style={navLink} onClick={() => { scrollTo("contacto"); setMenu(false); }}>Contáctanos</button>
            <button style={navLink} onClick={() => { scrollTo("trabaja"); setMenu(false); }}>Trabajá con nosotros</button>
            <button style={ingresarBtn} onClick={() => navigate("/login")}>Ingresar al portal</button>
          </nav>

          <button style={burger} onClick={() => setMenu((m) => !m)} aria-label="Menú">☰</button>
        </div>
      </header>

      {/* ── Hero / Inicio ── */}
      <section id="inicio" style={hero}>
        <div style={heroInner}>
          <div style={{ maxWidth: 620 }}>
            <span style={pill}>Asesores en seguros · Argentina</span>
            <h1 style={h1}>Protegé lo que más te importa, con el respaldo de AMR.</h1>
            <p style={heroSub}>
              Somos productores de seguros. Te asesoramos para elegir la mejor cobertura para tu auto,
              hogar o comercio — con atención personalizada y gestión ágil de tus pólizas y cobranzas.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
              <button style={ctaPrimary} onClick={() => scrollTo("contacto")}>Contactanos</button>
              <a style={ctaWhats} href={waContacto} target="_blank" rel="noopener noreferrer">
                <WhatsIcon /> Escribinos por WhatsApp
              </a>
            </div>
          </div>
          <div style={heroCardWrap}>
            <div style={heroCard}>
              <img src="/logo.png" alt="AMR" style={{ width: 120, height: "auto", margin: "0 auto 18px", display: "block", filter: "drop-shadow(0 8px 24px oklch(0.18 0.06 252 / 0.35))" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "white" }}>Gestión integral</div>
                <div style={{ fontSize: 13, color: "var(--blue-300)", marginTop: 4 }}>Pólizas · Cobranzas · Renovaciones</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Servicios ── */}
      <section style={{ ...band, background: "var(--paper)" }}>
        <div style={container}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={kicker}>Nuestros servicios</div>
            <h2 style={h2}>Coberturas para cada necesidad</h2>
          </div>
          <div style={cards}>
            {SERVICIOS.map((s) => (
              <div key={s.t} style={card}>
                <div style={cardIcon}>{s.i}</div>
                <div style={{ fontWeight: 600, fontSize: 16, color: "var(--ink-900)" }}>{s.t}</div>
                <div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 6, lineHeight: 1.5 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contáctanos ── */}
      <section id="contacto" style={{ ...band, background: "var(--canvas)" }}>
        <div style={container}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={kicker}>Contáctanos</div>
            <h2 style={h2}>Estamos para ayudarte</h2>
            <p style={{ color: "var(--ink-500)", fontSize: 15, marginTop: 8 }}>
              Escribinos por el medio que prefieras y te respondemos a la brevedad.
            </p>
          </div>
          <div style={contactGrid}>
            <a href={mailtoContacto} style={contactCard}>
              <div style={{ ...contactIcon, background: "var(--blue-100)", color: "var(--blue-600)" }}><MailIcon /></div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>Correo electrónico</div>
                <div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 2 }}>{EMAIL}</div>
              </div>
            </a>
            <a href={waContacto} target="_blank" rel="noopener noreferrer" style={contactCard}>
              <div style={{ ...contactIcon, background: "var(--ok-100)", color: "var(--ok-700)" }}><WhatsIcon /></div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--ink-900)" }}>WhatsApp</div>
                <div style={{ fontSize: 13.5, color: "var(--ink-500)", marginTop: 2 }}>{WHATSAPP_LINDO}</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── Trabajá con nosotros ── */}
      <section id="trabaja" style={trabajaBand}>
        <div style={{ ...container, textAlign: "center" }}>
          <div style={{ ...kicker, color: "var(--blue-300)" }}>Sumate al equipo</div>
          <h2 style={{ ...h2, color: "white" }}>Trabajá con nosotros</h2>
          <p style={{ color: "var(--blue-300)", fontSize: 15.5, maxWidth: 620, margin: "10px auto 0", lineHeight: 1.6 }}>
            ¿Te apasionan las ventas y la atención al cliente? Buscamos productores y asesores para seguir
            creciendo. Envianos tu CV y contanos por qué querés ser parte de AMR.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
            <a style={ctaPrimary} href={mailtoCV}>Enviar CV por correo</a>
            <a style={ctaWhats} href={waCV} target="_blank" rel="noopener noreferrer"><WhatsIcon /> Postularme por WhatsApp</a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={footer}>
        <div style={container}>
          <div style={footTop}>
            {/* Marca */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <img src="/logo.png" alt="AMR" style={{ height: 34 }} />
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>AMR</span>
                  <span style={{ fontSize: 9.5, color: "var(--blue-300)", letterSpacing: "0.06em" }}>PRODUCCIÓN DE SEGUROS</span>
                </div>
              </div>
              <p style={{ color: "var(--blue-300)", fontSize: 13, lineHeight: 1.6, maxWidth: 260 }}>
                Asesores en seguros. Te acompañamos en la elección y gestión de tus coberturas.
              </p>
            </div>

            {/* Riesgos que cubrimos */}
            <div>
              <div style={footTitle}>Riesgos que cubrimos</div>
              <ul style={footList}>
                {RIESGOS.map((r) => <li key={r} style={footItem}>{r}</li>)}
              </ul>
            </div>

            {/* Ubicaciones */}
            <div>
              <div style={footTitle}>Nuestras oficinas</div>
              {UBICACIONES.map((u) => (
                <div key={u.zona} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <span style={{ color: "var(--blue-500)", flexShrink: 0, marginTop: 1 }}><LocIcon /></span>
                  <div>
                    <div style={{ color: "white", fontSize: 13.5, fontWeight: 500 }}>{u.zona}</div>
                    <div style={{ color: "var(--blue-300)", fontSize: 12.5 }}>{u.detalle}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Horario + contacto */}
            <div>
              <div style={footTitle}>Horario de atención</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <span style={{ color: "var(--blue-500)", flexShrink: 0, marginTop: 1 }}><ClockIcon /></span>
                <div>
                  <div style={{ color: "white", fontSize: 13.5, fontWeight: 500 }}>{HORARIO.dias}</div>
                  <div style={{ color: "var(--blue-300)", fontSize: 12.5 }}>{HORARIO.horas}</div>
                  <div style={{ color: "var(--blue-300)", fontSize: 12.5 }}>{HORARIO.sabado}</div>
                  <div style={{ color: "var(--blue-300)", fontSize: 12.5 }}>{HORARIO.horarioSabado}</div>
                </div>
              </div>
              {/* <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <a href={mailtoContacto} style={footLink}>{EMAIL}</a>
                <a href={waContacto} target="_blank" rel="noopener noreferrer" style={footLink}>{WHATSAPP_LINDO}</a>
              </div> */}
            </div>
          </div>

          {/* Barra inferior */}
          <div style={footBottom}>
            <span style={{ color: "var(--blue-300)", fontSize: 12.5 }}>© {new Date().getFullYear()} AMR Producción de Seguros Generales· Mendoza, Argentina</span>
            <div style={{ display: "flex", gap: 18, fontSize: 12.5 }}>
              <a href={mailtoContacto} style={footLink}>Correo</a>
              <a href={waContacto} target="_blank" rel="noopener noreferrer" style={footLink}>WhatsApp</a>
              <button style={{ ...footLink, background: "transparent", border: 0, cursor: "pointer" }} onClick={() => navigate("/login")}>Portal</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const SERVICIOS = [
  { t: "Automotor", d: "Terceros, todo riesgo y coberturas a medida para tu vehículo.", i: <CarIcon /> },
  { t: "Hogar", d: "Protegé tu casa ante incendio, robo y daños con la mejor prima.", i: <HomeIcon /> },
  { t: "Comercio", d: "Coberturas integrales para tu negocio y responsabilidad civil.", i: <ShopIcon /> },
];

// ── Datos del footer (editables) ──
const RIESGOS = [
  "Automotor", "Motovehículos", "Hogar / Combinado familiar", "Comercio",
  "Responsabilidad Civil", "Vida", "Accidentes personales",
];
const UBICACIONES = [
  { zona: "Las Heras — El Algarrobal", detalle: "Mendoza, Argentina" },
  { zona: "Guaymallén — Villa Nueva", detalle: "Mendoza, Argentina" },
];
const HORARIO = { dias: "Lunes a viernes", horas: "Horario corrido de 8:00 a 19:00 hs", sabado: "Sabados", horarioSabado: "De 8:30 a 14:00" };

/* ─── Íconos (SVG inline) ─── */
function WhatsIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.15c-.24.68-1.4 1.3-1.94 1.35-.5.05-.97.24-3.27-.68-2.76-1.09-4.5-3.9-4.64-4.08-.13-.18-1.1-1.47-1.1-2.8 0-1.33.7-1.98.94-2.25.24-.27.53-.34.71-.34.18 0 .35.002.5.01.16.008.38-.06.59.45.24.58.8 2 .87 2.14.07.14.12.31.02.5-.1.18-.15.29-.3.45-.15.16-.31.36-.44.48-.15.14-.3.3-.13.58.18.29.79 1.3 1.7 2.11 1.17 1.04 2.16 1.36 2.45 1.51.29.15.46.13.63-.08.18-.2.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.65.78 1.94.92.29.14.48.22.55.34.07.12.07.7-.17 1.38Z" /></svg>; }
function MailIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>; }
function CarIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13M5 13h14v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-4Z" /><circle cx="7.5" cy="15.5" r="1" /><circle cx="16.5" cy="15.5" r="1" /></svg>; }
function HomeIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>; }
function ShopIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Zm0 0a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" /></svg>; }
function LocIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>; }
function ClockIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>; }

/* ─── Estilos (paleta del portal) ─── */
const page: CSSProperties = { fontFamily: '"DM Sans", -apple-system, system-ui, sans-serif', color: "var(--ink-900)", background: "var(--canvas)" };
const nav: CSSProperties = { position: "sticky", top: 0, zIndex: 30, background: "var(--navy-950)", borderBottom: "1px solid oklch(1 0 0 / 0.08)" };
const navInner: CSSProperties = { maxWidth: 1160, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 };
function navLinks(open: boolean): CSSProperties {
  return { display: "flex", alignItems: "center", gap: 6, ...(open ? { position: "absolute", top: 68, left: 0, right: 0, flexDirection: "column", background: "var(--navy-950)", padding: 16, borderBottom: "1px solid oklch(1 0 0 / 0.08)" } : {}) };
}
const navLink: CSSProperties = { background: "transparent", border: 0, color: "var(--blue-300)", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "8px 12px", borderRadius: 8 };
const ingresarBtn: CSSProperties = { background: "white", color: "var(--navy-900)", border: 0, borderRadius: 9, padding: "9px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginLeft: 6 };
const burger: CSSProperties = { display: "none", background: "transparent", border: 0, color: "white", fontSize: 22, cursor: "pointer" };

const hero: CSSProperties = { background: "linear-gradient(160deg, var(--navy-950), var(--navy-800))", color: "white", padding: "72px 24px 84px" };
const heroInner: CSSProperties = { maxWidth: 1160, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48, flexWrap: "wrap" };
const pill: CSSProperties = { display: "inline-block", padding: "6px 14px", borderRadius: 999, background: "oklch(1 0 0 / 0.10)", border: "1px solid oklch(1 0 0 / 0.14)", color: "var(--blue-300)", fontSize: 12.5, fontWeight: 500, marginBottom: 20 };
const h1: CSSProperties = { fontSize: 46, lineHeight: 1.08, letterSpacing: "-0.03em", fontWeight: 700, margin: 0, color: "white" };
const heroSub: CSSProperties = { fontSize: 17, lineHeight: 1.6, color: "var(--blue-300)", marginTop: 20 };
const heroCardWrap: CSSProperties = { flex: "0 0 auto" };
const heroCard: CSSProperties = { width: 280, padding: "36px 28px", borderRadius: 20, background: "oklch(1 0 0 / 0.06)", border: "1px solid oklch(1 0 0 / 0.12)", backdropFilter: "blur(6px)" };

const ctaPrimary: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 24px", borderRadius: 11, background: "var(--blue-600)", color: "white", border: 0, fontSize: 15, fontWeight: 600, cursor: "pointer", textDecoration: "none" };
const ctaWhats: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 22px", borderRadius: 11, background: "oklch(0.62 0.13 155)", color: "white", border: 0, fontSize: 15, fontWeight: 600, cursor: "pointer", textDecoration: "none" };

const band: CSSProperties = { padding: "68px 24px" };
const container: CSSProperties = { maxWidth: 1160, margin: "0 auto" };
const kicker: CSSProperties = { fontSize: 12, fontWeight: 700, color: "var(--blue-600)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 };
const h2: CSSProperties = { fontSize: 32, letterSpacing: "-0.02em", fontWeight: 700, margin: 0, color: "var(--ink-900)" };
const cards: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 };
const card: CSSProperties = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, padding: 24, boxShadow: "var(--shadow-sm)" };
const cardIcon: CSSProperties = { width: 52, height: 52, borderRadius: 13, background: "var(--blue-100)", color: "var(--blue-600)", display: "grid", placeItems: "center", marginBottom: 16 };

const contactGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, maxWidth: 760, margin: "0 auto" };
const contactCard: CSSProperties = { display: "flex", alignItems: "center", gap: 16, padding: "22px 24px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, textDecoration: "none", boxShadow: "var(--shadow-sm)" };
const contactIcon: CSSProperties = { width: 48, height: 48, borderRadius: 12, display: "grid", placeItems: "center", flexShrink: 0 };

const trabajaBand: CSSProperties = { padding: "72px 24px", background: "linear-gradient(160deg, var(--navy-900), var(--navy-700))" };
const footer: CSSProperties = { background: "var(--navy-950)", padding: "48px 24px 24px" };
const footTop: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, paddingBottom: 32, borderBottom: "1px solid oklch(1 0 0 / 0.10)" };
const footTitle: CSSProperties = { color: "white", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 };
const footList: CSSProperties = { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 };
const footItem: CSSProperties = { color: "var(--blue-300)", fontSize: 13.5 };
const footBottom: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingTop: 20 };
const footLink: CSSProperties = { color: "var(--blue-300)", textDecoration: "none", fontWeight: 500 };
