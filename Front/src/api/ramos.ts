import api from "../security/axiosInstance";
import type { Ramo } from "../types";

export async function getRamos(): Promise<Ramo[]> {
  const { data } = await api.get<Ramo[]>("/ramos");
  return data;
}

export async function crearRamo(nombre: string): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/ramos", { nombre });
  return data;
}

export async function eliminarRamo(id: number): Promise<void> {
  await api.delete(`/ramos/${id}`);
}
