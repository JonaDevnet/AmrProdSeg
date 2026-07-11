using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AmrProdSeg.API.Security.Middlewares;

/// <summary>
/// Bloquea (403) las requests cuya IP de origen no sea del país permitido (Argentina).
/// La geolocalización se consulta a ipquery.io y se cachea por IP para no llamar en cada
/// request. Filosofía FAIL-OPEN: ante cualquier error/timeout de la API externa se DEJA
/// pasar, para no tumbar el sitio por una dependencia de terceros. Las IPs internas
/// (loopback/privadas de Docker) y /health se permiten siempre.
///
/// Requiere que la IP real del cliente ya esté resuelta → debe ir DESPUÉS de
/// UseForwardedHeaders() (detrás de Traefik la IP llega por X-Forwarded-For).
/// </summary>
public class GeoBlockingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IHttpClientFactory _httpFactory;
    private readonly IMemoryCache _cache;
    private readonly GeoBlockingOptions _opt;
    private readonly ILogger<GeoBlockingMiddleware> _logger;

    public GeoBlockingMiddleware(
        RequestDelegate next, IHttpClientFactory httpFactory, IMemoryCache cache,
        IOptions<GeoBlockingOptions> opt, ILogger<GeoBlockingMiddleware> logger)
    {
        _next = next;
        _httpFactory = httpFactory;
        _cache = cache;
        _opt = opt.Value;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!_opt.Habilitado) { await _next(context); return; }

        // El health check nunca se bloquea (lo consultan Traefik/monitoreo).
        if (context.Request.Path.StartsWithSegments("/health")) { await _next(context); return; }

        var ip = context.Connection.RemoteIpAddress;
        // Sin IP o tráfico interno (loopback / red privada de Docker) → se permite.
        if (ip is null || EsInterna(ip)) { await _next(context); return; }

        if (!await PaisPermitidoAsync(ip))
        {
            _logger.LogWarning("GeoBlock: IP {Ip} bloqueada (fuera de {Pais}).", ip, _opt.PaisPermitido);
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { error = "Acceso permitido únicamente desde Argentina." });
            return;
        }

        await _next(context);
    }

    private static bool EsInterna(IPAddress ip)
    {
        if (IPAddress.IsLoopback(ip)) return true;
        if (ip.IsIPv6LinkLocal || ip.IsIPv6SiteLocal || ip.IsIPv6UniqueLocal) return true;
        // Rangos privados IPv4: 10/8, 172.16/12, 192.168/16
        var b = (ip.IsIPv4MappedToIPv6 ? ip.MapToIPv4() : ip).GetAddressBytes();
        if (b.Length != 4) return false;
        return b[0] == 10
            || (b[0] == 172 && b[1] >= 16 && b[1] <= 31)
            || (b[0] == 192 && b[1] == 168);
    }

    private async Task<bool> PaisPermitidoAsync(IPAddress ip)
    {
        var key = "geo:" + ip;
        if (_cache.TryGetValue<bool>(key, out var cached)) return cached;

        bool permitido;
        TimeSpan ttl;
        try
        {
            var http = _httpFactory.CreateClient("geo");
            http.Timeout = TimeSpan.FromSeconds(Math.Max(1, _opt.TimeoutSegundos));
            using var resp = await http.GetAsync($"{_opt.ApiUrl.TrimEnd('/')}/{ip}");
            resp.EnsureSuccessStatusCode();

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
            string? cc = doc.RootElement.TryGetProperty("location", out var loc)
                         && loc.TryGetProperty("country_code", out var c)
                ? c.GetString()
                : null;

            // Si no se pudo determinar el país, se permite (fail-open).
            permitido = string.IsNullOrWhiteSpace(cc)
                        || string.Equals(cc, _opt.PaisPermitido, StringComparison.OrdinalIgnoreCase);
            ttl = TimeSpan.FromHours(Math.Max(1, _opt.CacheHoras));
        }
        catch (Exception ex)
        {
            // Fail-open: no bloqueamos por un fallo de la API externa. Cache corto para reintentar.
            _logger.LogWarning(ex, "GeoBlock: no se pudo geolocalizar {Ip}; se permite (fail-open).", ip);
            permitido = true;
            ttl = TimeSpan.FromMinutes(5);
        }

        _cache.Set(key, permitido, ttl);
        return permitido;
    }
}

public static class GeoBlockingExtensions
{
    public static IApplicationBuilder UseGeoBlocking(this IApplicationBuilder app)
        => app.UseMiddleware<GeoBlockingMiddleware>();
}
