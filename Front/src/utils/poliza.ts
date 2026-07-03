import type { EstadoPoliza } from "../types";

export type EstadoUI = "vigente" | "porvencer" | "vencida";

/**
 * Estado visual de una póliza para la cartera:
 * - Cancelada → null (no se muestra)
 * - Vencida → "vencida"
 * - Activa/Renovada → "vencida" si ya pasó la fecha de fin, "porvencer" si vence
 *   dentro de 10 días, "vigente" en otro caso.
 */
export function estadoPolizaUI(estado: EstadoPoliza, fechaFin: string, now: Date = new Date()): EstadoUI | null {
  if (estado === "Cancelada") return null;
  if (estado === "Vencida") return "vencida";
  const fin = new Date(fechaFin).getTime();
  if (Number.isNaN(fin)) return "vigente";
  const dias = Math.ceil((fin - now.getTime()) / 86_400_000);
  if (dias < 0) return "vencida";
  if (dias <= 10) return "porvencer";
  return "vigente";
}
