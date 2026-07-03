// Paleta central de colores de compañías — portada de disenioAMR (CO_PALETTE).
// Las compañías reales vienen del backend; se colorean por su posición en la lista.

export const CO_PALETTE = [
  "oklch(0.52 0.16 28)", "oklch(0.45 0.13 250)", "oklch(0.46 0.12 155)",
  "oklch(0.50 0.14 200)", "oklch(0.54 0.13 65)", "oklch(0.48 0.15 300)",
  "oklch(0.50 0.15 18)", "oklch(0.46 0.12 140)", "oklch(0.48 0.14 270)",
  "oklch(0.52 0.14 95)",
];

/** Color estable por índice (wrap-around sobre la paleta). */
export const coColor = (i: number) =>
  CO_PALETTE[((i % CO_PALETTE.length) + CO_PALETTE.length) % CO_PALETTE.length];
