import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

/** Requiere sesión activa; opcionalmente, rol Admin. */
export default function ProtectedRoute({ soloAdmin = false }: { soloAdmin?: boolean }) {
  const { autenticado, esAdmin } = useAuth();

  if (!autenticado) return <Navigate to="/login" replace />;
  if (soloAdmin && !esAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
