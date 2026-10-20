using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AmrProdSeg.API.Security.Middlewares;

/// <summary>
/// Registra TODAS las solicitudes de la API con su IP real (ya resuelta por ForwardedHeaders):
/// método, ruta, status, usuario autenticado (si aplica), duración y user-agent.
/// - 2xx/3xx → Information (logs/amrprodseg-*.log)
/// - 4xx/5xx → Warning (además cae en logs/errors-*.log)
/// Se omite /health para no llenar los logs con los chequeos de Traefik/monitoreo.
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

            // El healthcheck se consulta muy seguido; no ensuciamos los logs con él.
            if (!context.Request.Path.StartsWithSegments("/health"))
            {
                var status = context.Response.StatusCode;
                var mensaje =
                    "Request {Status} {Method} {Path} {StatusText} | IP {Ip} | Usuario {Usuario} | {DuracionMs} ms | UA {UserAgent}";
                object[] args =
                {
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
                    context.Request.Headers.UserAgent.ToString()
                };

                if (status >= 400)
                    _logger.LogWarning(mensaje, args);
                else
                    _logger.LogInformation(mensaje, args);
            }
        }
    }

    /// <summary>IP real del cliente (tras UseForwardedHeaders lee X-Forwarded-For).</summary>
    private static string ObtenerIp(HttpContext context)
        => context.Connection.RemoteIpAddress?.ToString() ?? "-";

    private static string ReasonPhrase(int status) => status switch
    {
        200 => "OK",
        201 => "Created",
        204 => "No Content",
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