import api from "../security/axiosInstance";

export interface AnularPagoResult {
  anulada: boolean;
  solicitada: boolean;
  mensaje: string;
}

export interface AnulacionPendiente {
  id: number;
  cobroId: number;
  motivo?: string | null;
  fechaSolicitud: string;
  numeroCuota: number;
  monto: number;
  nroPoliza?: string | null;
  clienteNombre?: string | null;
  solicitante?: string | null;
}

/** Anula el pago de una cuota. Admin → revierte; Productor → solicita aprobación. */
export async function anularPago(cobroId: number, motivo?: string): Promise<AnularPagoResult> {
  const { data } = await api.post<AnularPagoResult>(`/cobros/${cobroId}/anular`, { motivo });
  return data;
}

export async function getAnulacionesPendientes(): Promise<AnulacionPendiente[]> {
  const { data } = await api.get<AnulacionPendiente[]>("/anulaciones/pendientes");
  return data;
}

export async function aprobarAnulacion(id: number): Promise<void> {
  await api.post(`/anulaciones/${id}/aprobar`);
}

export async function rechazarAnulacion(id: number): Promise<void> {
  await api.post(`/anulaciones/${id}/rechazar`);
}
