import api from "../security/axiosInstance";
import type { MetodoPago } from "../types";

export async function getMetodosPago(): Promise<MetodoPago[]> {
  const { data } = await api.get<MetodoPago[]>("/metodos-pago");
  return data;
}

export async function crearMetodoPago(nombre: string): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/metodos-pago", { nombre });
  return data;
}

export async function eliminarMetodoPago(id: number): Promise<void> {
  await api.delete(`/metodos-pago/${id}`);
}
