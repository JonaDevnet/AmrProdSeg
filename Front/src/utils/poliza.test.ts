import { describe, it, expect } from "vitest";
import { estadoPolizaUI } from "./poliza";

const HOY = new Date("2026-06-30T12:00:00");
const enDias = (d: number) => new Date(HOY.getTime() + d * 86_400_000).toISOString();

describe("estadoPolizaUI", () => {
  it("Cancelada → null (no se muestra en cartera)", () => {
    expect(estadoPolizaUI("Cancelada", enDias(100), HOY)).toBeNull();
  });

  it("Vencida → 'vencida' sin importar la fecha", () => {
    expect(estadoPolizaUI("Vencida", enDias(100), HOY)).toBe("vencida");
  });

  it("Activa con fin pasado → 'vencida'", () => {
    expect(estadoPolizaUI("Activa", enDias(-5), HOY)).toBe("vencida");
  });

  it("Activa que vence dentro de 10 días → 'porvencer'", () => {
    expect(estadoPolizaUI("Activa", enDias(7), HOY)).toBe("porvencer");
  });

  it("Activa que vence en más de 10 días → 'vigente'", () => {
    expect(estadoPolizaUI("Activa", enDias(20), HOY)).toBe("vigente");
  });

  it("Activa con vencimiento lejano → 'vigente'", () => {
    expect(estadoPolizaUI("Activa", enDias(120), HOY)).toBe("vigente");
  });

  it("Renovada también se evalúa por fecha", () => {
    expect(estadoPolizaUI("Renovada", enDias(200), HOY)).toBe("vigente");
  });
});
