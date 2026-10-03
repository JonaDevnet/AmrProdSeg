// Auditoría de movimientos (quién hizo qué y cuándo) — solo Admin.
import api from "../security/axiosInstance";

export interface AuditoriaMovimiento {
  id: number;
  usuarioId: number;
  usuarioNombre: string | null;
  fecha: string;
  entidad: string;   // 'Cliente' | 'Poliza'
  registroId: number;
  accion: string;    // 'Editar' | 'Eliminar' | 'Cancelar' | 'AsignarNumero'
  detalle: string | null;
}

export async function getAuditoriaMovimientos(usuarioId?: number): Promise<AuditoriaMovimiento[]> {
  const { data } = await api.get<AuditoriaMovimiento[]>("/auditoria/movimientos", {
    params: usuarioId ? { usuarioId } : {},
  });
  return data;
}
