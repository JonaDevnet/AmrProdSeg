using AmrProdSeg.API.Application.Interfaces;
using ClosedXML.Excel;

namespace AmrProdSeg.API.Infrastructure.Excel;

/// <summary>
/// Exportación a Excel con ClosedXML. Recibe filas genéricas (columna→valor)
/// y arma una hoja con encabezados y datos.
/// </summary>
public class ExcelExportService : IExcelExportService
{
    public byte[] Exportar(string hoja, List<Dictionary<string, object?>> filas)
    {
        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add(string.IsNullOrWhiteSpace(hoja) ? "Reporte" : hoja);

        var columnas = filas.Count > 0 ? filas[0].Keys.ToList() : new List<string>();

        // Encabezados
        for (int c = 0; c < columnas.Count; c++)
        {
            var cell = ws.Cell(1, c + 1);
            cell.Value = columnas[c];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.LightGray;
        }

        // Datos
        for (int r = 0; r < filas.Count; r++)
        {
            for (int c = 0; c < columnas.Count; c++)
            {
                var valor = filas[r][columnas[c]];
                ws.Cell(r + 2, c + 1).Value = XLCellValue.FromObject(valor);
            }
        }

        if (columnas.Count > 0)
            ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }
}
