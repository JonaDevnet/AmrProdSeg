// Eliminación de pólizas (con autorización del Admin) y registro de movimientos.
import api from "../security/axiosInstance";

export interface EliminarPolizaResult {
  eliminada: boolean;   // ejecutada en el acto (Admin)
  solicitada: boolean;  // pendiente de autorización (Productor)
  mensaje: string;
}

export async function solicitarEliminarPoliza(polizaId: number, motivo?: string): Promise<EliminarPolizaResult> {
  const { data } = await api.post<EliminarPolizaResult>(`/polizas/${polizaId}/eliminar`, { motivo: motivo ?? null });
  return data;
}

export interface EliminacionPendiente {
  id: number;
  polizaId: number;
  polizaNumero: string | null;
  clienteNombre: string | null;
  patente: string | null;
  cantidadCuotas: number;
  cuotasPagadas: number;
  motivo: string | null;
  fechaSolicitud: string;
  solicitante: string | null;
}

export interface EliminacionHistorial extends EliminacionPendiente {
  estado: number;              // 0=Pendiente 1=Ejecutada 2=Rechazada
  fechaResolucion: string | null;
  resolvio: string | null;
}

export async function getEliminacionesPendientes(): Promise<EliminacionPendiente[]> {
  const { data } = await api.get<EliminacionPendiente[]>("/eliminaciones/pendientes");
  return data;
}

export async function getEliminacionesHistorial(): Promise<EliminacionHistorial[]> {
  const { data } = await api.get<EliminacionHistorial[]>("/eliminaciones/historial");
  return data;
}

export async function aprobarEliminacion(id: number): Promise<void> {
  await api.post(`/eliminaciones/${id}/aprobar`);
}

export async function rechazarEliminacion(id: number): Promise<void> {
  await api.post(`/eliminaciones/${id}/rechazar`);
}

// ── Papelera de pólizas (eliminadas, recuperables) ──
export interface PapeleraItem {
  polizaId: number;
  polizaNumero: string | null;
  clienteNombre: string | null;
  patente: string | null;
  cantidadCuotas: number;
  cuotasPagadas: number;
  fechaEliminacion: string | null;
  motivo: string | null;
  fechaSolicitud: string;
  solicitante: string | null;
  resolvio: string | null;
}

export async function getPapelera(): Promise<PapeleraItem[]> {
  const { data } = await api.get<PapeleraItem[]>("/eliminaciones/papelera");
  return data;
}

export async function restaurarPoliza(polizaId: number): Promise<void> {
  await api.post(`/eliminaciones/papelera/${polizaId}/restaurar`);
}

export async function borrarDefinitivo(polizaId: number): Promise<void> {
  await api.delete(`/eliminaciones/papelera/${polizaId}`);
}

// ── Historial de anulaciones de cuota (para el mismo registro) ──
export interface AnulacionHistorial {
  id: number;
  cobroId: number;
  motivo: string | null;
  fechaSolicitud: string;
  numeroCuota: number;
  monto: number;
  nroPoliza: string | null;
  clienteNombre: string | null;
  solicitante: string | null;
  estado: number;
  fechaResolucion: string | null;
  resolvio: string | null;
}

export async function getAnulacionesHistorial(): Promise<AnulacionHistorial[]> {
  const { data } = await api.get<AnulacionHistorial[]>("/anulaciones/historial");
  return data;
}
