import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useAuth } from "../auth/AuthContext";
import { getToken } from "../security/axiosInstance";

const BASE = import.meta.env.VITE_API_URL ?? "/api";

/**
 * Conecta al hub de SignalR con la sesión activa. Al recibir el evento
 * "notificaciones" invalida las consultas de la campanita para que se refresquen
 * al instante. Si el canal no está disponible, el polling de respaldo (60 s)
 * sigue manteniendo la campanita actualizada.
 */
export function useRealtimeNotificaciones() {
  const qc = useQueryClient();
  const { autenticado } = useAuth();

  useEffect(() => {
    if (!autenticado) return;

    const conn = new HubConnectionBuilder()
      .withUrl(`${BASE}/notificaciones/hub`, { accessTokenFactory: () => getToken() ?? "" })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    conn.on("notificaciones", () => {
      qc.invalidateQueries({ queryKey: ["notif"] });
      qc.invalidateQueries({ queryKey: ["solicitudes-cambio"] });
    });

    conn.start().catch(() => {
      // Silencioso a propósito: el refresco de respaldo cubre la actualización.
    });

    return () => { void conn.stop(); };
  }, [autenticado, qc]);
}
