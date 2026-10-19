// Marca de actividad compartida entre el login, el control de inactividad y el cierre de sesión.
// Vive en localStorage para que sea global entre pestañas.
export const ACTIVIDAD_KEY = "amr_ultima_actividad";

export function leerActividad(): number {
  const v = Number(localStorage.getItem(ACTIVIDAD_KEY) ?? 0);
  return Number.isFinite(v) ? v : 0;
}

export function marcarActividadAhora(): void {
  try {
    localStorage.setItem(ACTIVIDAD_KEY, String(Date.now()));
  } catch {
    /* almacenamiento no disponible */
  }
}
