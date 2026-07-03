import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as bajasApi from "../api/bajas";

export function useBajas(estado?: number) {
  return useQuery({ queryKey: ["bajas", estado ?? "todas"], queryFn: () => bajasApi.getBajas(estado) });
}

export function useSolicitarBaja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bajasApi.solicitarBaja,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bajas"] }),
  });
}

export function useAprobarBaja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bajasApi.aprobarBaja(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bajas"] });
      qc.invalidateQueries({ queryKey: ["polizas"] });
    },
  });
}

export function useRechazarBaja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bajasApi.rechazarBaja(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bajas"] }),
  });
}
