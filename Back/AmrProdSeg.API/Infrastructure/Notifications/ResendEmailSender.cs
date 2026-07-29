using System.Text;
using System.Text.Json;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Infrastructure.Notifications;

/// <summary>
/// Envío de correo vía Resend (https://resend.com) — API REST, reemplaza al SMTP.
/// La configuración (habilitado, ApiKey, remitente) se lee de la tabla Configuraciones
/// (editable por el Admin), con fallback a appsettings/env. El From DEBE pertenecer a un
/// dominio VERIFICADO en la cuenta de Resend, si no la API rechaza el envío.
/// </summary>
public class ResendEmailSender : IEmailSender
{
    private const string Endpoint = "https://api.resend.com/emails";
    private readonly IConfiguracionService _config;
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<ResendEmailSender> _logger;

    public ResendEmailSender(IConfiguracionService config, IHttpClientFactory httpFactory, ILogger<ResendEmailSender> logger)
    {
        _config = config;
        _httpFactory = httpFactory;
        _logger = logger;
    }

    public bool Habilitado => Efectivo(_config.GetResendEffectiveAsync(null).GetAwaiter().GetResult());

    public async Task<bool> HabilitadoParaAsync(int? usuarioId)
        => Efectivo(await _config.GetResendEffectiveAsync(usuarioId));

    private static bool Efectivo(ResendOptions opt)
        => opt.Habilitado && !string.IsNullOrWhiteSpace(opt.ApiKey) && !string.IsNullOrWhiteSpace(opt.From);

    public Task EnviarAsync(string destino, string asunto, string cuerpo, int? usuarioId = null)
        => EnviarInternoAsync(destino, asunto, cuerpo, null, null, usuarioId);

    public Task EnviarConAdjuntoAsync(string destino, string asunto, string cuerpo, byte[] adjunto, string nombreArchivo, int? usuarioId = null)
        => EnviarInternoAsync(destino, asunto, cuerpo, adjunto, nombreArchivo, usuarioId);

    private async Task EnviarInternoAsync(string destino, string asunto, string cuerpo, byte[]? adjunto, string? nombreArchivo, int? usuarioId)
    {
        var opt = await _config.GetResendEffectiveAsync(usuarioId);
        if (!Efectivo(opt))
        {
            _logger.LogInformation("[Email DESACTIVADO] Para {Destino} | {Asunto}", destino, asunto);
            return;
        }

        var from = string.IsNullOrWhiteSpace(opt.FromNombre) ? opt.From : $"{opt.FromNombre} <{opt.From}>";
        object payload = adjunto is null
            ? new { from, to = new[] { destino }, subject = asunto, html = cuerpo }
            : new
            {
                from, to = new[] { destino }, subject = asunto, html = cuerpo,
                attachments = new[] { new { filename = nombreArchivo, content = Convert.ToBase64String(adjunto) } }
            };

        using var req = new HttpRequestMessage(HttpMethod.Post, Endpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        req.Headers.Add("Authorization", $"Bearer {opt.ApiKey}");

        var http = _httpFactory.CreateClient("resend");
        var resp = await http.SendAsync(req);
        if (!resp.IsSuccessStatusCode)
        {
            var body = await resp.Content.ReadAsStringAsync();
            _logger.LogWarning("Resend respondió {Code} al enviar a {Destino}: {Body}", (int)resp.StatusCode, destino, body);
            throw new HttpRequestException($"Resend respondió {(int)resp.StatusCode}. {body}");
        }
        _logger.LogInformation("Email enviado a {Destino} vía Resend desde {From}", destino, opt.From);
    }
}
