import api from "../security/axiosInstance";
import type {
  CobroPeriodoItem,
  EstadoCuenta,
  DeudaAcumulada,
  PolizaPorVencer,
  VencidaSinRenovar,
  CarteraCompania,
  ProduccionMensual,
  IngresoProyectado,
  PagoRecibido,
} from "../types";

export interface VendedorFiltro { vendedorId?: number; vendedorRol?: string }

export interface CarteraExportRow {
  proximoVencimiento: string | null;
  compania: string;
  cuotaActual: number;
  cuotasTotal: number;
  precioCobrado: number;
  precioTotal: number;
  primaOG: number;
  nroPoliza: string;
  clienteNombre: string;
  documento: string;
  tipoDocumento: string;
  email: string;
  telefono: string;
  direccion: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: string;
  chasis: string;
  motor: string;
  combustion: string;
  tipoCobertura: string;
}

/** Export de cartera (solo Admin). vendedorId opcional para filtrar por un vendedor. */
export async function carteraExport(vendedorId?: number): Promise<CarteraExportRow[]> {
  const { data } = await api.get<CarteraExportRow[]>("/reportes/cartera", { params: { vendedorId } });
  return data;
}

export async function pagosRecibidos(desde: string, hasta: string, companiaId?: number, vendedor?: VendedorFiltro) {
  const { data } = await api.get<PagoRecibido[]>("/reportes/pagos-recibidos", {
    params: { desde, hasta, companiaId, vendedorId: vendedor?.vendedorId, vendedorRol: vendedor?.vendedorRol },
  });
  return data;
}

export async function cobrosPeriodo(mes: number, anio: number, companiaId?: number) {
  const { data } = await api.get<CobroPeriodoItem[]>("/reportes/cobros-periodo", {
    params: { mes, anio, companiaId },
  });
  return data;
}

export async function estadoCuenta(clienteId: number) {
  const { data } = await api.get<EstadoCuenta>(`/reportes/estado-cuenta/${clienteId}`);
  return data;
}

export async function deudaAcumulada() {
  const { data } = await api.get<DeudaAcumulada[]>("/reportes/deuda-acumulada");
  return data;
}

export async function polizasPorVencer(dias: number, companiaId?: number) {
  const { data } = await api.get<PolizaPorVencer[]>("/reportes/polizas-por-vencer", {
    params: { dias, companiaId },
  });
  return data;
}

export async function vencidasSinRenovar() {
  const { data } = await api.get<VencidaSinRenovar[]>("/reportes/vencidas-sin-renovar");
  return data;
}

export async function carteraPorCompania() {
  const { data } = await api.get<CarteraCompania[]>("/reportes/cartera-por-compania");
  return data;
}

export async function produccionMensual(mes: number, anio: number) {
  const { data } = await api.get<ProduccionMensual>("/reportes/produccion-mensual", {
    params: { mes, anio },
  });
  return data;
}

export async function ingresosProyectados(meses: number) {
  const { data } = await api.get<IngresoProyectado[]>("/reportes/ingresos-proyectados", {
    params: { meses },
  });
  return data;
}

/** Descarga un export (pdf/excel) y dispara la descarga en el navegador. */
export async function descargarReporte(
  path: string,
  nombreArchivo: string,
  params?: Record<string, unknown>
) {
  const resp = await api.get(path, { responseType: "blob", params });
  const url = URL.createObjectURL(resp.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}
