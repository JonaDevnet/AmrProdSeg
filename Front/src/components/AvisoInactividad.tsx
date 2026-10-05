import type { CSSProperties } from "react";
import { useInactividad } from "../auth/useInactividad";

/**
 * Aviso previo al cierre de sesión por inactividad (último minuto).
 * Se monta una sola vez en el layout autenticado.
 */
export default function AvisoInactividad() {
  const { restante, seguir } = useInactividad();
  if (restante === null) return null;

  return (
    <div style={overlay}>
      <div style={card}>
        <h3 style={titulo}>¿Seguís ahí?</h3>
        <p style={texto}>
          Por seguridad, tu sesión se cerrará por inactividad en <strong>{restante}s</strong>.
        </p>
        <button onClick={seguir} style={boton}>Seguir conectado</button>
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.55)", backdropFilter: "blur(4px)", zIndex: 2000, display: "grid", placeItems: "center", padding: 20 };
const card: CSSProperties = { width: 400, maxWidth: "100%", background: "var(--paper)", borderRadius: 16, boxShadow: "var(--shadow-lg)", padding: 24, textAlign: "center" };
const titulo: CSSProperties = { margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ink-900)" };
const texto: CSSProperties = { margin: "10px 0 18px", fontSize: 14, color: "var(--ink-700)", lineHeight: 1.5 };
const boton: CSSProperties = { height: 42, padding: "0 20px", borderRadius: 10, border: 0, background: "var(--navy-900)", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" };
