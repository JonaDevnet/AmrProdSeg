import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import * as anunciosApi from "../api/anuncios";

export function useAnuncios(page: number, pageSize = 10) {
  return useQuery({
    queryKey: ["anuncios", page, pageSize],
    queryFn: () => anunciosApi.getAnuncios(page, pageSize),
    placeholderData: keepPreviousData,
  });
}

/** Anuncios nuevos para la campanita. El polling es el respaldo de SignalR. */
export function useAnunciosNuevos() {
  return useQuery({
    queryKey: ["notif", "anuncios"],
    queryFn: anunciosApi.getAnunciosNuevos,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useCrearAnuncio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: anunciosApi.CrearAnuncioDto) => anunciosApi.crearAnuncio(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anuncios"] });
      qc.invalidateQueries({ queryKey: ["notif", "anuncios"] });
    },
  });
}

export function useEliminarAnuncio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => anunciosApi.eliminarAnuncio(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anuncios"] });
      qc.invalidateQueries({ queryKey: ["notif", "anuncios"] });
    },
  });
}

export function useMarcarAnunciosVistos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hastaId: number) => anunciosApi.marcarAnunciosVistos(hastaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notif", "anuncios"] });
    },
  });
}
