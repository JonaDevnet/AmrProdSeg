using System.Globalization;
using AmrProdSeg.API.Infrastructure.Interfaces;
using AmrProdSeg.API.Infrastructure.Notifications;
using Microsoft.Extensions.Options;
using Quartz;

namespace AmrProdSeg.API.Infrastructure.Jobs;

/// <summary>
/// Job diario que detecta pólizas y cuotas que vencen en N días (config) y envía
/// recordatorios por Email y WhatsApp. Cada notificación se registra para no
/// repetirse (idempotencia por Tipo+Referencia+Canal).
/// </summary>
[DisallowConcurrentExecution]
public class NotificacionVencimientosJob : IJob
{
    private readonly INotificacionRepository _repo;
    private readonly IEmailSender _email;
    private readonly IWhatsAppSender _whatsapp;
    private readonly NotificacionOptions _opt;
    private readonly ILogger<NotificacionVencimientosJob> _logger;

    public NotificacionVencimientosJob(
        INotificacionRepository repo,
        IEmailSender email,
        IWhatsAppSender whatsapp,
        IOptions<NotificacionOptions> opt,
        ILogger<NotificacionVencimientosJob> logger)
    {
        _repo     = repo;
        _email    = email;
        _whatsapp = whatsapp;
        _opt      = opt.Value;
        _logger   = logger;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        var dias = _opt.DiasAnticipacion;
        _logger.LogInformation("NotificacionVencimientosJob: buscando vencimientos a {Dias} días.", dias);

        var polizas = await _repo.GetPolizasPorVencerAsync(dias);
        foreach (var p in polizas)
        {
            var asunto  = $"Tu póliza {p.Numero} vence en {dias} días";
            var mensaje = $"Hola {p.ClienteNombre}, te recordamos que tu póliza {p.Numero} " +
                          $"({p.Compania}) del vehículo {p.Patente} vence el " +
                          $"{p.FechaFin:dd/MM/yyyy}. Comunicate con nosotros para renovarla.";
            await NotificarAsync("Poliza", p.PolizaId, p.Email, p.Telefono, asunto, mensaje);
        }

        var cuotas = await _repo.GetCuotasPorVencerAsync(dias);
        foreach (var c in cuotas)
        {
            var asunto  = $"Tu cuota de la póliza {c.NroPoliza} vence en {dias} días";
            var mensaje = $"Hola {c.ClienteNombre}, te recordamos que la cuota {c.NumeroCuota} " +
                          $"de tu póliza {c.NroPoliza} por $ {c.Monto.ToString("N2", CultureInfo.GetCultureInfo("es-AR"))} " +
                          $"vence el {c.FechaVencimiento:dd/MM/yyyy}.";
            await NotificarAsync("Cuota", c.CobroId, c.Email, c.Telefono, asunto, mensaje);
        }

        _logger.LogInformation("NotificacionVencimientosJob: {Polizas} pólizas y {Cuotas} cuotas procesadas.",
            polizas.Count, cuotas.Count);
    }

    private async Task NotificarAsync(
        string tipo, int referenciaId, string? email, string? telefono, string asunto, string mensaje)
    {
        // Email
        if (!string.IsNullOrWhiteSpace(email) && !await _repo.YaEnviadaAsync(tipo, referenciaId, "Email"))
        {
            try
            {
                await _email.EnviarAsync(email, asunto, mensaje);
                // Solo registramos como enviado si el canal está activo
                if (_email.Habilitado)
                    await _repo.RegistrarAsync(tipo, referenciaId, "Email", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fallo enviando Email de {Tipo} {Id}", tipo, referenciaId);
            }
        }

        // WhatsApp (queda sin correr mientras Evolution:Habilitado=false)
        if (!string.IsNullOrWhiteSpace(telefono) && !await _repo.YaEnviadaAsync(tipo, referenciaId, "WhatsApp"))
        {
            try
            {
                await _whatsapp.EnviarAsync(telefono, mensaje);
                // Solo registramos como enviado si el canal está activo (evita marcar lo no enviado)
                if (_whatsapp.Habilitado)
                    await _repo.RegistrarAsync(tipo, referenciaId, "WhatsApp", telefono);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fallo enviando WhatsApp de {Tipo} {Id}", tipo, referenciaId);
            }
        }
    }
}
