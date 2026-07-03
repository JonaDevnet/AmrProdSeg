import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  clearSession,
  getToken,
  setSession,
  SESSION_KEY,
} from "../security/axiosInstance";
import { login as apiLogin, logout as apiLogout } from "../api/auth";
import type { Rol } from "../types";

interface SesionUsuario {
  nombre: string;
  rol: Rol;
}

interface AuthContextValue {
  usuario: SesionUsuario | null;
  autenticado: boolean;
  esAdmin: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function leerSesion(): SesionUsuario | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw || !getToken()) return null;
  try {
    return JSON.parse(raw) as SesionUsuario;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<SesionUsuario | null>(leerSesion);

  useEffect(() => {
    setUsuario(leerSesion());
  }, []);

  async function iniciarSesion(email: string, password: string) {
    const result = await apiLogin(email, password);
    setSession(result);
    setUsuario({ nombre: result.nombre, rol: result.rol });
  }

  async function cerrarSesion() {
    await apiLogout();
    clearSession();
    setUsuario(null);
  }

  const value: AuthContextValue = {
    usuario,
    autenticado: usuario !== null,
    esAdmin: usuario?.rol === "Admin",
    iniciarSesion,
    cerrarSesion,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
