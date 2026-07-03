import api from "../security/axiosInstance";
import type { AltaAsegurado, AltaResult } from "../types";

export async function crearAlta(dto: AltaAsegurado): Promise<AltaResult> {
  const { data } = await api.post<AltaResult>("/altas", dto);
  return data;
}
