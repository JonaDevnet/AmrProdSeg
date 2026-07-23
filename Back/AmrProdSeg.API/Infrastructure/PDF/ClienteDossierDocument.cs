using AmrProdSeg.API.Application.DTOs;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AmrProdSeg.API.Infrastructure.PDF;

/// <summary>
/// Ficha completa del cliente en PDF: datos personales, vehículos y TODAS las pólizas
/// (activas, vencidas, renovadas o canceladas), con el estado de cada una.
/// </summary>
public static class ClienteDossierDocument
{
    private const string Navy = "#0f2038";
    private const string Line = "#d9dee6";
    private const string Ink = "#5b6472";

    public static byte[] Generar(ClienteDossierData d, byte[]? logo)
    {
        return Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Margin(34);
                page.Size(PageSizes.A4);
                page.DefaultTextStyle(t => t.FontSize(9.5f));

                // ── Encabezado ──
                page.Header().Row(row =>
                {
                    if (logo is not null)
                        row.ConstantItem(46).AlignMiddle().Image(logo).FitWidth();
                    row.RelativeItem().PaddingLeft(logo is null ? 0 : 10).Column(c =>
                    {
                        c.Item().Text("Ficha del cliente").FontSize(16).Bold().FontColor(Navy);
                        c.Item().Text(d.Nombre).FontSize(12).SemiBold();
                    });
                    row.ConstantItem(150).AlignRight().Text($"Emitida {DateTime.Now:dd/MM/yyyy HH:mm}")
                        .FontSize(8).FontColor(Ink);
                });

                page.Content().PaddingVertical(14).Column(col =>
                {
                    col.Spacing(16);

                    // ── Datos del cliente ──
                    col.Item().Column(c =>
                    {
                        Titulo(c, "Datos del cliente");
                        c.Item().Table(t =>
                        {
                            t.ColumnsDefinition(x => { x.RelativeColumn(); x.RelativeColumn(); });
                            Dato(t, "Documento", $"{d.TipoDocumento ?? "DNI"} {d.Documento}");
                            Dato(t, "Alta", d.FechaAlta.ToString("dd/MM/yyyy"));
                            Dato(t, "Email", string.IsNullOrWhiteSpace(d.Email) ? "—" : d.Email!);
                            Dato(t, "Teléfono", string.IsNullOrWhiteSpace(d.Telefono) ? "—" : d.Telefono!);
                            Dato(t, "Dirección", string.IsNullOrWhiteSpace(d.Direccion) ? "—" : d.Direccion!);
                            Dato(t, "Nacimiento", d.FechaNacimiento?.ToString("dd/MM/yyyy") ?? "—");
                        });
                    });

                    // ── Vehículos ──
                    col.Item().Column(c =>
                    {
                        Titulo(c, $"Vehículos ({d.Vehiculos.Count})");
                        if (d.Vehiculos.Count == 0) { c.Item().Text("Sin vehículos.").FontColor(Ink); return; }
                        c.Item().Table(t =>
                        {
                            t.ColumnsDefinition(x => { x.ConstantColumn(72); x.RelativeColumn(2); x.ConstantColumn(42); x.RelativeColumn(2); x.RelativeColumn(2); x.RelativeColumn(1.4f); });
                            Head(t, "Patente", "Marca / Modelo", "Año", "N° chasis", "N° motor", "Combustión");
                            foreach (var v in d.Vehiculos)
                                Fila(t, v.Patente, $"{v.Marca} {v.Modelo}".Trim(), v.Anio == 0 ? "—" : v.Anio.ToString(),
                                     v.Chasis ?? "—", v.Motor ?? "—", v.Combustion ?? "—");
                        });
                    });

                    // ── Pólizas (todas, con estado) ──
                    col.Item().Column(c =>
                    {
                        Titulo(c, $"Pólizas ({d.Polizas.Count})");
                        if (d.Polizas.Count == 0) { c.Item().Text("Sin pólizas.").FontColor(Ink); return; }
                        c.Item().Table(t =>
                        {
                            t.ColumnsDefinition(x => { x.RelativeColumn(1.3f); x.ConstantColumn(58); x.RelativeColumn(1.6f); x.RelativeColumn(1.6f); x.ConstantColumn(64); x.RelativeColumn(2f); x.RelativeColumn(1.2f); x.ConstantColumn(40); });
                            Head(t, "Número", "Estado", "Compañía", "Cobertura", "Patente", "Vigencia", "Precio total", "Cuotas");
                            foreach (var p in d.Polizas)
                                Fila(t, p.Numero, p.Estado, p.Compania, p.Cobertura ?? p.Ramo ?? "—", p.Patente ?? "—",
                                     $"{p.FechaInicio:dd/MM/yy} – {p.FechaFin:dd/MM/yy}", $"$ {p.PrecioTotal:N0}", p.CantidadCuotas.ToString());
                        });
                    });
                });

                page.Footer().AlignCenter().Text("AMR Producción de Seguros").FontSize(8).FontColor(Ink);
            });
        }).GeneratePdf();
    }

    private static void Titulo(ColumnDescriptor c, string txt) =>
        c.Item().PaddingBottom(4).BorderBottom(1).BorderColor(Line).Text(txt).FontSize(11).Bold().FontColor(Navy);

    private static void Dato(TableDescriptor t, string k, string v)
    {
        t.Cell().PaddingVertical(2).Text(txt => { txt.Span($"{k}: ").FontColor(Ink); txt.Span(v).SemiBold(); });
    }

    private static void Head(TableDescriptor t, params string[] cols)
    {
        foreach (var col in cols)
            t.Cell().Background(Navy).Padding(4).Text(col).FontColor("#ffffff").FontSize(8.5f).SemiBold();
    }

    private static void Fila(TableDescriptor t, params string[] cells)
    {
        foreach (var cell in cells)
            t.Cell().BorderBottom(1).BorderColor(Line).Padding(4).Text(cell).FontSize(8.5f);
    }
}
