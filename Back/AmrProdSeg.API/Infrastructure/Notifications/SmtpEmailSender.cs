using System.Net;
using System.Net.Mail;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Infrastructure.Notifications;

/// <summary>
/// Envío de correo por SMTP. La configuración (incluido el correo emisor) se lee de
/// la tabla Configuraciones (editable por el Admin), con fallback a appsettings.
/// </summary>
public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguracionService _config;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguracionService config, ILogger<SmtpEmailSender> logger)
    {
        _config = config;
        _logger = logger;
    }

    public bool Habilitado => _config.GetSmtpEffectiveAsync().GetAwaiter().GetResult().Habilitado;

    public async Task EnviarAsync(string destino, string asunto, string cuerpo)
    {
        var opt = await _config.GetSmtpEffectiveAsync();
        if (!opt.Habilitado)
        {
            _logger.LogInformation("[Email DESACTIVADO] Para {Destino} | {Asunto}", destino, asunto);
            return;
        }

        using var mensaje = new MailMessage
        {
            From       = new MailAddress(opt.From, opt.FromNombre),
            Subject    = asunto,
            Body       = cuerpo,
            IsBodyHtml = true
        };
        mensaje.To.Add(destino);

        using var client = new SmtpClient(opt.Host, opt.Port)
        {
            EnableSsl   = opt.UsarSsl,
            Credentials = new NetworkCredential(opt.Usuario, opt.Password)
        };

        await client.SendMailAsync(mensaje);
        _logger.LogInformation("Email enviado a {Destino} desde {From}", destino, opt.From);
    }

    public async Task EnviarConAdjuntoAsync(string destino, string asunto, string cuerpo, byte[] adjunto, string nombreArchivo)
    {
        var opt = await _config.GetSmtpEffectiveAsync();
        if (!opt.Habilitado)
        {
            _logger.LogInformation("[Email DESACTIVADO] Para {Destino} | {Asunto} (con adjunto {Archivo})", destino, asunto, nombreArchivo);
            return;
        }

        using var mensaje = new MailMessage
        {
            From       = new MailAddress(opt.From, opt.FromNombre),
            Subject    = asunto,
            Body       = cuerpo,
            IsBodyHtml = true
        };
        mensaje.To.Add(destino);
        using var stream = new MemoryStream(adjunto);
        mensaje.Attachments.Add(new Attachment(stream, nombreArchivo, "application/pdf"));

        using var client = new SmtpClient(opt.Host, opt.Port)
        {
            EnableSsl   = opt.UsarSsl,
            Credentials = new NetworkCredential(opt.Usuario, opt.Password)
        };

        await client.SendMailAsync(mensaje);
        _logger.LogInformation("Email con adjunto enviado a {Destino}", destino);
    }
}
