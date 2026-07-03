// Interfaces TypeScript — espejo de los DTOs del backend (AmrProdSeg.API)

export type Rol = "Admin" | "Productor";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  nombre: string;
  rol: Rol;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Cliente {
  id: number;
  nombre: string;
  documento: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  tipoDocumento?: string | null;
  fechaAlta: string;
  activo: boolean;
  oficinaId?: number | null;
}

export interface Vehiculo {
  id: number;
  clienteId: number;
  marca: string;
  modelo: string;
  anio: number;
  patente: string;
  chasis?: string | null;
  motor?: string | null;
  tipoCobertura?: string | null;
  combustion?: string | null;
}

export interface Compania {
  id: number;
  nombre: string;
  cuit?: string | null;
  telefono?: string | null;
  logoUrl?: string | null;
  color?: string | null;
  activo: boolean;
}

export type EstadoPoliza = "Activa" | "Vencida" | "Cancelada" | "Renovada";

export interface Poliza {
  id: number;
  numero: string;
  clienteId: number;
  vehiculoId?: number | null;
  companiaId: number;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  cantidadCuotas: number;
  estado: EstadoPoliza;
  polizaOrigenId?: number | null;
  fechaEmision: string;
  formaPago?: string | null;
  primaOG?: number | null;
  cobertura?: string | null;
  clienteNombre?: string | null;
  patente?: string | null;
  ramoId?: number | null;
  ramoNombre?: string | null;
  cuotasTotal?: number | null;
  cuotasPagadas?: number | null;
  cuotasVencidas?: number | null;
}

export type EstadoCobro = 0 | 1 | 2; // Pendiente | Pagado | Vencido

export interface Cobro {
  id: number;
  polizaId: number;
  numeroCuota: number;
  fechaVencimiento: string;
  monto: number;
  estado: EstadoCobro;
  fechaPago?: string | null;
  metodoPagoId?: number | null;
  nroPoliza?: string | null;
  clienteNombre?: string | null;
}

export interface RenovacionResult {
  nuevaPolizaId: number;
  pdfUrl: string;
}

// ---------- Reportes (§11) ----------
export interface CobroPeriodoItem {
  id: number;
  numeroCuota: number;
  fechaVencimiento: string;
  monto: number;
  estado: EstadoCobro;
  fechaPago?: string | null;
  nroPoliza: string;
  clienteNombre: string;
  compania: string;
}

export interface EstadoCuentaItem {
  id: number;
  nroPoliza: string;
  numeroCuota: number;
  fechaVencimiento: string;
  monto: number;
  estado: EstadoCobro;
  fechaPago?: string | null;
}
export interface EstadoCuenta {
  detalle: EstadoCuentaItem[];
  totalAbonado: number;
  totalAdeudado: number;
}

export interface DeudaAcumulada {
  clienteId: number;
  nombre: string;
  documento: string;
  telefono?: string | null;
  cuotasImpagas: number;
  montoAdeudado: number;
}

export interface PolizaPorVencer {
  nombre: string;
  telefono?: string | null;
  patente: string;
  compania: string;
  nroPoliza: string;
  fechaFin: string;
  diasRestantes: number;
}

export interface VencidaSinRenovar {
  clienteNombre: string;
  patente: string;
  compania: string;
  nroPoliza: string;
  fechaFin: string;
  diasVencida: number;
  precioTotal: number;
}

export interface CarteraCompania {
  companiaId: number;
  compania: string;
  cantidadPolizas: number;
  clientesUnicos: number;
  primaTotal: number;
}

export interface ProduccionMensual {
  polizasNuevas: number;
  polizasRenovadas: number;
  totalPolizas: number;
  primaEmitida: number;
}

export interface IngresoProyectado {
  anio: number;
  mes: number;
  montoProyectado: number;
  cantidadCuotas: number;
}

export interface PagoRecibido {
  id: number;
  fechaPago: string;
  monto: number;
  numeroCuota: number;
  polizaId: number;
  primaOG: number;
  nroPoliza: string;
  clienteNombre: string;
  compania: string;
  companiaId: number;
  ramo: string;
  metodo: string;
  patente?: string;
  cantidadCuotas?: number;
  oficinaId?: number | null;
  oficinaNombre?: string;
  vendedorId?: number | null;
  vendedorNombre?: string;
}

export interface MetodoPago {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Ramo {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Cobertura {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Oficina {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  fechaAlta: string;
  oficinaId?: number | null;
  oficinaNombre?: string | null;
}

export interface Baja {
  id: number;
  polizaId: number;
  nroPoliza?: string | null;
  clienteNombre?: string | null;
  motivo: string;
  observaciones?: string | null;
  estado: number; // 0=Pendiente 1=Aprobada 2=Rechazada
  fechaSolicitud: string;
  solicitante?: string | null;
}

export interface SolicitudReset {
  id: number;
  usuarioId: number;
  email: string;
  estado: number;
  fechaSolicitud: string;
  usuarioNombre?: string | null;
  rol?: string | null;
}

export interface AltaResult {
  clienteId: number;
  vehiculoId: number;
  polizaId: number;
  numero: string;
  pdfUrl: string;
}

// Entrada del alta de asegurado (wizard atómico)
export interface AltaAsegurado {
  clienteNombre: string;
  documento: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  tipoDocumento?: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  patente?: string;
  chasis?: string;
  motor?: string;
  tipoCobertura?: string;
  combustion?: string;
  companiaId: number;
  ramoId?: number;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  cantidadCuotas: number;
  formaPago?: string;
  primaOG?: number;
}
