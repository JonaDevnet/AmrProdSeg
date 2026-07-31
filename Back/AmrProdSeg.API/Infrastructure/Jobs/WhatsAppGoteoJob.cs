using System.Globalization;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using AmrProdSeg.API.Infrastructure.Notifications;
using Microsoft.Extensions.Options;
using Quartz;

namespace AmrProdSeg.API.Infrastructure.Jobs;

/// <summary>
/// "Goteo" anti-baneo de recordatorios por WhatsApp: en cada disparo (cada 5 min, en las
/// horas activas del cron) envía UN solo mensaje al próximo cliente pendiente, con una
/// demora aleatoria (jitter) y rotando entre 5 redacciones equivalentes para no repetir
/// texto idéntico. Respeta un tope diario e idempotencia (Tipo+Referencia+WhatsApp).
/// El Email se manda aparte, en lote, desde <see cref="NotificacionVencimientosJob"/>.
/// </summary>
[DisallowConcurrentExecution]
public class WhatsAppGoteoJob : IJob
{
    private const string Canal = "WhatsApp";
    private static readonly CultureInfo Ar = CultureInfo.GetCultureInfo("es-AR");

    private readonly INotificacionRepository _repo;
    private readonly IWhatsAppSender _whatsapp;
    private readonly NotificacionOptions _opt;
    private readonly ILogger<WhatsAppGoteoJob> _logger;

    public WhatsAppGoteoJob(
        INotificacionRepository repo,
        IWhatsAppSender whatsapp,
        IOptions<NotificacionOptions> opt,
        ILogger<WhatsAppGoteoJob> logger)
    {
        _repo     = repo;
        _whatsapp = whatsapp;
        _opt      = opt.Value;
        _logger   = logger;
    }

    public Task Execute(IJobExecutionContext context) => EjecutarUnaVezAsync(context.CancellationToken);

    /// <summary>
    /// Un "tic" del goteo: valida canal/tope, elige el próximo pendiente, espera el jitter y
    /// envía UN mensaje. Devuelve el texto enviado (o null si no envió nada). Público para test.
    /// </summary>
    public async Task<string?> EjecutarUnaVezAsync(CancellationToken ct)
    {
        if (!_whatsapp.Habilitado) return null;   // Evolution apagado → no hace nada

        var enviadasHoy = await _repo.ContarEnviadasHoyAsync(Canal);
        if (enviadasHoy >= _opt.WhatsAppMaxPorDia)
        {
            _logger.LogInformation("Goteo WhatsApp: tope diario alcanzado ({Hoy}/{Max}).", enviadasHoy, _opt.WhatsAppMaxPorDia);
            return null;
        }

        var variante = enviadasHoy % 5;   // rota entre las 5 redacciones a lo largo del día
        var candidato = await ProximoPendienteAsync(variante, ct);
        if (candidato is null) return null;    // no hay pendientes

        // Jitter humano: demora aleatoria antes de enviar (que no se vea robótico y exacto).
        var min = Math.Max(0, _opt.WhatsAppJitterSegMin);
        var max = Math.Max(min, _opt.WhatsAppJitterSegMax);
        var espera = min == max ? min : Random.Shared.Next(min, max + 1);
        if (espera > 0)
            await Task.Delay(TimeSpan.FromSeconds(espera), ct);

        try
        {
            await _whatsapp.EnviarAsync(candidato.Telefono, candidato.Mensaje);
            await _repo.RegistrarAsync(candidato.Tipo, candidato.Ref, Canal, candidato.Telefono);
            _logger.LogInformation("Goteo WhatsApp: enviado {Tipo} #{Ref} ({Hoy}/{Max}).",
                candidato.Tipo, candidato.Ref, enviadasHoy + 1, _opt.WhatsAppMaxPorDia);
            return candidato.Mensaje;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Goteo WhatsApp: fallo enviando {Tipo} #{Ref}", candidato.Tipo, candidato.Ref);
            return null;
        }
    }

    private sealed record Candidato(string Tipo, int Ref, string Telefono, string Mensaje);

    /// <summary>Primer aviso pendiente (con teléfono y aún no enviado por WhatsApp), en orden de prioridad.</summary>
    private async Task<Candidato?> ProximoPendienteAsync(int variante, CancellationToken ct)
    {
        var dias = _opt.DiasAnticipacion;

        // 1) Cuotas por vencer
        foreach (var c in await _repo.GetCuotasPorVencerAsync(dias))
        {
            ct.ThrowIfCancellationRequested();
            if (string.IsNullOrWhiteSpace(c.Telefono)) continue;
            if (await _repo.YaEnviadaAsync("Cuota", c.CobroId, Canal)) continue;
            return new Candidato("Cuota", c.CobroId, c.Telefono!, MsgCuotaPorVencer(c, variante));
        }

        // 2) Cuotas vencidas e impagas
        foreach (var c in await _repo.GetCuotasVencidasAsync(_opt.DiasVencida))
        {
            ct.ThrowIfCancellationRequested();
            if (string.IsNullOrWhiteSpace(c.Telefono)) continue;
            if (await _repo.YaEnviadaAsync("CuotaVencida", c.CobroId, Canal)) continue;
            return new Candidato("CuotaVencida", c.CobroId, c.Telefono!, MsgCuotaVencida(c, variante));
        }

        // 3) Pólizas por vencer
        foreach (var p in await _repo.GetPolizasPorVencerAsync(dias))
        {
            ct.ThrowIfCancellationRequested();
            if (string.IsNullOrWhiteSpace(p.Telefono)) continue;
            if (await _repo.YaEnviadaAsync("Poliza", p.PolizaId, Canal)) continue;
            return new Candidato("Poliza", p.PolizaId, p.Telefono!, MsgPolizaPorVencer(p, variante));
        }

        return null;
    }

