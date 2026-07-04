using System.Globalization;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AmrProdSeg.API.Infrastructure.PDF;

/// <summary>Datos que se completan con la info real del cliente/póliza/cobro.</summary>
public record ComprobanteCobroData(
    string ReciboNumero,            // N° identificatorio del comprobante (= recibo = identificación)
    DateTime FechaPago,            // fecha + hora del cobro
    string PolizaNumero,
    string Compania,
    string Asegurado,
    string RiesgoAsegurado,        // marca + modelo
    string Dominio,                // patente
    string Anio,
    int CuotaActual,
    int CuotasTotal,
    DateTime? ProxVencimiento,
    decimal Importe,
    string Cobertura,
    string MedioPago,              // "Efectivo" | "Transferencia"
    string QrUrl                   // URL de verificación (web propia)
);

/// <summary>
/// Comprobante de pago de cuota: réplica del modelo de AMR.
/// Página 1 = comprobante · Página 2 = ticket. Se generan juntas (mismo PDF).
/// </summary>
public static class ComprobanteCobroDocument
{
    private static readonly CultureInfo Es = new("es-AR");
    // Membrete del productor (fijo)
    private const string RAZON = "AMRINALDI PRODUCCIÓN DE SEGUROS";
    private const string TITULAR = "de ALBERTO MATEO RINALDI";
    private const string RUBRO = "PRODUCTOR ASESOR DE SEGUROS - PATRIMONIALES Y VIDA";
    private const string DIR1 = "Aristóbulo del Valle 980 - 1 El Algarrobal, LH, Mza - Cel: 2617025624";
    private const string DIR2 = "Avellaneda 2626, Guaymallén, Mza - Cel: 2616110072";
    private const string EMISOR = "AMRINALDI Producción de Seguros";
    private const string BANCO = "Cta Cte BANCO PATAGONIA S.A.";
    private const string CUENTA_TICKET = "Cc $ 060********9001 de Banco Patagonia";

    private static string Money(decimal m) => "$ " + m.ToString("N2", Es);

    /// <summary>Documento completo (comprobante 1ª hoja + ticket 2ª hoja). Se usa en el envío online (email/WhatsApp).</summary>
    public static byte[] Generar(ComprobanteCobroData d, byte[]? logo) => Build(d, logo).GeneratePdf();

    /// <summary>Solo el COMPROBANTE (1ª hoja). conTalon=true agrega el talón recortable a la derecha (impresión).</summary>
    public static Document BuildComprobante(ComprobanteCobroData d, byte[]? logo, bool conTalon = false) =>
        Document.Create(doc => doc.Page(page => PaginaComprobante(page, d, logo, conTalon)));

    public static byte[] GenerarComprobante(ComprobanteCobroData d, byte[]? logo, bool conTalon = false) =>
        BuildComprobante(d, logo, conTalon).GeneratePdf();

    /// <summary>Solo el TICKET (2ª hoja), sin logo. Para imprimir en el mostrador.</summary>
    public static Document BuildTicket(ComprobanteCobroData d) =>
        Document.Create(doc => doc.Page(page => PaginaTicket(page, d)));

    public static byte[] GenerarTicket(ComprobanteCobroData d) => BuildTicket(d).GeneratePdf();

    public static Document Build(ComprobanteCobroData d, byte[]? logo) => Document.Create(doc =>
    {
        doc.Page(page => PaginaComprobante(page, d, logo, conTalon: false));
        doc.Page(page => PaginaTicket(page, d));
    });

