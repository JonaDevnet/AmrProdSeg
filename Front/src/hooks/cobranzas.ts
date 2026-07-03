import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCobrosPendientes, pagarCuota } from "../api/cobros";
import { getMetodosPago } from "../api/metodosPago";

export function useCobrosPendientes(mes: number, anio: number) {
  return useQuery({
    queryKey: ["cobros", "pendientes", mes, anio],
    queryFn: () => getCobrosPendientes(mes, anio),
  });
}

export function useMetodosPago() {
  return useQuery({
    queryKey: ["metodos-pago"],
    queryFn: getMetodosPago,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePagarCuota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      fechaPago,
      metodoPagoId,
    }: {
      id: number;
      fechaPago: string;
      metodoPagoId?: number;
    }) => pagarCuota(id, fechaPago, metodoPagoId),
    onSuccess: () => {
      // invalida tanto pendientes del período como cuotas por póliza
      qc.invalidateQueries({ queryKey: ["cobros"] });
    },
  });
}
