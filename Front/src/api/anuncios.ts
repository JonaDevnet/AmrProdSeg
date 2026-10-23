import api from "../security/axiosInstance";
import type { PagedResult } from "../types";

export interface Anuncio {
  id: number;
  titulo: string;
  subtitulo?: string | null;
  texto: string;
  publicadoPor: number;
  usuarioNombre?: string | null;
  usuarioEmail?: string | null;
  fechaPublicacion: string;
}

export interface AnuncioNuevo {
  id: number;
  titulo: string;
  subtitulo?: string | null;
  fechaPublicacion: string;
}

export interface AnunciosNuevos {
  total: number;
  items: AnuncioNuevo[];
}

export interface CrearAnuncioDto {
  titulo: string;
  subtitulo?: string;
  texto: string;
}

export async function getAnuncios(page = 1, pageSize = 10): Promise<PagedResult<Anuncio>> {
  const { data } = await api.get<PagedResult<Anuncio>>("/anuncios", { params: { page, pageSize } });
  return data;
}

export async function getAnunciosNuevos(): Promise<AnunciosNuevos> {
  const { data } = await api.get<AnunciosNuevos>("/anuncios/nuevos");
  return data;
}

export async function marcarAnunciosVistos(): Promise<void> {
  await api.post("/anuncios/marcar-vistos");
}

export async function crearAnuncio(dto: CrearAnuncioDto): Promise<{ id: number }> {
  const { data } = await api.post<{ id: number }>("/anuncios", dto);
  return data;
}

export async function eliminarAnuncio(id: number): Promise<void> {
  await api.delete(`/anuncios/${id}`);
}
