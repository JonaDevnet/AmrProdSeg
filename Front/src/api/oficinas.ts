import api from "../security/axiosInstance";
import type { Oficina } from "../types";

export async function getOficinas(): Promise<Oficina[]> {
  const { data } = await api.get<Oficina[]>("/oficinas");
  return data;
}

export async function crearOficina(nombre: string): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/oficinas", { nombre });
  return data;
}

export async function eliminarOficina(id: number): Promise<void> {
  await api.delete(`/oficinas/${id}`);
}

// Compartir clientes con oficinas
export async function getOficinasDeCliente(clienteId: number): Promise<Oficina[]> {
  const { data } = await api.get<Oficina[]>(`/clientes/${clienteId}/compartir`);
  return data;
}

export async function compartirCliente(clienteId: number, oficinaId: number): Promise<void> {
  await api.post(`/clientes/${clienteId}/compartir`, { oficinaId });
}

export async function descompartirCliente(clienteId: number, oficinaId: number): Promise<void> {
  await api.delete(`/clientes/${clienteId}/compartir/${oficinaId}`);
}