    /// <summary>Página 1 — COMPROBANTE. conTalon (impresión) = hoja A4 vertical con el comprobante en la
    /// franja superior + talón recortable a la derecha. Online = franja compacta (1/4 de A4).</summary>
    private static void PaginaComprobante(PageDescriptor page, ComprobanteCobroData d, byte[]? logo, bool conTalon)
    {
        page.DefaultTextStyle(t => t.FontSize(6f).FontColor("#000000"));

        if (conTalon)
        {
            // Impresión: A4 vertical completa; el comprobante queda arriba (no se centra ni rota).
            page.Size(PageSizes.A4);
            page.Margin(14);
            // Comprobante (3/4) + talón recortable (1/4 der.), separados por línea punteada. Anclado arriba.
            page.Content().AlignTop().Row(fila =>
            {
                fila.RelativeItem(3f).Column(col =>
                {
                    col.Item().Element(e => Membrete(e, logo, QrPng(d.QrUrl)));
                    col.Item().Element(e => ContenidoComprobante(e, d));
                });
                fila.ConstantItem(12).Element(LineaPunteada);
                fila.RelativeItem(1f).Element(e => Talon(e, d));
            });
        }
        else
        {
            page.Size(210, 74, Unit.Millimetre);   // A4 de ancho, 1/4 de alto (parte de arriba)
            page.Margin(6);
            page.Header().Element(e => Membrete(e, logo, QrPng(d.QrUrl)));
            page.Content().Element(e => ContenidoComprobante(e, d));
        }
    }

    /// <summary>Página 2 — TICKET / recibo térmico XP-58 (58 mm de ancho, alto continuo).
    /// Sin encabezado; el QR va al final.</summary>
    private static void PaginaTicket(PageDescriptor page, ComprobanteCobroData d)
    {
        page.ContinuousSize(58, Unit.Millimetre);            // rollo térmico 58 mm
        // Contenido anclado a la izquierda dentro de ~38 mm (área que realmente imprime la XP-58).
        page.MarginLeft(2, Unit.Millimetre);
        page.MarginRight(18, Unit.Millimetre);
        page.MarginVertical(3, Unit.Millimetre);
        page.DefaultTextStyle(t => t.FontSize(7.5f).FontColor("#000000"));

        page.Content().Column(col =>
        {
            col.Spacing(2.5f);
            col.Item().AlignCenter().Text("Comprobante de pago").Black().FontSize(9f);
            col.Item().PaddingVertical(2).LineHorizontal(0.5f).LineColor("#c8cfdc");

            void Fila(string k, string v) => col.Item().Row(r =>
            {
                r.RelativeItem(1f).Text(k).FontColor("#000000");
                r.RelativeItem(1.4f).AlignRight().Text(v).Bold();
            });

            col.Item().Row(r =>
            {
                r.RelativeItem(1f).AlignMiddle().Text("Importe").FontColor("#333333");
                r.RelativeItem(1.4f).AlignRight().Text(Money(d.Importe)).Bold().FontSize(9);
            });
            Fila("Compañía", d.Compania);
            Fila("Medio de pago", d.MedioPago);
            Fila("Cuenta", CUENTA_TICKET);
            Fila("Fecha / Hora", d.FechaPago.ToString("d/M/yyyy HH:mm", Es));
            Fila("Identificación", d.ReciboNumero);
            Fila("Patente", d.Dominio);
            Fila("Cuota", $"{d.CuotaActual}/{d.CuotasTotal}");

            col.Item().PaddingVertical(2).LineHorizontal(0.5f).LineColor("#c8cfdc");
            col.Item().AlignCenter().Text("COMPROBANTE VALIDO CONSERVELO.").SemiBold().FontSize(6.5f);
            col.Item().PaddingTop(2).AlignCenter().Text(txt =>
            {
                txt.DefaultTextStyle(s => s.FontSize(5.8f).FontColor("#000000"));
                //txt.Span($"Emitido por {EMISOR} · pago del ");
                txt.Span(d.FechaPago.ToString("d/M/yyyy", Es)).Bold();
            });

            // QR al final del ticket
            col.Item().PaddingTop(6).AlignCenter().Width(24, Unit.Millimetre).Image(QrPng(d.QrUrl)).FitWidth();
            col.Item().AlignCenter().Text("Verificar con QR").FontSize(6f).FontColor("#000000");
        });
    }

