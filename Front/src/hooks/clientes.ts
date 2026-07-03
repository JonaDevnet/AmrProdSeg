import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import * as clientesApi from "../api/clientes";
import {
  getVehiculosPorCliente,
  crearVehiculo,
  actualizarVehiculo,
  type CrearVehiculoDto,
  type ActualizarVehiculoDto,
} from "../api/vehiculos";
import { listarPolizas } from "../api/polizas";

export function useClientes(q: string, page: number, pageSize = 20) {
  return useQuery({
    queryKey: ["clientes", q, page, pageSize],
    queryFn: () => clientesApi.listarClientes(q, page, pageSize),
    placeholderData: keepPreviousData,
  });
}

export function useCliente(id: number) {
  return useQuery({
    queryKey: ["cliente", id],
    queryFn: () => clientesApi.getCliente(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useVehiculosPorCliente(id: number) {
  return useQuery({
    queryKey: ["vehiculos", "cliente", id],
    queryFn: () => getVehiculosPorCliente(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function usePolizasPorCliente(id: number) {
  return useQuery({
    queryKey: ["polizas", "cliente", id],
    queryFn: () => listarPolizas({ clienteId: id, page: 1, pageSize: 100 }),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCrearCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clientesApi.crearCliente,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }),
  });
}

export function useActualizarCliente(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: clientesApi.ActualizarClienteDto) =>
      clientesApi.actualizarCliente(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cliente", id] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useCrearVehiculo(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CrearVehiculoDto) => crearVehiculo(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehiculos", "cliente", clienteId] }),
  });
}

export function useActualizarVehiculo(clienteId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ActualizarVehiculoDto }) => actualizarVehiculo(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehiculos", "cliente", clienteId] }),
  });
}

export function useActualizarDocumento(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documento: string) =>
      clientesApi.actualizarDocumento(id, documento),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cliente", id] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}
