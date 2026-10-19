import api from "../security/axiosInstance";
import type { Nacionalidad } from "../types";

export async function getNacionalidades(): Promise<Nacionalidad[]> {
  const { data } = await api.get<Nacionalidad[]>("/nacionalidades");
  return data;
}

export async function crearNacionalidad(nombre: string): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/nacionalidades", { nombre });
  return data;
}

export async function eliminarNacionalidad(id: number): Promise<void> {
  await api.delete(`/nacionalidades/${id}`);
}
