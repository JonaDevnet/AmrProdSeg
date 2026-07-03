import api from "../security/axiosInstance";
import type { Usuario, SolicitudReset, Rol } from "../types";

export interface CrearUsuarioDto {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data } = await api.get<Usuario[]>("/usuarios");
  return data;
}

export async function crearUsuario(dto: CrearUsuarioDto): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/usuarios", dto);
  return data;
}

export async function cambiarPassword(passwordActual: string, passwordNuevo: string): Promise<void> {
  await api.put("/usuarios/password", { passwordActual, passwordNuevo });
}

export async function getSolicitudesReset(): Promise<SolicitudReset[]> {
  const { data } = await api.get<SolicitudReset[]>("/usuarios/solicitudes-reset");
  return data;
}

export async function autorizarReset(id: number): Promise<void> {
  await api.post(`/usuarios/solicitudes-reset/${id}/autorizar`);
}

export async function asignarOficinaUsuario(usuarioId: number, oficinaId: number | null): Promise<void> {
  await api.put(`/usuarios/${usuarioId}/oficina`, { oficinaId });
}

export async function darDeBajaUsuario(usuarioId: number): Promise<void> {
  await api.delete(`/usuarios/${usuarioId}`);
}
