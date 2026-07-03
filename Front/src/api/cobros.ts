import api from "../security/axiosInstance";
import type { Cobro } from "../types";

export async function getCobrosPorPoliza(polizaId: number): Promise<Cobro[]> {
  const { data } = await api.get<Cobro[]>("/cobros", { params: { polizaId } });
  return data;
}

export async function getCobrosPendientes(mes: number, anio: number): Promise<Cobro[]> {
  const { data } = await api.get<Cobro[]>("/cobros/pendientes", {
    params: { mes, anio },
  });
  return data;
}

export async function pagarCuota(
  id: number,
  fechaPago: string,
  metodoPagoId?: number
): Promise<void> {
  await api.put(`/cobros/${id}/pagar`, { fechaPago, metodoPagoId });
}

export interface EnviarComprobanteResult {
  enviado: boolean;
  mensaje: string;
}

export async function enviarComprobante(
  id: number,
  canal: "email" | "whatsapp"
): Promise<EnviarComprobanteResult> {
  const { data } = await api.post<EnviarComprobanteResult>(`/cobros/${id}/comprobante/enviar`, { canal });
  return data;
}

/** Abre un PDF (blob) del backend en una pestaña nueva; si el popup está bloqueado, lo descarga. */
async function abrirPdf(ruta: string, nombreFallback: string): Promise<void> {
  const { data } = await api.get<Blob>(ruta, { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const win = window.open(url, "_blank");
  if (!win) {
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreFallback;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Comprobante (1ª hoja, con talón recortable) para imprimir. */
export function imprimirComprobante(id: number): Promise<void> {
  return abrirPdf(`/cobros/${id}/comprobante/imprimir`, `Comprobante-${id}.pdf`);
}

/** Ticket (2ª hoja, sin logo) para imprimir. */
export function imprimirTicket(id: number): Promise<void> {
  return abrirPdf(`/cobros/${id}/ticket/imprimir`, `Ticket-${id}.pdf`);
}
