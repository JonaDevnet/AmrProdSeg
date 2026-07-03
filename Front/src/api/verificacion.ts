// Verificación pública de póliza (destino del QR). No requiere autenticación.
export interface Verificacion {
  clienteNombre: string;
  documento: string;     // enmascarado desde el backend (ej. 12***032)
  compania: string;
  nroPoliza: string;
  marca: string;
  modelo: string;
  patente: string;
  anio: string;
  cobertura: string;
  vigente: boolean;
  proximoVencimiento: string | null;
}

export async function verificarPoliza(id: string | number): Promise<Verificacion | null> {
  const base = import.meta.env.VITE_API_URL ?? "/api";
  const res = await fetch(`${base}/verificar/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("No se pudo verificar la póliza.");
  return res.json();
}