    /// <summary>Cuerpo del comprobante (tablas + banco + código de barras + leyes). Reutilizado en versión online y con talón.</summary>
    private static void ContenidoComprobante(IContainer container, ComprobanteCobroData d)
    {
        container.PaddingTop(3).Column(col =>
        {
            col.Spacing(2);

            // Cabecera: Fecha de pago | Recibo N° | Póliza N° | Compañía
            col.Item().Table(t =>
            {
                t.ColumnsDefinition(c => { c.RelativeColumn(1.3f); c.RelativeColumn(0.9f); c.RelativeColumn(1.1f); c.RelativeColumn(1.4f); });
                t.Cell().Element(H).Text("Fecha de pago"); t.Cell().Element(H).Text("Recibo N°"); t.Cell().Element(H).Text("Póliza N°"); t.Cell().Element(H).Text("Compañía");
                t.Cell().Element(V).Text(d.FechaPago.ToString("d/M/yyyy HH:mm", Es));
                t.Cell().Element(V).Text(d.ReciboNumero); t.Cell().Element(V).Text(d.PolizaNumero); t.Cell().Element(V).Text(d.Compania);
            });

            // Asegurado + Riesgo Asegurado (tabla etiqueta/valor)
            col.Item().Table(t =>
            {
                t.ColumnsDefinition(c => { c.ConstantColumn(80); c.RelativeColumn(); });
                t.Cell().Element(H).Text("Asegurado"); t.Cell().Element(V).Text(d.Asegurado);
                t.Cell().Element(H).Text("Riesgo Asegurado"); t.Cell().Element(V).Text(d.RiesgoAsegurado);
            });

            // Riesgo (dominio/año/cuota/venc/importe)
            col.Item().Table(t =>
            {
                t.ColumnsDefinition(c => { c.RelativeColumn(1.1f); c.RelativeColumn(0.7f); c.RelativeColumn(0.7f); c.RelativeColumn(1.3f); c.RelativeColumn(1.1f); });
                t.Cell().Element(H).Text("Dominio"); t.Cell().Element(H).Text("Año"); t.Cell().Element(H).Text("Cuota"); t.Cell().Element(H).Text("Próx. Venc. (12 Hs)"); t.Cell().Element(H).Text("IMPORTE");
                t.Cell().Element(V).Text(d.Dominio); t.Cell().Element(V).Text(d.Anio); t.Cell().Element(V).Text($"{d.CuotaActual}/{d.CuotasTotal}");
                t.Cell().Element(V).Text(d.ProxVencimiento is null ? "—" : d.ProxVencimiento.Value.ToString("d/M/yyyy", Es));
                t.Cell().Element(V).Text(Money(d.Importe));
            });

            // Cobertura (tabla etiqueta/valor)
            col.Item().Table(t =>
            {
                t.ColumnsDefinition(c => { c.ConstantColumn(80); c.RelativeColumn(); });
                t.Cell().Element(H).Text("Cobertura"); t.Cell().Element(V).Text(d.Cobertura);
            });

            // Banco arriba, código de barras (más largo) abajo
            col.Item().PaddingTop(1).Text(BANCO).SemiBold();
            col.Item().Element(e => Barcode(e, d.ReciboNumero + d.PolizaNumero));

            // Leyes compactadas
            col.Item().PaddingTop(1).Text(LEGAL).FontSize(3.7f).FontColor("#1e1e1e").LineHeight(0.98f);
            col.Item().PaddingTop(1).Text("*** EL PAGO SE VERA REFLEJADO 2 DIAS HABILES DESPUES DE LA FECHA DE EMISION.")
                .FontSize(4.2f).SemiBold().FontColor("#333333");
        });
    }

    /// <summary>Talón recortable (solo impresión): resumen del pago para archivar/entregar. Se separa por la línea punteada.</summary>
    private static void Talon(IContainer container, ComprobanteCobroData d)
    {
        container.PaddingLeft(6).Column(col =>
        {
            col.Spacing(2.5f);
            col.Item().Text(RAZON).Bold().FontSize(6f).FontColor("#141a2e");
            col.Item().Text("TALÓN DE PAGO").SemiBold().FontSize(6f).FontColor("#2f6fe0");
            col.Item().PaddingVertical(1).LineHorizontal(0.5f).LineColor("#c8cfdc");

            void Dato(string k, string v) => col.Item().Column(cc =>
            {
                cc.Item().Text(k).FontSize(5f).FontColor("#555555");
                cc.Item().Text(v).SemiBold().FontSize(7.5f).FontColor("#000000");
            });

            Dato("Fecha de pago", d.FechaPago.ToString("d/M/yyyy HH:mm", Es));
            Dato("Recibo N°", d.ReciboNumero);
            Dato("Cliente", d.Asegurado);
            Dato("Patente", d.Dominio);
            Dato("Precio pagado", Money(d.Importe));
            Dato("Compañía", d.Compania);
            Dato("Cuota", $"{d.CuotaActual}/{d.CuotasTotal}");
            Dato("Método de pago", d.MedioPago);
        });
    }

