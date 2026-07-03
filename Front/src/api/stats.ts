import api from "../security/axiosInstance";

export interface StatsPublicas {
  polizasActivas: number;
  clientes: number;
  companias: number;
}

/** Conteos para el panel de bienvenida (endpoint público, sin auth). */
export async function getStatsPublicas(): Promise<StatsPublicas> {
  const { data } = await api.get<StatsPublicas>("/stats/publicas");
  return data;
}
