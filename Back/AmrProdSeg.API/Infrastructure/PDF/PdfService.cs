using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AmrProdSeg.API.Infrastructure.PDF;

/// <summary>
/// Generación de PDFs con QuestPDF: comprobantes de póliza y tablas genéricas
/// para los reportes exportables.
/// </summary>
public class PdfService : IPdfService
{
    private readonly IWebHostEnvironment _env;

    public PdfService(IWebHostEnvironment env) => _env = env;

    public Task<byte[]> GenerarComprobanteAsync(Poliza poliza)
    {
        var bytes = Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Margin(40);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(t => t.FontSize(11));

                page.Header().Text($"Comprobante de Póliza {poliza.Numero}")
                    .FontSize(18).Black();

                page.Content().PaddingVertical(20).Column(col =>
                {
                    col.Spacing(6);
                    col.Item().Text($"Número: {poliza.Numero}");
                    col.Item().Text($"Vigencia: {poliza.FechaInicio:dd/MM/yyyy} – {poliza.FechaFin:dd/MM/yyyy}");
                    col.Item().Text($"Precio total: $ {poliza.PrecioTotal:N2}");
                    col.Item().Text($"Cuotas: {poliza.CantidadCuotas}");
                    col.Item().Text($"Estado: {poliza.Estado}");
                    col.Item().Text($"Emitida: {poliza.FechaEmision:dd/MM/yyyy HH:mm}");
                });

                page.Footer().AlignCenter().Text("AMR Producción Seguros");
            });
        }).GeneratePdf();

        return Task.FromResult(bytes);
    }

    public async Task<string> GenerarComprobantePdfAsync(Poliza poliza)
    {
        var bytes = await GenerarComprobanteAsync(poliza);

        var carpeta = Path.Combine(_env.WebRootPath ?? "wwwroot", "comprobantes");
        Directory.CreateDirectory(carpeta);

        // El número puede contener caracteres no válidos para nombre de archivo
        // (p. ej. "E/T-000020"); los reemplazamos para no romper la ruta.
        var seguro = poliza.Numero;
        foreach (var c in Path.GetInvalidFileNameChars())
            seguro = seguro.Replace(c, '-');

        var archivo = $"{seguro}.pdf";
        await File.WriteAllBytesAsync(Path.Combine(carpeta, archivo), bytes);

        return $"/comprobantes/{archivo}";
    }

    private ComprobanteCobroData MapearComprobante(ComprobanteCobroDto dto) => new(
        dto.ReciboNumero, dto.FechaPago, dto.PolizaNumero, dto.Compania, dto.Asegurado,
        dto.RiesgoAsegurado, dto.Dominio, dto.Anio, dto.CuotaActual, dto.CuotasTotal,
        dto.ProxVencimiento, dto.Importe, dto.Cobertura, dto.MedioPago, dto.QrUrl);

    private byte[]? CargarLogo()
    {
        var logoPath = Path.Combine(_env.WebRootPath ?? "wwwroot", "logo.png");
        return File.Exists(logoPath) ? File.ReadAllBytes(logoPath) : null;
    }

    // Online: comprobante (1ª hoja) + ticket (2ª hoja) en un solo PDF.
    public byte[] GenerarComprobanteCobro(ComprobanteCobroDto dto)
        => ComprobanteCobroDocument.Generar(MapearComprobante(dto), CargarLogo());

    // Impresión: solo el comprobante (1ª hoja) con talón recortable.
    public byte[] GenerarComprobanteImpresion(ComprobanteCobroDto dto)
        => ComprobanteCobroDocument.GenerarComprobante(MapearComprobante(dto), CargarLogo(), conTalon: true);

    // Impresión: solo el ticket (2ª hoja)
    public byte[] GenerarTicketImpresion(ComprobanteCobroDto dto)
        => ComprobanteCobroDocument.GenerarTicket(MapearComprobante(dto));

    public byte[] GenerarTabla(string titulo, List<Dictionary<string, object?>> filas)
    {
        var columnas = filas.Count > 0 ? filas[0].Keys.ToList() : new List<string>();

        return Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Margin(30);
                page.Size(PageSizes.A4.Landscape());
                page.DefaultTextStyle(t => t.FontSize(10));

                page.Header().Text(titulo).FontSize(16).Black();

                page.Content().PaddingVertical(15).Table(table =>
                {
                    table.ColumnsDefinition(def =>
                    {
                        foreach (var _ in columnas) def.RelativeColumn();
                    });

                    foreach (var col in columnas)
                        table.Cell().Background(Colors.Black).Padding(4).Text(col).Black();

                    foreach (var fila in filas)
                        foreach (var col in columnas)
                            table.Cell().Padding(4).Text(fila[col]?.ToString() ?? "");
                });

                page.Footer().AlignRight().Text(t =>
                {
                    t.Span("Página ");
                    t.CurrentPageNumber();
                });
            });
        }).GeneratePdf();
    }
}