    /// <summary>Línea vertical punteada (marca de corte del talón, solo impresión).</summary>
    private static void LineaPunteada(IContainer container)
    {
        container.AlignCenter().Column(col =>
        {
            for (int i = 0; i < 52; i++)
            {
                col.Item().Height(1.6f).Width(0.9f).Background("#555555");
                col.Item().Height(1.7f);
            }
        });
    }

    // Celdas de tabla reutilizables (tonos claros para que no salga oscuro al imprimir)
    private static IContainer H(IContainer c) => c.Background("#f4f7fb").PaddingVertical(1.4f).PaddingHorizontal(3).DefaultTextStyle(t => t.SemiBold());
    private static IContainer V(IContainer c) => c.Border(0.4f).BorderColor("#dbe1ec").PaddingVertical(1.4f).PaddingHorizontal(3);

    /// <summary>Membrete del productor (fijo) — logo + razón social + datos. Opcionalmente QR al extremo derecho.</summary>
    private static void Membrete(IContainer container, byte[]? logo, byte[]? qr = null)
    {
        container.BorderBottom(0.7f).BorderColor("#1e1e1e").PaddingBottom(4).Row(r =>
        {
            if (logo is not null)
                r.ConstantItem(46).Height(38).AlignMiddle().Image(logo).FitArea();
            r.RelativeItem().PaddingLeft(8).AlignMiddle().Column(c =>
            {
                c.Item().Text(RAZON).FontSize(9f).Bold().FontColor("#000000");
                c.Item().Text(TITULAR).FontSize(7.5f);
                c.Item().PaddingTop(1).Text(RUBRO).FontSize(5f).FontColor("#1e1e1e");
                c.Item().Text(DIR1).FontSize(5f).FontColor("#1e1e1e");
                c.Item().Text(DIR2).FontSize(5f).FontColor("#1e1e1e");
            });
            if (qr is not null)
                r.ConstantItem(50).PaddingLeft(6).AlignMiddle().Column(q =>
                {
                    q.Item().AlignCenter().Height(46).Image(qr).FitArea();
                    q.Item().AlignCenter().Text("Verificar con QR").FontSize(3.8f).FontColor("#333333");
                });
        });
    }

    /// <summary>Código de barras representativo (barras negras/blancas de ancho variable).</summary>
    private static void Barcode(IContainer container, string seed)
    {
        var rnd = new Random(Math.Abs(seed.GetHashCode()));
        container.Height(13).Row(r =>
        {
            for (int i = 0; i < 110; i++)
            {
                float w = 0.6f + rnd.Next(0, 3) * 0.6f;
                r.ConstantItem(w).Background(i % 2 == 0 ? "#2a3142" : "#ffffff");
            }
        });
    }

    private static byte[] QrPng(string text)
    {
        using var gen = new QRCodeGenerator();
        using var data = gen.CreateQrCode(string.IsNullOrWhiteSpace(text) ? " " : text, QRCodeGenerator.ECCLevel.Q);
        return new PngByteQRCode(data).GetGraphic(20);
    }

    private const string LEGAL =
        "Se deja constancia que en caso que el asegurado abonara una cuota sin haber cancelado alguna cuota anterior, dicho pago se imputará a la cuota vencida con anterioridad y la suspensión de la cobertura no cesará, hasta tanto se cancelen las cuotas vencidas.\n" +
        "LEY DE SEGUROS (SINIESTRO)\n" +
        "Art. 31. Si el pago de la primera prima o de la prima única no se efectuara oportunamente, el asegurador no será responsable por el siniestro ocurrido antes del pago.\n" +
        "Art. 46. El tomador, o derechohabiente en su caso, comunicará al asegurador el acaecimiento del siniestro dentro de los tres días de conocerlo.\n" +
        "Art. 47. El asegurado pierde el derecho a ser indemnizado, en el supuesto de incumplimiento de la carga prevista en el párrafo 1° del artículo 46, salvo que acredite caso fortuito, fuerza mayor o imposibilidad de hecho sin culpa o negligencia.";
}
