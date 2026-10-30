import type { EstadoPoliza } from "../types";
import { hoyLocalISO } from "./format";

export type EstadoUI = "vigente" | "porvencer" | "vencida";

/** Meses enteros entre dos fechas "YYYY-MM-DD" (misma lógica que los formularios). */
export function mesesEntre(desdeISO: string, hastaISO: string): number {
  const a = new Date(`${desdeISO}T00:00:00Z`);
  const b = new Date(`${hastaISO}T00:00:00Z`);
  let m = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) m -= 1;
  return m;
}

/** Forma mínima de una póliza para decidir renovar vs refacturar. */
export interface PeriodoCuotas {
  fechaInicio: string;
  fechaFin: string;
  cantidadCuotas: number;
}

/**
 * Una póliza se RENUEVA (no se refactura) cuando:
 * - su vigencia ya terminó, o
 * - el plan de cuotas cubre todo el período (ej. trimestral + 3 cuotas).
 * Si el período es mayor que las cuotas (ej. anual + 3 cuotas) se REFACTURA.
 */
export function debeRenovar(p: PeriodoCuotas, hoyISO = hoyLocalISO()): boolean {
  const meses = mesesEntre(p.fechaInicio.slice(0, 10), p.fechaFin.slice(0, 10));
  const cubreTodoElPeriodo = meses <= p.cantidadCuotas;
  const vigenciaTerminada = hoyISO >= p.fechaFin.slice(0, 10);
  return cubreTodoElPeriodo || vigenciaTerminada;
}

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
