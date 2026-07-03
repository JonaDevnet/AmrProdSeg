import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  getSmtpConfig: vi.fn(),
  actualizarSmtpConfig: vi.fn(),
  getWhatsappConfig: vi.fn(),
  actualizarWhatsappConfig: vi.fn(),
}));
vi.mock("../api/configuracion", () => mocks);

import Configuracion from "./Configuracion";

beforeEach(() => {
  mocks.getSmtpConfig.mockResolvedValue({
    habilitado: true, host: "smtp.test", port: 587, usarSsl: true,
    usuario: "u@test.com", from: "emisor@test.com", fromNombre: "AMR", passwordConfigurada: true,
  });
  mocks.actualizarSmtpConfig.mockResolvedValue(undefined);
  mocks.getWhatsappConfig.mockResolvedValue({
    habilitado: false, baseUrl: "http://localhost:8080", instance: "amr", apiKeyConfigurada: false,
  });
  mocks.actualizarWhatsappConfig.mockResolvedValue(undefined);
});

describe("Configuracion (Admin)", () => {
  it("carga la config y muestra el correo emisor", async () => {
    render(<Configuracion />);
    const from = await screen.findByPlaceholderText("no-responder@amrseguros.com.ar");
    await waitFor(() => expect((from as HTMLInputElement).value).toBe("emisor@test.com"));
  });

  it("al guardar (SMTP) llama al endpoint de actualización", async () => {
    render(<Configuracion />);
    await screen.findByPlaceholderText("no-responder@amrseguros.com.ar");
    const botones = screen.getAllByRole("button", { name: /guardar configuración/i });
    await userEvent.click(botones[0]); // tarjeta SMTP
    await waitFor(() => expect(mocks.actualizarSmtpConfig).toHaveBeenCalled());
  });
});
