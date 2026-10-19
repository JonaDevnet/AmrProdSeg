import { beforeEach, describe, expect, it } from "vitest";
import { ACTIVIDAD_KEY, leerActividad, marcarActividadAhora } from "./activity";

describe("actividad de sesión", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("sobrescribe una marca vieja al iniciar sesión", () => {
    localStorage.setItem(
      ACTIVIDAD_KEY,
      String(Date.now() - 31 * 60 * 1000)
    );

    const antes = Date.now();
    marcarActividadAhora();

    expect(leerActividad()).toBeGreaterThanOrEqual(antes);
    expect(Date.now() - leerActividad()).toBeLessThan(1000);
  });

  it("devuelve 0 cuando no hay marca", () => {
    expect(leerActividad()).toBe(0);
  });
});
