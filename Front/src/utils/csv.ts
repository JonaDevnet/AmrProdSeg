/**
 * Descarga un CSV (delimitador ";", con BOM para que Excel respete acentos).
 * `filas` es una matriz de celdas (la primera suele ser el encabezado).
 */
export function descargarCSV(nombre: string, filas: (string | number)[][]) {
  const csv = filas
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        })
        .join(";")
    )
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
