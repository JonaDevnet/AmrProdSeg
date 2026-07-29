import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  getResendConfig: vi.fn(),
  actualizarResendConfig: vi.fn(),
  probarResend: vi.fn(),
  getWhatsappConfig: vi.fn(),
  actualizarWhatsappConfig: vi.fn(),
  probarWhatsapp: vi.fn(),
}));
vi.mock("../api/configuracion", () => mocks);

import Configuracion from "./Configuracion";

beforeEach(() => {
  mocks.getResendConfig.mockResolvedValue({
    habilitado: true, from: "emisor@test.com", fromNombre: "AMR", apiKeyConfigurada: true,
  });
  mocks.actualizarResendConfig.mockResolvedValue(undefined);
  mocks.probarResend.mockResolvedValue({ ok: true, mensaje: "Correo de prueba enviado." });
  mocks.getWhatsappConfig.mockResolvedValue({
    habilitado: false, baseUrl: "http://localhost:8080", instance: "amr", apiKeyConfigurada: false,
  });
  mocks.actualizarWhatsappConfig.mockResolvedValue(undefined);
  mocks.probarWhatsapp.mockResolvedValue({ ok: true, mensaje: "Enviado." });
});

describe("Configuracion (Admin)", () => {
  it("carga la config y muestra el correo emisor", async () => {
    render(<Configuracion />);
    const from = await screen.findByPlaceholderText("no-reply@amrprodseg.com");
    await waitFor(() => expect((from as HTMLInputElement).value).toBe("emisor@test.com"));
  });

  it("al guardar (Resend) llama al endpoint de actualización", async () => {
    render(<Configuracion />);
    await screen.findByPlaceholderText("no-reply@amrprodseg.com");
    const botones = screen.getAllByRole("button", { name: /guardar configuración/i });
    await userEvent.click(botones[0]); // tarjeta Resend
    await waitFor(() => expect(mocks.actualizarResendConfig).toHaveBeenCalled());
  });
});
