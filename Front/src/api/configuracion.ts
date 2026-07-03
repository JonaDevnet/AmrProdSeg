import api from "../security/axiosInstance";

export interface SmtpConfig {
  habilitado: boolean;
  host: string;
  port: number;
  usarSsl: boolean;
  usuario: string;
  from: string;
  fromNombre: string;
  passwordConfigurada: boolean;
}

export interface ActualizarSmtpDto {
  habilitado: boolean;
  host: string;
  port: number;
  usarSsl: boolean;
  usuario: string;
  from: string;
  fromNombre: string;
  password?: string; // vacío = mantener la actual
}

export async function getSmtpConfig(): Promise<SmtpConfig> {
  const { data } = await api.get<SmtpConfig>("/configuracion/smtp");
  return data;
}

export async function actualizarSmtpConfig(dto: ActualizarSmtpDto): Promise<void> {
  await api.put("/configuracion/smtp", dto);
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
