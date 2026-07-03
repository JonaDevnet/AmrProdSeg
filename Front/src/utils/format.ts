export function formatFecha(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatMoneda(n: number): string {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}
