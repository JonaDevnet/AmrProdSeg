using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AmrProdSeg.API.Security.Middlewares;

/// <summary>
/// Registra las solicitudes que terminan en error (status ≥ 400): método, ruta,
/// status, IP real (ya resuelta por ForwardedHeaders), usuario autenticado (si aplica),
/// duración y user-agent. Nivel Warning → cae en logs/errors-*.log.
/// Las solicitudes 2xx/3xx no se loguean acá (el tráfico/IP se ve en los access logs de Traefik).
/// Debe ir después de UseExceptionHandlingMiddleware() para ver el status final de la cadena.
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(
        RequestDelegate next,
        ILogger<RequestLoggingMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            await _next(context);
        }
        finally
        {
            sw.Stop();
            var status = context.Response.StatusCode;
            if (status >= 400)
            {
                _logger.LogWarning(
                    "Request {Status} {Method} {Path} {StatusText} | IP {Ip} | Usuario {Usuario} | {DuracionMs} ms | UA {UserAgent}",
                    status,
                    context.Request.Method,
                    context.Request.Path,
                    ReasonPhrase(status),
                    ObtenerIp(context),
                    context.User?.Identity?.IsAuthenticated == true
                        ? context.User.FindFirstValue(JwtRegisteredClaimNames.Email)
                          ?? context.User.FindFirstValue(ClaimTypes.Email)
                          ?? context.User.Identity.Name ?? "?"
                        : "anonimo",
                    sw.ElapsedMilliseconds,
                    context.Request.Headers.UserAgent.ToString());
            }
        }
    }

    /// <summary>IP real del cliente (tras UseForwardedHeaders lee X-Forwarded-For).</summary>
    private static string ObtenerIp(HttpContext context)
        => context.Connection.RemoteIpAddress?.ToString() ?? "-";

    private static string ReasonPhrase(int status) => status switch
    {
        400 => "Bad Request",
        401 => "Unauthorized",
        403 => "Forbidden",
        404 => "Not Found",
        405 => "Method Not Allowed",
        409 => "Conflict",
        429 => "Too Many Requests",
        500 => "Internal Server Error",
        _   => ""
    };
}

public static class RequestLoggingExtensions
{
    public static IApplicationBuilder UseRequestLogging(this IApplicationBuilder app)
        => app.UseMiddleware<RequestLoggingMiddleware>();
}