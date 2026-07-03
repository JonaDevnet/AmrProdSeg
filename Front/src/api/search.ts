import api from "../security/axiosInstance";

export type TipoResultado = "Cliente" | "Vehiculo" | "Poliza";

export interface ResultadoBusqueda {
  tipo: TipoResultado;
  id: number;
  titulo: string;
  subtitulo: string;
  referencia: number;
}

// El endpoint devuelve diccionarios; las claves pueden venir en PascalCase.
function pick<T>(obj: Record<string, unknown>, ...keys: string[]): T {
  for (const k of keys) if (obj[k] != null) return obj[k] as T;
  return undefined as T;
}

export async function buscarGlobal(q: string): Promise<ResultadoBusqueda[]> {
  if (!q.trim()) return [];
  const { data } = await api.get<Record<string, unknown>[]>("/search", { params: { q } });
  return data.map((r) => ({
    tipo: pick<TipoResultado>(r, "Tipo", "tipo"),
    id: pick<number>(r, "Id", "id"),
    titulo: pick<string>(r, "Titulo", "titulo"),
    subtitulo: pick<string>(r, "Subtitulo", "subtitulo"),
    referencia: pick<number>(r, "Referencia", "referencia"),
  }));
}
