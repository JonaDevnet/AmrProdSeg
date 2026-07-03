import api from "../security/axiosInstance";
import type { Vehiculo } from "../types";

export interface CrearVehiculoDto {
  clienteId: number;
  marca: string;
  modelo: string;
  anio: number;
  patente: string;
  chasis?: string;
  motor?: string;
  tipoCobertura?: string;
}

export interface ActualizarVehiculoDto {
  marca: string;
  modelo: string;
  anio: number;
  chasis?: string;
  motor?: string;
  tipoCobertura?: string;
}

export async function getVehiculosPorCliente(clienteId: number): Promise<Vehiculo[]> {
  const { data } = await api.get<Vehiculo[]>("/vehiculos", {
    params: { clienteId },
  });
  return data;
}

export async function getVehiculoPorPatente(patente: string): Promise<Vehiculo | null> {
  try {
    const { data } = await api.get<Vehiculo>("/vehiculos/por-patente", { params: { patente } });
    return data;
  } catch {
    return null;
  }
}

export async function crearVehiculo(dto: CrearVehiculoDto): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/vehiculos", dto);
  return data;
}

export async function actualizarVehiculo(id: number, dto: ActualizarVehiculoDto): Promise<void> {
  await api.put(`/vehiculos/${id}`, dto);
}
