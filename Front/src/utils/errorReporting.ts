// Reporte de errores del navegador (SPA) → POST /api/diagnostics/errores.
// Captura errores no controlados (window.onerror) y promesas rechazadas, los junta
// en lote y los envía con sendBeacon (robusto, no interfiere con axios/refresh).
// Se registra desde main.tsx. Nunca debe romper la app ni generar bucles.

const ENDPOINT = `${import.meta.env.VITE_API_URL ?? "/api"}/diagnostics/errores`;

let cola: Array<{ mensaje: string; stack?: string; url?: string; userAgent?: string }> = [];
let timer: number | null = null;

function encolar(item: { mensaje: string; stack?: string }) {
  cola.push({ ...item, url: window.location.href, userAgent: navigator.userAgent });
  if (cola.length >= 20) {
    vaciar();
  } else if (timer === null) {
    timer = window.setTimeout(vaciar, 5000);
  }
}

function vaciar() {
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
  const lote = cola;
  cola = [];
  if (lote.length === 0) return;
  try {
    const cuerpo = JSON.stringify(lote);
    const blob = new Blob([cuerpo], { type: "application/json" });
    navigator.sendBeacon(ENDPOINT, blob);
  } catch {
    // Nunca propagar fallos del reporte.
  }
}

function stackDe(arg: unknown): string | undefined {
  if (arg instanceof Error) return arg.stack ?? `${arg.name}: ${arg.message}`;
  if (typeof arg === "string") return arg;
  return arg === undefined ? undefined : String(arg);
}

export function iniciarReporteErrores() {
  window.addEventListener("error", (e) => {
    encolar({ mensaje: e.message || "window.onerror", stack: stackDe(e.error) });
  });
  window.addEventListener("unhandledrejection", (e) => {
    encolar({ mensaje: "Promesa rechazada", stack: stackDe(e.reason) });
  });
}