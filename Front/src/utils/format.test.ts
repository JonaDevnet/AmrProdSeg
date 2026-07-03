import { describe, it, expect } from "vitest";
import { formatFecha, formatMoneda } from "./format";

describe("formatFecha", () => {
  it("devuelve '—' para null/undefined/inválido", () => {
    expect(formatFecha(null)).toBe("—");
    expect(formatFecha(undefined)).toBe("—");
    expect(formatFecha("no-es-fecha")).toBe("—");
  });

  it("formatea una fecha ISO a dd/mm/yyyy (es-AR)", () => {
    expect(formatFecha("2026-06-30T00:00:00")).toBe("30/06/2026");
  });
});

describe("formatMoneda", () => {
  it("formatea en ARS con separador de miles", () => {
    const s = formatMoneda(1234567);
    expect(s).toContain("$");
    expect(s).toContain("1.234.567");
  });
});
