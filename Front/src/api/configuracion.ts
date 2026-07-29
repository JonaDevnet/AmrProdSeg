import api from "../security/axiosInstance";

export interface ResendConfig {
  habilitado: boolean;
  from: string;
  fromNombre: string;
  apiKeyConfigurada: boolean;
}

export interface ActualizarResendDto {
  habilitado: boolean;
  from: string;
  fromNombre: string;
  apiKey?: string; // vacío = mantener la actual
}

export async function getResendConfig(): Promise<ResendConfig> {
  const { data } = await api.get<ResendConfig>("/configuracion/resend");
  return data;
}

export async function actualizarResendConfig(dto: ActualizarResendDto): Promise<void> {
  await api.put("/configuracion/resend", dto);
}

export interface ProbarEmailResult {
  ok: boolean;
  mensaje: string;
}

/** Envía un correo de prueba al destino indicado, usando la config guardada. */
export async function probarResend(destino: string): Promise<ProbarEmailResult> {
  const { data } = await api.post<ProbarEmailResult>("/configuracion/resend/test", { destino });
  return data;
}

export interface WhatsappConfig {
  habilitado: boolean;
  baseUrl: string;
  instance: string;
  apiKeyConfigurada: boolean;
}

export interface ActualizarWhatsappDto {
  habilitado: boolean;
  baseUrl: string;
  instance: string;
  apiKey?: string; // vacío = mantener la actual
}

export async function getWhatsappConfig(): Promise<WhatsappConfig> {
  const { data } = await api.get<WhatsappConfig>("/configuracion/whatsapp");
  return data;
}

export async function actualizarWhatsappConfig(dto: ActualizarWhatsappDto): Promise<void> {
  await api.put("/configuracion/whatsapp", dto);
}

export interface ProbarWhatsappResult {
  ok: boolean;
  mensaje: string;
}

/** Envía un WhatsApp de prueba al número indicado, usando la config guardada. */
export async function probarWhatsapp(telefono: string): Promise<ProbarWhatsappResult> {
  const { data } = await api.post<ProbarWhatsappResult>("/configuracion/whatsapp/test", { telefono });
  return data;
}
