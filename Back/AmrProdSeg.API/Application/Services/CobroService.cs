using System.Globalization;
using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AmrProdSeg.API.Application.Services;

public class CobroService : ICobroService
{
    private readonly ICobroRepository _cobroRepo;
    private readonly IPolizaRepository _polizaRepo;
    private readonly IClienteRepository _clienteRepo;
    private readonly ICompaniaRepository _companiaRepo;
    private readonly IVehiculoRepository _vehiculoRepo;
    private readonly IMetodoPagoRepository _metodoRepo;
    private readonly IPdfService _pdf;
    private readonly IConfiguration _configuration;
    private readonly IEmailSender _email;
    private readonly IWhatsAppSender _whatsapp;

    public CobroService(
        ICobroRepository cobroRepo,
        IPolizaRepository polizaRepo,
        IClienteRepository clienteRepo,
        ICompaniaRepository companiaRepo,
        IVehiculoRepository vehiculoRepo,
        IMetodoPagoRepository metodoRepo,
        IPdfService pdf,
        IConfiguration configuration,
        IEmailSender email,
        IWhatsAppSender whatsapp)
    {
        _cobroRepo   = cobroRepo;
        _polizaRepo  = polizaRepo;
        _clienteRepo = clienteRepo;
        _companiaRepo = companiaRepo;
        _vehiculoRepo = vehiculoRepo;
        _metodoRepo  = metodoRepo;
        _pdf         = pdf;
        _configuration = configuration;
        _email       = email;
        _whatsapp    = whatsapp;
    }

    public Task<List<Cobro>> GetPorPolizaAsync(int polizaId)
        => _cobroRepo.GetPorPolizaAsync(polizaId);

    public Task<List<Cobro>> GetPendientesMesAsync(int mes, int anio)
        => _cobroRepo.GetPendientesMesAsync(mes, anio);

    public async Task PagarAsync(int id, DateTime fechaPago, int? metodoPagoId, int? usuarioId = null)
    {
        var cobro = await _cobroRepo.GetByIdAsync(id)
            ?? throw new NotFoundException("Cuota no encontrada.");

        if (cobro.Estado == EstadoCobro.Pagado)
            throw new BusinessException("La cuota ya está pagada.");

        // No se puede cobrar una cuota si hay una anterior impaga (vencida o pendiente):
        // las cuotas se cobran en orden.
        var cuotas = await _cobroRepo.GetPorPolizaAsync(cobro.PolizaId);
        var primeraImpaga = cuotas
            .Where(c => c.Estado != EstadoCobro.Pagado)
            .OrderBy(c => c.NumeroCuota)
            .FirstOrDefault();
        if (primeraImpaga != null && primeraImpaga.NumeroCuota < cobro.NumeroCuota)
            throw new BusinessException($"Debés cobrar primero la cuota {primeraImpaga.NumeroCuota} (anterior/vencida).");

        // La cuota se cobra en la fecha elegida pero con la HORA real de registro,
        // para que "Hechos del día" muestre el horario correcto (y no 00:00).
        var fechaHora = fechaPago.Date + DateTime.Now.TimeOfDay;
        await _cobroRepo.MarcarPagadoAsync(id, fechaHora, metodoPagoId, usuarioId);
    }

    public Task MarcarVencidosAsync()
        => _cobroRepo.MarcarVencidosAsync();

    /// <summary>Contexto reutilizable para armar el comprobante (envío online e impresión).</summary>
    private sealed record ComprobanteContexto(ComprobanteCobroDto Dto, string NombreArchivo, Cliente Cliente, Cobro Cobro, Poliza Poliza, Compania? Compania);

    private async Task<ComprobanteContexto> ArmarComprobanteAsync(int cobroId)
    {
        var cobro = await _cobroRepo.GetByIdAsync(cobroId)
            ?? throw new NotFoundException("Cuota no encontrada.");
        var poliza = await _polizaRepo.GetByIdAsync(cobro.PolizaId)
            ?? throw new NotFoundException("Póliza no encontrada.");
        var cliente = await _clienteRepo.GetByIdAsync(poliza.ClienteId)
            ?? throw new NotFoundException("Cliente no encontrado.");
        var compania = await _companiaRepo.GetByIdAsync(poliza.CompaniaId);

        // Datos complementarios para el comprobante
        var vehiculos = await _vehiculoRepo.GetPorClienteAsync(cliente.Id);
        var veh = vehiculos.FirstOrDefault(v => v.Id == poliza.VehiculoId);
        var metodos = await _metodoRepo.GetAllAsync();
        var metNombre = metodos.FirstOrDefault(m => m.Id == cobro.MetodoPagoId)?.Nombre ?? "";
        var medioPago = metNombre.ToLowerInvariant().Contains("efectivo") ? "Efectivo" : "Transferencia";

        // Próximo vencimiento = vencimiento de la cuota siguiente a la cobrada
        var cuotas = await _cobroRepo.GetPorPolizaAsync(poliza.Id);
        var siguiente = cuotas.Where(c => c.NumeroCuota > cobro.NumeroCuota).OrderBy(c => c.NumeroCuota).FirstOrDefault();
        var proxVenc = siguiente?.FechaVencimiento ?? cobro.FechaVencimiento;

        var baseUrl = (_configuration["PublicBaseUrl"] ?? _configuration["AllowedOrigin"] ?? "http://localhost:5173").TrimEnd('/');

        var dto = new ComprobanteCobroDto
        {
            ReciboNumero    = cobro.Id.ToString(),
            FechaPago       = cobro.FechaPago ?? DateTime.Now,
            PolizaNumero    = poliza.Numero,
            Compania        = compania?.Nombre ?? "—",
            Asegurado       = cliente.Nombre,
            RiesgoAsegurado = veh is null ? "—" : $"{veh.Marca} {veh.Modelo}".Trim(),
            Dominio         = veh?.Patente ?? "—",
            Anio            = veh is null || veh.Anio == 0 ? "" : veh.Anio.ToString(),
            CuotaActual     = cobro.NumeroCuota,
            CuotasTotal     = poliza.CantidadCuotas,
            ProxVencimiento = proxVenc,
            Importe         = cobro.Monto,
            Cobertura       = poliza.Cobertura ?? veh?.TipoCobertura ?? "—",
            MedioPago       = medioPago,
            QrUrl           = $"{baseUrl}/verificar/{poliza.TokenPublico}",
        };

        var nombreArchivo = "Comprobante-" + string.Concat(poliza.Numero.Split(Path.GetInvalidFileNameChars())) + ".pdf";
        return new ComprobanteContexto(dto, nombreArchivo, cliente, cobro, poliza, compania);
    }

