import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import * as polizasApi from "../api/polizas";
import { getCobrosPorPoliza } from "../api/cobros";
import { getCompanias } from "../api/companias";

export function usePolizas(
  estado: number | undefined, page: number, pageSize = 20,
  termino?: string, campo?: "numero" | "cliente" | "patente",
) {
  return useQuery({
    queryKey: ["polizas", estado ?? "todas", page, pageSize, termino ?? "", campo ?? ""],
    queryFn: () => polizasApi.listarPolizas({ estado, page, pageSize, termino: termino || undefined, campo }),
    placeholderData: keepPreviousData,
  });
}

export function usePoliza(id: number) {
  return useQuery({
    queryKey: ["poliza", id],
    queryFn: () => polizasApi.getPoliza(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCobrosPorPoliza(id: number) {
  return useQuery({
    queryKey: ["cobros", "poliza", id],
    queryFn: () => getCobrosPorPoliza(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCompanias() {
  return useQuery({
    queryKey: ["companias"],
    queryFn: getCompanias,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCancelarPoliza(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => polizasApi.cancelarPoliza(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["poliza", id] });
      qc.invalidateQueries({ queryKey: ["polizas"] });
    },
  });
}

export function useRenovarPoliza(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: polizasApi.RenovarPolizaDto) => polizasApi.renovarPoliza(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["poliza", id] });
      qc.invalidateQueries({ queryKey: ["polizas"] });
    },
  });
}

export function useEndosos(id: number) {
  return useQuery({
    queryKey: ["poliza", id, "endosos"],
    queryFn: () => polizasApi.getEndosos(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useEndosarTitular(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: polizasApi.EndosoTitularDto) => polizasApi.endosarTitular(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["poliza", id] });
      qc.invalidateQueries({ queryKey: ["poliza", id, "endosos"] });
      qc.invalidateQueries({ queryKey: ["polizas"] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["vehiculos"] });
    },
  });
}
