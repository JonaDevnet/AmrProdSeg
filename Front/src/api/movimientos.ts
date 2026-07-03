import api from "../security/axiosInstance";

export type TipoMovimiento = "ingreso" | "egreso";

export interface Movimiento {
  id: number;
  usuarioId: number;
  tipo: TipoMovimiento;
  monto: number;
  categoria?: string | null;
  descripcion?: string | null;
  fecha: string;
}

export interface CrearMovimientoDto {
  tipo: TipoMovimiento;
  monto: number;
  categoria?: string;
  descripcion?: string;
  fecha: string;
}

export async function getMovimientos(desde?: string, hasta?: string): Promise<Movimiento[]> {
  const { data } = await api.get<Movimiento[]>("/movimientos", { params: { desde, hasta } });
  return data;
}

export async function crearMovimiento(dto: CrearMovimientoDto): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/movimientos", dto);
  return data;
}

export async function eliminarMovimiento(id: number): Promise<void> {
  await api.delete(`/movimientos/${id}`);
}