    /// <summary>PDF del comprobante (1ª hoja) con talón recortable. Para el botón "Comprobante".</summary>
    public async Task<(byte[] Pdf, string NombreArchivo)> GenerarComprobanteImpresionAsync(int cobroId)
    {
        var ctx = await ArmarComprobanteAsync(cobroId);
        return (_pdf.GenerarComprobanteImpresion(ctx.Dto), ctx.NombreArchivo);
    }

    /// <summary>PDF del ticket (2ª hoja, sin logo). Para el botón "Ticket".</summary>
    public async Task<(byte[] Pdf, string NombreArchivo)> GenerarTicketImpresionAsync(int cobroId)
    {
        var ctx = await ArmarComprobanteAsync(cobroId);
        var nombre = "Ticket-" + string.Concat(ctx.Poliza.Numero.Split(Path.GetInvalidFileNameChars())) + ".pdf";
        return (_pdf.GenerarTicketImpresion(ctx.Dto), nombre);
    }

    /// <summary>PDF "online" (comprobante + ticket, el mismo que se envía por email/WhatsApp). Para descargar.</summary>
    public async Task<(byte[] Pdf, string NombreArchivo)> GenerarComprobanteOnlineAsync(int cobroId)
    {
        var ctx = await ArmarComprobanteAsync(cobroId);
        return (_pdf.GenerarComprobanteCobro(ctx.Dto), ctx.NombreArchivo);
    }

    public async Task<EnviarComprobanteResultDto> EnviarComprobanteAsync(int cobroId, string canal, int usuarioId)
    {
        var ctx = await ArmarComprobanteAsync(cobroId);
        var cobro = ctx.Cobro;
        var poliza = ctx.Poliza;
        var cliente = ctx.Cliente;
        var compania = ctx.Compania;

        var pdf = _pdf.GenerarComprobanteCobro(ctx.Dto);   // online → sin talón
        var nombreArchivo = ctx.NombreArchivo;

        var montoTxt = "$ " + cobro.Monto.ToString("N2", CultureInfo.GetCultureInfo("es-AR"));
        var asunto = $"Comprobante de pago — cuota {cobro.NumeroCuota} · póliza {poliza.Numero}";
        var cuerpo =
            $"Hola {cliente.Nombre}, registramos el pago de la cuota {cobro.NumeroCuota} " +
            $"de tu póliza {poliza.Numero} ({compania?.Nombre ?? "—"}) por {montoTxt}. Adjuntamos el comprobante. ¡Gracias!";

        var esEmail = string.Equals(canal, "email", StringComparison.OrdinalIgnoreCase);

        // Se envía con la config del usuario que cobró (con fallback a la del Admin).
        if (esEmail)
        {
            if (string.IsNullOrWhiteSpace(cliente.Email))
                throw new BusinessException("El cliente no tiene email cargado.");
            await _email.EnviarConAdjuntoAsync(cliente.Email, asunto, cuerpo, pdf, nombreArchivo, usuarioId);
            return await _email.HabilitadoParaAsync(usuarioId)
                ? new EnviarComprobanteResultDto { Enviado = true, Mensaje = $"Comprobante (PDF) enviado a {cliente.Email}." }
                : new EnviarComprobanteResultDto { Enviado = false, Mensaje = "Canal de Email desactivado. Configurá tu SMTP en Configuración para enviar." };
        }

        if (string.IsNullOrWhiteSpace(cliente.Telefono))
            throw new BusinessException("El cliente no tiene teléfono cargado.");
        await _whatsapp.EnviarDocumentoAsync(cliente.Telefono, pdf, nombreArchivo, $"{asunto}\n{cuerpo}", usuarioId);
        return await _whatsapp.HabilitadoParaAsync(usuarioId)
            ? new EnviarComprobanteResultDto { Enviado = true, Mensaje = $"Comprobante (PDF) enviado por WhatsApp a {cliente.Telefono}." }
            : new EnviarComprobanteResultDto { Enviado = false, Mensaje = "Canal de WhatsApp desactivado. Configurá tu WhatsApp en Configuración para enviar." };
    }
}