    // ── 5 redacciones equivalentes por tipo (WhatsApp marca el texto idéntico repetido) ──

    private static string MsgCuotaPorVencer(CuotaVencimiento c, int v)
    {
        var n = c.ClienteNombre; var cu = c.NumeroCuota; var p = c.NroPoliza;
        var m = c.Monto.ToString("N2", Ar); var f = c.FechaVencimiento.ToString("dd/MM/yyyy");
        return (v % 5) switch
        {
            0 => $"Hola {n}, te recordamos que la cuota {cu} de tu póliza {p} por $ {m} vence el {f}. Aboná antes del vencimiento para mantener tu cobertura activa. — AMR Producción de Seguros",
            1 => $"{n}, ¡buen día! Se acerca el vencimiento de la cuota {cu} de tu póliza {p} (${m}) el {f}. Regularizala a tiempo para no perder la cobertura. AMR Seguros",
            2 => $"Hola {n}, pasamos a recordarte que la cuota {cu} de tu póliza {p} vence el {f} por un total de $ {m}. Ante cualquier duda, escribinos. — AMR",
            3 => $"{n}, te avisamos que la cuota {cu} (póliza {p}) por $ {m} tiene vencimiento el {f}. Aboná antes de esa fecha para seguir cubierto. AMR Producción de Seguros",
            _ => $"Hola {n} 👋 Recordá que la cuota {cu} de tu póliza {p} vence el {f} ($ {m}). Mantené tu cobertura al día. Saludos, AMR Seguros.",
        };
    }

    private static string MsgCuotaVencida(CuotaVencimiento c, int v)
    {
        var n = c.ClienteNombre; var cu = c.NumeroCuota; var p = c.NroPoliza;
        var m = c.Monto.ToString("N2", Ar); var f = c.FechaVencimiento.ToString("dd/MM/yyyy");
        return (v % 5) switch
        {
            0 => $"Hola {n}, la cuota {cu} de tu póliza {p} por $ {m} venció el {f} y figura impaga. Regularizá el pago para no perder la cobertura. — AMR Producción de Seguros",
            1 => $"{n}, detectamos que la cuota {cu} (póliza {p}) de $ {m} está vencida desde el {f}. Ponete al día para mantener la cobertura activa. AMR Seguros",
            2 => $"Hola {n}, te recordamos que quedó impaga la cuota {cu} de tu póliza {p} ($ {m}), vencida el {f}. Aboná cuanto antes para no perder cobertura. — AMR",
            3 => $"{n}, la cuota {cu} de la póliza {p} por $ {m} venció el {f}. Regularizá el pago para evitar la baja de la cobertura. AMR Producción de Seguros",
            _ => $"Hola {n} 👋 La cuota {cu} de tu póliza {p} ($ {m}) venció el {f} y sigue impaga. Escribinos para regularizarla y seguir cubierto. AMR Seguros.",
        };
    }

    private static string MsgPolizaPorVencer(PolizaVencimiento p, int v)
    {
        var n = p.ClienteNombre; var num = p.Numero; var cia = p.Compania;
        var pat = p.Patente; var f = p.FechaFin.ToString("dd/MM/yyyy");
        return (v % 5) switch
        {
            0 => $"Hola {n}, te recordamos que tu póliza {num} ({cia}) del vehículo {pat} vence el {f}. Comunicate con nosotros para renovarla. — AMR Producción de Seguros",
            1 => $"{n}, tu póliza {num} de {cia} (patente {pat}) está por vencer el {f}. Escribinos para gestionar la renovación. AMR Seguros",
            2 => $"Hola {n}, se acerca el vencimiento de tu póliza {num} ({cia}, {pat}) el {f}. Coordinemos la renovación a tiempo. — AMR",
            3 => $"{n}, te avisamos que la póliza {num} del vehículo {pat} ({cia}) vence el {f}. Contactanos para renovarla. AMR Producción de Seguros",
            _ => $"Hola {n} 👋 Tu póliza {num} ({pat}, {cia}) vence el {f}. Renovala con nosotros para no quedar sin cobertura. Saludos, AMR Seguros.",
        };
    }
}
