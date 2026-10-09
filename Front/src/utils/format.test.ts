import { describe, it, expect } from "vitest";
import { formatFecha, formatMoneda } from "./format";

// Fecha "esperada" construida en hora LOCAL, para no depender de la zona horaria del runner.
const esperadoLocal = (y: number, mes: number, d: number) =>
  new Date(y, mes - 1, d).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

describe("formatFecha", () => {
  it("devuelve '—' para null/undefined/inválido", () => {
    expect(formatFecha(null)).toBe("—");
    expect(formatFecha(undefined)).toBe("—");
    expect(formatFecha("no-es-fecha")).toBe("—");
  });

  it("formatea una fecha ISO a dd/mm/yyyy (es-AR)", () => {
    expect(formatFecha("2026-06-30T00:00:00")).toBe("30/06/2026");
  });

  it("una fecha-solo (YYYY-MM-DD) se interpreta en hora local y no resta un día", () => {
    expect(formatFecha("2026-10-24")).toBe(esperadoLocal(2026, 10, 24));
  });
});

describe("formatMoneda", () => {
  it("formatea en ARS con separador de miles", () => {
    const s = formatMoneda(1234567);
    expect(s).toContain("$");
    expect(s).toContain("1.234.567");
  });
});
