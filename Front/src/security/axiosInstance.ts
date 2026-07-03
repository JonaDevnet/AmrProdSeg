import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

// Claves de sessionStorage (el token vive sólo mientras la pestaña esté abierta)
export const TOKEN_KEY = "amr_access_token";
export const REFRESH_KEY = "amr_refresh_token";
export const SESSION_KEY = "amr_session";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setSession(data: {
  accessToken: string;
  refreshToken: string;
  nombre: string;
  rol: string;
}) {
  sessionStorage.setItem(TOKEN_KEY, data.accessToken);
  sessionStorage.setItem(REFRESH_KEY, data.refreshToken);
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ nombre: data.nombre, rol: data.rol })
  );
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});

// Request — adjunta el token en cada petición
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Evita múltiples refresh simultáneos
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = sessionStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_API_URL ?? "/api"}/auth/refresh`,
      { refreshToken }
    );
    setSession(data);
    return data.accessToken as string;
  } catch {
    return null;
  }
}

// Response — maneja 401 (refresh + reintento) y 429 (rate limit)
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const nuevoToken = await refreshing;
      refreshing = null;

      if (nuevoToken) {
        original.headers.Authorization = `Bearer ${nuevoToken}`;
        return api.request(original);
      }
      // Refresh falló — limpiar sesión y volver al login
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (status === 429) {
      console.warn("Demasiadas solicitudes. Esperá un momento.");
    }

    return Promise.reject(error);
  }
);

export default api;
