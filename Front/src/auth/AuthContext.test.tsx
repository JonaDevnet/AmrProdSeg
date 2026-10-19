import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { ACTIVIDAD_KEY, leerActividad } from "./activity";

vi.mock("../api/auth", () => ({
  login: vi.fn().mockResolvedValue({
    accessToken: "access-test",
    refreshToken: "refresh-test",
    nombre: "Usuario Test",
    rol: "Admin",
  }),
  logout: vi.fn(),
}));

function Probe() {
  const { iniciarSesion, autenticado } = useAuth();
  return (
    <button onClick={() => void iniciarSesion("test@amr.com", "12345678")}>
      {autenticado ? "autenticado" : "desautenticado"}
    </button>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("reinicia la marca de inactividad al iniciar sesión", async () => {
    localStorage.setItem(
      ACTIVIDAD_KEY,
      String(Date.now() - 31 * 60 * 1000)
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent("autenticado");
    });

    expect(Date.now() - leerActividad()).toBeLessThan(2000);
  });
});
