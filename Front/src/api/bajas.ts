import api from "../security/axiosInstance";
import type { Baja } from "../types";

export interface SolicitarBajaDto {
  polizaId: number;
  motivo: string;
  observaciones?: string;
}

export async function getBajas(estado?: number): Promise<Baja[]> {
  const { data } = await api.get<Baja[]>("/bajas", { params: { estado } });
  return data;
}

export async function solicitarBaja(dto: SolicitarBajaDto): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/bajas", dto);
  return data;
}

export async function aprobarBaja(id: number): Promise<void> {
  await api.post(`/bajas/${id}/aprobar`);
}

export async function rechazarBaja(id: number): Promise<void> {
  await api.post(`/bajas/${id}/rechazar`);
}
