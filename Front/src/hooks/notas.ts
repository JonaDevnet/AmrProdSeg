import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotas, crearNota, eliminarNota } from "../api/notas";

export function useNotas() {
  return useQuery({
    queryKey: ["notas"],
    queryFn: getNotas,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useCrearNota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (texto: string) => crearNota(texto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notas"] }),
  });
}

export function useEliminarNota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarNota(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notas"] }),
  });
}
