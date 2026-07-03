import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crearAlta } from "../api/altas";

export function useCrearAlta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: crearAlta,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["polizas"] });
    },
  });
}
