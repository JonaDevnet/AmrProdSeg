using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

/// <summary>
/// Endpoint de diagnóstico: recibe errores del frontend (SPA) y los loguea vía Serilog
/// como Warning → quedan en logs/errors-*.log. Abierto (sin auth) para capturar errores
/// también de usuarios anónimos (login/landing); el rate limiting global lo protege de spam.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/diagnostics")]
public class DiagnosticsController : ControllerBase
{
    private readonly ILogger<DiagnosticsController> _logger;

    public DiagnosticsController(ILogger<DiagnosticsController> logger) => _logger = logger;

    public sealed class ErrorFrontendDto
    {
        public string? Mensaje { get; set; }
        public string? Stack   { get; set; }
        public string? Url     { get; set; }
        public string? UserAgent { get; set; }
    }

    [HttpPost("errores")]
    public IActionResult Errores([FromBody] List<ErrorFrontendDto> errores)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "-";
        foreach (var dto in errores ?? new List<ErrorFrontendDto>())
        {
            _logger.LogWarning(
                "[FrontendError] {Mensaje} | URL {Url} | IP {Ip} | UA {UserAgent} | Stack {Stack}",
                Sanitizar(dto?.Mensaje) ?? "(sin mensaje)",
                Sanitizar(dto?.Url) ?? "-",
                ip,
                Sanitizar(dto?.UserAgent) ?? "-",
                Sanitizar(dto?.Stack) ?? "-");
        }
        return Ok();
    }

    /// <summary>Evita log injection: reemplaza saltos de línea por espacios.</summary>
    private static string? Sanitizar(string? s)
        => string.IsNullOrEmpty(s) ? s : s.Replace("\r", " ").Replace("\n", " ");
}