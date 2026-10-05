import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "../security/axiosInstance";

const LIMITE_MS = 30 * 60 * 1000;   // 30 minutos de inactividad
const AVISO_MS = 60 * 1000;         // se avisa 1 minuto antes del cierre
const CLAVE = "amr_ultima_actividad";       // marca global (compartida entre pestañas)
const CLAVE_CIERRE = "amr_sesion_cerrada";  // señal de cierre global
const THROTTLE_MS = 10 * 1000;      // no reescribir la marca en cada mousemove
const HEARTBEAT_MS = 4 * 60 * 1000; // latido al backend mientras hay actividad
const EVENTOS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel", "pointerdown"] as const;

function leer(): number {
  const v = Number(localStorage.getItem(CLAVE) ?? 0);
  return Number.isFinite(v) ? v : 0;
}
function marcar() {
  try { localStorage.setItem(CLAVE, String(Date.now())); } catch { /* ignore */ }
}

/**
 * Cierre de sesión por inactividad (30 min), global entre pestañas, con aviso 1 min antes.
 * Mantiene viva la actividad del lado servidor con un heartbeat mientras el usuario interactúa.
 */
export function useInactividad() {
  const { autenticado, cerrarSesion } = useAuth();
  const [restante, setRestante] = useState<number | null>(null);
  const cerrarRef = useRef(cerrarSesion);
  cerrarRef.current = cerrarSesion;
  const ultimoLatido = useRef(0);

  const seguir = useCallback(() => { marcar(); setRestante(null); }, []);

  useEffect(() => {
    if (!autenticado) { setRestante(null); return; }

    try { localStorage.removeItem(CLAVE_CIERRE); } catch { /* ignore */ }
    if (!leer()) marcar();

    let ultimoEscrito = 0;
    const onActividad = () => {
      const t = Date.now();
      if (t - ultimoEscrito < THROTTLE_MS) return;
      ultimoEscrito = t;
      marcar();
      setRestante(null);
      if (t - ultimoLatido.current > HEARTBEAT_MS) {
        ultimoLatido.current = t;
        api.post("/auth/actividad").catch(() => { /* el interceptor maneja el 401 */ });
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === CLAVE_CIERRE && e.newValue) { void cerrarRef.current(); return; }
      if (e.key === CLAVE && e.newValue === null) { void cerrarRef.current(); }
    };

    const tick = () => {
      const restanteMs = LIMITE_MS - (Date.now() - leer());
      if (restanteMs <= 0) {
        try { localStorage.setItem(CLAVE_CIERRE, String(Date.now())); } catch { /* ignore */ }
        void cerrarRef.current();
        return;
      }
      setRestante(restanteMs <= AVISO_MS ? Math.ceil(restanteMs / 1000) : null);
    };

    EVENTOS.forEach((ev) => window.addEventListener(ev, onActividad, { passive: true }));
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    const id = window.setInterval(tick, 1000);
    tick();

    return () => {
      window.clearInterval(id);
      EVENTOS.forEach((ev) => window.removeEventListener(ev, onActividad));
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [autenticado]);

  return { restante, seguir };
}
