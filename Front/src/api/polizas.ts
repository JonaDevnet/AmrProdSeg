import api from "../security/axiosInstance";
import type { Poliza, PagedResult, RenovacionResult } from "../types";

export interface RenovarPolizaDto {
  companiaId?: number;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  cantidadCuotas: number;
  primaOG?: number;
  cobertura?: string;
}

export interface ListarPolizasParams {
  clienteId?: number;
  estado?: number;
  page?: number;
  pageSize?: number;
}

export async function listarPolizas(
  params: ListarPolizasParams
): Promise<PagedResult<Poliza>> {
  const { data } = await api.get<PagedResult<Poliza>>("/polizas", { params });
  return data;
}

export async function getPoliza(id: number): Promise<Poliza> {
  const { data } = await api.get<Poliza>(`/polizas/${id}`);
  return data;
}

/** Póliza vigente del vehículo con esa patente, o null (204). */
export async function getPolizaActivaPorPatente(patente: string): Promise<Poliza | null> {
  const { data, status } = await api.get<Poliza>(`/polizas/activa-por-patente/${encodeURIComponent(patente)}`);
  return status === 204 ? null : data;
}

export async function cancelarPoliza(id: number): Promise<void> {
  await api.put(`/polizas/${id}/cancelar`);
}

export interface ActualizarPolizaDto {
  companiaId: number;
  ramoId?: number;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  cantidadCuotas: number;
  formaPago?: string;
  primaOG?: number;
  cobertura?: string;
}

export async function actualizarPoliza(id: number, dto: ActualizarPolizaDto): Promise<void> {
  await api.put(`/polizas/${id}`, dto);
}

export async function asignarNumeroPoliza(id: number, numero: string): Promise<void> {
  await api.put(`/polizas/${id}/numero`, { numero });
}

export async function descargarPolizaPdf(id: number): Promise<Blob> {
  const resp = await api.get(`/polizas/${id}/pdf`, { responseType: "blob" });
  return resp.data as Blob;
}

export async function renovarPoliza(
  id: number,
  dto: RenovarPolizaDto
): Promise<RenovacionResult> {
  const { data } = await api.post<RenovacionResult>(`/polizas/${id}/renovar`, dto);
  return data;
}

// ---------- Endoso de titular ----------
export interface EndosoTitularDto {
  clienteNombre: string;
  documento: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  tipoDocumento?: string;
  motivo?: string;
}

export interface EndosoResult {
  polizaId: number;
  nuevoClienteId: number;
  mensaje: string;
}

export interface EndosoHistorial {
  id: number;
  fechaEndoso: string;
  clienteAnteriorNombre: string;
  clienteAnteriorDocumento?: string | null;
  clienteNuevoNombre: string;
  clienteNuevoDocumento?: string | null;
  usuarioNombre?: string | null;
  motivo?: string | null;
}

export async function endosarTitular(id: number, dto: EndosoTitularDto): Promise<EndosoResult> {
  const { data } = await api.post<EndosoResult>(`/polizas/${id}/endoso`, dto);
  return data;
}

export async function getEndosos(id: number): Promise<EndosoHistorial[]> {
  const { data } = await api.get<EndosoHistorial[]>(`/polizas/${id}/endosos`);
  return data;
}
