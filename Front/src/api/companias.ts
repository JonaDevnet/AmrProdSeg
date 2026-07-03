import api from "../security/axiosInstance";
import type { Compania } from "../types";

export async function getCompanias(): Promise<Compania[]> {
  const { data } = await api.get<Compania[]>("/companias");
  return data;
}

export interface CrearCompaniaDto {
  nombre: string;
  cuit?: string;
  telefono?: string;
  color?: string;
}

export async function crearCompania(dto: CrearCompaniaDto): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/companias", dto);
  return data;
}

export async function eliminarCompania(id: number): Promise<void> {
  await api.delete(`/companias/${id}`);
}
