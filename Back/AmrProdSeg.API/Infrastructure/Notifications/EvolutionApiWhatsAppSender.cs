using System.Text;
using System.Text.Json;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Infrastructure.Notifications;

/// <summary>
/// Envío de WhatsApp vía Evolution API. La configuración (BaseUrl/Instance/ApiKey/Habilitado)
/// se lee de la tabla Configuraciones (editable por el Admin), con fallback a appsettings.
/// </summary>
public class EvolutionApiWhatsAppSender : IWhatsAppSender
{
    private readonly IConfiguracionService _config;
    private readonly HttpClient _http;
    private readonly ILogger<EvolutionApiWhatsAppSender> _logger;

    public EvolutionApiWhatsAppSender(
        IConfiguracionService config, HttpClient http, ILogger<EvolutionApiWhatsAppSender> logger)
    {
        _config = config;
        _http   = http;
        _logger = logger;
    }

    public bool Habilitado => _config.GetEvolutionEffectiveAsync(null).GetAwaiter().GetResult().Habilitado;

    public async Task<bool> HabilitadoParaAsync(int? usuarioId)
        => (await _config.GetEvolutionEffectiveAsync(usuarioId)).Habilitado;

    public async Task EnviarAsync(string telefono, string mensaje, int? usuarioId = null)
    {
        var opt = await _config.GetEvolutionEffectiveAsync(usuarioId);
        if (!opt.Habilitado)
        {
            _logger.LogInformation("[WhatsApp DESACTIVADO] Para {Telefono}: {Mensaje}", telefono, mensaje);
            return;
        }

        // Evolution API: POST {BaseUrl}/message/sendText/{Instance}  (header: apikey)
        var url = $"{opt.BaseUrl.TrimEnd('/')}/message/sendText/{opt.Instance}";
        var payload = JsonSerializer.Serialize(new { number = NormalizarTelefono(telefono), text = mensaje });

        using var req = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        req.Headers.Add("apikey", opt.ApiKey);

        var resp = await _http.SendAsync(req);
        resp.EnsureSuccessStatusCode();
        _logger.LogInformation("WhatsApp enviado a {Telefono}", telefono);
    }

    public async Task EnviarDocumentoAsync(string telefono, byte[] documento, string nombreArchivo, string caption, int? usuarioId = null)
    {
        var opt = await _config.GetEvolutionEffectiveAsync(usuarioId);
        if (!opt.Habilitado)
        {
            _logger.LogInformation("[WhatsApp DESACTIVADO] Documento {Archivo} para {Telefono}", nombreArchivo, telefono);
            return;
        }

        // Evolution API: POST {BaseUrl}/message/sendMedia/{Instance} con media en base64.
        var url = $"{opt.BaseUrl.TrimEnd('/')}/message/sendMedia/{opt.Instance}";
        var payload = JsonSerializer.Serialize(new
        {
            number = NormalizarTelefono(telefono),
            mediatype = "document",
            mimetype = "application/pdf",
            media = Convert.ToBase64String(documento),
            fileName = nombreArchivo,
            caption
        });

        using var req = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        req.Headers.Add("apikey", opt.ApiKey);

        var resp = await _http.SendAsync(req);
        resp.EnsureSuccessStatusCode();
        _logger.LogInformation("WhatsApp (documento) enviado a {Telefono}", telefono);
    }

    /// <summary>
    /// Normaliza un teléfono argentino al formato que espera WhatsApp/Evolution:
    /// solo dígitos, con código de país 54 y el 9 de móvil (54 9 [área][número]).
    /// Ej.: "+54 11 5555-1234" → "5491155551234"; "11-4000-1111" → "5491140001111".
    /// </summary>
    private static string NormalizarTelefono(string raw)
    {
        var d = new string((raw ?? string.Empty).Where(char.IsDigit).ToArray());
        if (d.StartsWith("00")) d = d[2..];
        if (d.StartsWith("54"))
        {
            var resto = d[2..];
            if (!resto.StartsWith("9")) resto = "9" + resto;
            return "54" + resto;
        }
        d = d.TrimStart('0');
        return "549" + d;
    }
}
