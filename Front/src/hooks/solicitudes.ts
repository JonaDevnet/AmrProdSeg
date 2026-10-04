import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/solicitudesCambio";

export function useSolicitudesPendientes() {
  return useQuery({
    queryKey: ["solicitudes-cambio", "pendientes"],
    queryFn: api.getPendientes,
  });
}

export function useSolicitudesHistorial() {
  return useQuery({
    queryKey: ["solicitudes-cambio", "historial"],
    queryFn: api.getHistorial,
  });
}

export function useAprobarSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.aprobar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["solicitudes-cambio", "pendientes"] });
      qc.invalidateQueries({ queryKey: ["solicitudes-cambio", "historial"] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["polizas"] });
    },
  });
}

export function useRechazarSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.rechazar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["solicitudes-cambio", "pendientes"] });
      qc.invalidateQueries({ queryKey: ["solicitudes-cambio", "historial"] });
    },
  });
}
