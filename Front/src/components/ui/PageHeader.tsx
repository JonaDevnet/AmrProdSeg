import type { ReactNode } from "react";

interface Props {
  titulo: string;
  subtitulo?: string;
  accion?: ReactNode;
}

/** Encabezado de página (hero) — tipografía alineada a los prototipos (h1 30px). */
export default function PageHeader({ titulo, subtitulo, accion }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 22 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 30, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" }}>
          {titulo}
        </h1>
        {subtitulo && <p style={{ margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14.5 }}>{subtitulo}</p>}
      </div>
      {accion && <div style={{ flexShrink: 0 }}>{accion}</div>}
    </div>
  );
}
