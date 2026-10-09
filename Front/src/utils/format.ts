export function formatFecha(iso?: string | null): string {
  if (!iso) return "—";
  // Las cadenas "fecha-solo" (YYYY-MM-DD) se interpretan como UTC medianoche por el
  // constructor de Date → en zonas detrás de UTC (Argentina) mostraban un día menos.
  // Se fuerzan a hora local agregando la hora; los timestamps quedan igual.
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const d = soloFecha ? new Date(`${iso}T00:00:00`) : new Date(iso);
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

/** Fecha y hora en formato local (para auditoría). */
export function formatFechaHora(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
