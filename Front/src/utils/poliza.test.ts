import { describe, it, expect } from "vitest";
import { estadoPolizaUI, debeRenovar, mesesEntre } from "./poliza";

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

describe("mesesEntre", () => {
  it("calcula meses enteros entre fechas", () => {
    expect(mesesEntre("2026-08-28", "2026-11-28")).toBe(3);
    expect(mesesEntre("2026-08-28", "2027-08-28")).toBe(12);
    expect(mesesEntre("2026-01-15", "2026-02-15")).toBe(1);
  });
});

describe("debeRenovar", () => {
  const base = { fechaInicio: "2026-08-28", fechaFin: "2026-11-28", cantidadCuotas: 3 };
  const hoy = "2026-10-30";

  it("trimestral + 3 cuotas → Renovar (cubre todo el período)", () => {
    expect(debeRenovar(base, hoy)).toBe(true);
  });

  it("anual + 3 cuotas → Refacturar (quedan meses de vigencia)", () => {
    expect(debeRenovar({ ...base, fechaFin: "2027-08-28" }, hoy)).toBe(false);
  });

  it("anual + 3 cuotas con fin pasado → Renovar", () => {
    expect(debeRenovar({ ...base, fechaInicio: "2025-08-28", fechaFin: "2026-08-28" }, hoy)).toBe(true);
  });

  it("mensual + 1 cuota → Renovar", () => {
    expect(debeRenovar({ fechaInicio: "2026-10-01", fechaFin: "2026-11-01", cantidadCuotas: 1 }, "2026-10-15")).toBe(true);
  });

  it("anual + 12 cuotas → Renovar (las cuotas cubren todo)", () => {
    expect(debeRenovar({ fechaInicio: "2026-01-01", fechaFin: "2027-01-01", cantidadCuotas: 12 }, "2026-06-01")).toBe(true);
  });
});
