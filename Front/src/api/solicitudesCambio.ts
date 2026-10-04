import api from "../security/axiosInstance";

export interface SolicitudCambioDto {
  id: number;
  tipo: string;        // "Cliente" | "Poliza"
  entidadId: number;
  accion: string;      // "Editar" | "Eliminar"
  motivo?: string | null;
  solicitante?: string | null;
  fechaSolicitud: string;      // ISO
  estado: number;              // 0 Pendiente 1 Aprobada 2 Rechazada
  resolvio?: string | null;
  fechaResolucion?: string | null;
  entidadDesc?: string | null;
  clienteNombre?: string | null;
  payloadJson?: string | null;
}

export interface CambioResultDto {
  aplicada?: boolean;
  solicitada?: boolean;
  mensaje?: string;
}

export async function getPendientes(): Promise<SolicitudCambioDto[]> {
  const { data } = await api.get<SolicitudCambioDto[]>("/solicitudes-cambio/pendientes");
  return data ?? [];
}

export async function getHistorial(): Promise<SolicitudCambioDto[]> {
  const { data } = await api.get<SolicitudCambioDto[]>("/solicitudes-cambio/historial");
  return data ?? [];
}

export async function aprobar(id: number): Promise<void> {
  await api.post(`/solicitudes-cambio/${id}/aprobar`);
}

export async function rechazar(id: number): Promise<void> {
  await api.post(`/solicitudes-cambio/${id}/rechazar`);
}
