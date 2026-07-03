import type { CSSProperties } from "react";

const box: CSSProperties = { padding: "40px 20px", textAlign: "center", fontSize: 14 };

export function Cargando({ label }: { label?: string }) {
  return <div style={{ ...box, color: "var(--ink-400)" }}>{label ?? "Cargando…"}</div>;
}

export function VacioState({ mensaje }: { mensaje: string }) {
  return <div style={{ ...box, color: "var(--ink-400)" }}>{mensaje}</div>;
}

export function ErrorState({ mensaje }: { mensaje?: string }) {
  return (
    <div style={{ ...box, color: "var(--bad-700)" }}>
      {mensaje ?? "Ocurrió un error al cargar los datos."}
    </div>
  );
}
