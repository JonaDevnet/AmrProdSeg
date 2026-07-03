// Paleta de colores por compañía (portada de los prototipos — CO_PALETTE)
const PALETA = [
  "oklch(0.52 0.16 28)",
  "oklch(0.45 0.13 250)",
  "oklch(0.46 0.12 155)",
  "oklch(0.50 0.14 200)",
  "oklch(0.54 0.13 65)",
  "oklch(0.48 0.15 300)",
  "oklch(0.50 0.15 18)",
  "oklch(0.46 0.12 140)",
  "oklch(0.48 0.14 270)",
  "oklch(0.52 0.14 95)",
];

export function companiaColor(id: number): string {
  if (!id || id < 1) return "var(--ink-400)";
  return PALETA[(id - 1) % PALETA.length];
}
