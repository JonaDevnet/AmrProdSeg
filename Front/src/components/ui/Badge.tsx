import type { CSSProperties } from "react";

function Pill({ texto, fg, bg, dot }: { texto: string; fg: string; bg: string; dot: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      background: bg, color: fg,
      padding: "4px 10px 4px 9px", borderRadius: 999,
      fontSize: 12.5, fontWeight: 600,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      {texto}
    </span>
  );
}

export function EstadoPolizaBadge({ estado }: { estado: string }) {
  const map: Record<string, { fg: string; bg: string; dot: string }> = {
    Activa: { fg: "var(--ok-700)", bg: "var(--ok-100)", dot: "var(--ok-500)" },
    Vencida: { fg: "var(--warn-700)", bg: "var(--warn-100)", dot: "var(--warn-500)" },
    Cancelada: { fg: "var(--bad-700)", bg: "var(--bad-100)", dot: "var(--bad-500)" },
    Renovada: { fg: "var(--blue-600)", bg: "var(--blue-100)", dot: "var(--blue-500)" },
  };
  const c = map[estado] ?? { fg: "var(--ink-700)", bg: "var(--line-2)", dot: "var(--ink-400)" };
  return <Pill texto={estado} {...c} />;
}

export function EstadoCobroBadge({ estado }: { estado: number }) {
  const map: Record<number, { texto: string; fg: string; bg: string; dot: string }> = {
    0: { texto: "Pendiente", fg: "var(--warn-700)", bg: "var(--warn-100)", dot: "var(--warn-500)" },
    1: { texto: "Pagado", fg: "var(--ok-700)", bg: "var(--ok-100)", dot: "var(--ok-500)" },
    2: { texto: "Vencido", fg: "var(--bad-700)", bg: "var(--bad-100)", dot: "var(--bad-500)" },
  };
  const c = map[estado] ?? { texto: "—", fg: "var(--ink-700)", bg: "var(--line-2)", dot: "var(--ink-400)" };
  return <Pill {...c} />;
}

/** Patente con estilo "chapa" (como en los prototipos). */
export function Plate({ patente }: { patente?: string | null }) {
  if (!patente || patente.trim() === "") return <span style={{ color: "var(--ink-400)", fontSize: 13 }}>—</span>;
  return <span style={plate} className="mono">{patente}</span>;
}

const plate: CSSProperties = {
  display: "inline-flex", alignItems: "center",
  border: "1.5px solid var(--ink-900)", borderRadius: 5,
  padding: "3px 9px", fontSize: 12.5, letterSpacing: "0.06em", fontWeight: 600,
  color: "var(--ink-900)", background: "oklch(0.99 0.005 245)",
};
