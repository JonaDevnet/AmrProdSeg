import api from "../security/axiosInstance";
import type { Nota } from "../types";

export async function getNotas(): Promise<Nota[]> {
  const { data } = await api.get<Nota[]>("/notas");
  return data;
}

export async function crearNota(texto: string): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/notas", { texto });
  return data;
}

export async function eliminarNota(id: number): Promise<void> {
  await api.delete(`/notas/${id}`);
}
