import api from "../security/axiosInstance";
import type { Cobertura } from "../types";

export async function getCoberturas(): Promise<Cobertura[]> {
  const { data } = await api.get<Cobertura[]>("/coberturas");
  return data;
}

export async function crearCobertura(nombre: string): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/coberturas", { nombre });
  return data;
}

export async function eliminarCobertura(id: number): Promise<void> {
  await api.delete(`/coberturas/${id}`);
}
