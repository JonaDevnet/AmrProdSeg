import api, { REFRESH_KEY } from "../security/axiosInstance";
import type { LoginResult } from "../types";

export async function login(email: string, password: string): Promise<LoginResult> {
  const { data } = await api.post<LoginResult>("/auth/login", { email, password });
  return data;
}

export async function solicitarReset(email: string): Promise<void> {
  await api.post("/auth/reset/solicitar", { email });
}

export async function confirmarReset(email: string, nuevaPassword: string): Promise<void> {
  await api.post("/auth/reset/confirmar", { email, nuevaPassword });
}

export async function logout(): Promise<void> {
  const refreshToken = sessionStorage.getItem(REFRESH_KEY);
  if (refreshToken) {
    try {
      await api.post("/auth/logout", { refreshToken });
    } catch {
      /* sesión igual se limpia localmente */
    }
  }
}
