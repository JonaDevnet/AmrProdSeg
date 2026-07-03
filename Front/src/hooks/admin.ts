import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as usuariosApi from "../api/usuarios";
import { getCompanias, crearCompania, eliminarCompania, type CrearCompaniaDto } from "../api/companias";
import { getMetodosPago, crearMetodoPago, eliminarMetodoPago } from "../api/metodosPago";
import { getRamos, crearRamo, eliminarRamo } from "../api/ramos";
import { getCoberturas, crearCobertura, eliminarCobertura } from "../api/coberturas";
import { getOficinas, crearOficina, eliminarOficina } from "../api/oficinas";

/* -------- Usuarios -------- */
export function useUsuarios(opts?: { enabled?: boolean }) {
  return useQuery({ queryKey: ["usuarios"], queryFn: usuariosApi.listarUsuarios, enabled: opts?.enabled ?? true });
}

export function useCrearUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usuariosApi.crearUsuario,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}

export function useAsignarOficinaUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ usuarioId, oficinaId }: { usuarioId: number; oficinaId: number | null }) =>
      usuariosApi.asignarOficinaUsuario(usuarioId, oficinaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}

export function useDarDeBajaUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (usuarioId: number) => usuariosApi.darDeBajaUsuario(usuarioId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}

/* -------- Oficinas -------- */
export function useOficinas() {
  return useQuery({ queryKey: ["oficinas"], queryFn: getOficinas, staleTime: 5 * 60 * 1000 });
}

export function useCrearOficina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => crearOficina(nombre),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oficinas"] }),
  });
}

export function useEliminarOficina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarOficina(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oficinas"] }),
  });
}

export function useCambiarPassword() {
  return useMutation({
    mutationFn: ({ actual, nueva }: { actual: string; nueva: string }) =>
      usuariosApi.cambiarPassword(actual, nueva),
  });
}

/* -------- Solicitudes de reset -------- */
export function useSolicitudesReset() {
  return useQuery({ queryKey: ["solicitudes-reset"], queryFn: usuariosApi.getSolicitudesReset });
}

export function useAutorizarReset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usuariosApi.autorizarReset(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["solicitudes-reset"] }),
  });
}

/* -------- Compañías -------- */
export function useCompaniasAdmin() {
  return useQuery({ queryKey: ["companias"], queryFn: getCompanias });
}

export function useCrearCompania() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CrearCompaniaDto) => crearCompania(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companias"] }),
  });
}

export function useEliminarCompania() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarCompania(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companias"] }),
  });
}

/* -------- Métodos de pago -------- */
export function useMetodosPagoAdmin() {
  return useQuery({ queryKey: ["metodos-pago"], queryFn: getMetodosPago });
}

export function useCrearMetodoPago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => crearMetodoPago(nombre),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metodos-pago"] }),
  });
}

export function useEliminarMetodoPago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarMetodoPago(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metodos-pago"] }),
  });
}

/* -------- Ramos -------- */
export function useRamos() {
  return useQuery({ queryKey: ["ramos"], queryFn: getRamos, staleTime: 5 * 60 * 1000 });
}

export function useCrearRamo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => crearRamo(nombre),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ramos"] }),
  });
}

export function useEliminarRamo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarRamo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ramos"] }),
  });
}

/* -------- Coberturas -------- */
export function useCoberturas() {
  return useQuery({ queryKey: ["coberturas"], queryFn: getCoberturas, staleTime: 5 * 60 * 1000 });
}

export function useCrearCobertura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nombre: string) => crearCobertura(nombre),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coberturas"] }),
  });
}

export function useEliminarCobertura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eliminarCobertura(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coberturas"] }),
  });
}
