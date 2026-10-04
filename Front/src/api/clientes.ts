import api from "../security/axiosInstance";
import type { Cliente, PagedResult } from "../types";

export interface CrearClienteDto {
  nombre: string;
  documento: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
}

export interface ActualizarClienteDto {
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
}

export async function listarClientes(
  q: string,
  page: number,
  pageSize = 20
): Promise<PagedResult<Cliente>> {
  const { data } = await api.get<PagedResult<Cliente>>("/clientes", {
    params: { q, page, pageSize },
  });
  return data;
}

export async function getCliente(id: number): Promise<Cliente> {
  const { data } = await api.get<Cliente>(`/clientes/${id}`);
  return data;
}

/** Ficha completa del cliente en PDF (datos + vehículos + todas las pólizas). */
export async function descargarDossierCliente(id: number): Promise<Blob> {
  const resp = await api.get(`/clientes/${id}/dossier-pdf`, { responseType: "blob" });
  return resp.data as Blob;
}

export async function crearCliente(dto: CrearClienteDto): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/clientes", dto);
  return data;
}

import type { CambioResultDto } from "./solicitudesCambio";

export async function actualizarCliente(
  id: number,
  dto: ActualizarClienteDto
): Promise<CambioResultDto> {
  const { data } = await api.put<CambioResultDto>(`/clientes/${id}`, dto);
  return data ?? {};
}

export async function eliminarCliente(id: number, motivo?: string): Promise<CambioResultDto> {
  const { data } = await api.delete<CambioResultDto>(`/clientes/${id}`, {
    data: motivo ? { motivo } : {},
  });
  return data ?? {};
}

export async function actualizarDocumento(
  id: number,
  documento: string
): Promise<void> {
  await api.put(`/clientes/${id}/documento`, { documento });
}
