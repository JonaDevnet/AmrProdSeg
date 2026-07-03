import { describe, it, expect } from "vitest";
import { CO_PALETTE, coColor } from "./companias";

describe("coColor", () => {
  it("devuelve el color de la paleta por índice", () => {
    expect(coColor(0)).toBe(CO_PALETTE[0]);
    expect(coColor(2)).toBe(CO_PALETTE[2]);
  });

  it("hace wrap-around cuando el índice supera la paleta", () => {
    expect(coColor(CO_PALETTE.length)).toBe(CO_PALETTE[0]);
    expect(coColor(CO_PALETTE.length + 3)).toBe(CO_PALETTE[3]);
  });

  it("tolera índices negativos", () => {
    expect(coColor(-1)).toBe(CO_PALETTE[CO_PALETTE.length - 1]);
  });
});
