import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import Verificar from "./pages/Verificar";
import Login from "./pages/Login";
import Cartera from "./pages/Cartera";
import ClienteFicha from "./pages/ClienteFicha";
import Polizas from "./pages/Polizas";
import PolizaDetalle from "./pages/PolizaDetalle";
import Cobranzas from "./pages/Cobranzas";
import Alta from "./pages/Alta";
import Editar from "./pages/Editar";
import Bajas from "./pages/Bajas";
import Finanzas from "./pages/Finanzas";
import Recuperar from "./pages/Recuperar";
import Usuarios from "./pages/Usuarios";
import Companias from "./pages/Companias";
import Configuracion from "./pages/Configuracion";

// Reportes incluye Recharts → se carga en un chunk aparte
const Reportes = lazy(() => import("./pages/Reportes"));

// Raíz pública: landing para visitantes; portal (Cartera) si ya hay sesión.
function RootGate() {
  const { autenticado } = useAuth();
  return autenticado ? <Navigate to="/cartera" replace /> : <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootGate />} />
          <Route path="/verificar/:id" element={<Verificar />} />
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar" element={<Recuperar />} />

          {/* Rutas autenticadas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/cartera" element={<Cartera />} />
              <Route path="/clientes/:id" element={<ClienteFicha />} />
              <Route path="/polizas" element={<Polizas />} />
              <Route path="/polizas/:id" element={<PolizaDetalle />} />
              <Route path="/cobranzas" element={<Cobranzas />} />
              <Route path="/alta" element={<Alta />} />
              <Route path="/editar/:modo" element={<Editar />} />
              <Route path="/bajas" element={<Bajas />} />
              <Route path="/finanzas" element={<Finanzas />} />
              <Route
                path="/reportes"
                element={
                  <Suspense fallback={<div style={{ padding: 40, color: "var(--ink-400)" }}>Cargando…</div>}>
                    <Reportes />
                  </Suspense>
                }
              />
            </Route>
          </Route>

          {/* Rutas sólo Admin */}
          <Route element={<ProtectedRoute soloAdmin />}>
            <Route element={<AppLayout />}>
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/companias" element={<Companias />} />
              <Route path="/configuracion" element={<Configuracion />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
