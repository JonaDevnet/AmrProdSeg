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
    public IActionResult Errores([FromBody] ErrorFrontendDto dto)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "-";
        _logger.LogWarning(
            "[FrontendError] {Mensaje} | URL {Url} | IP {Ip} | UA {UserAgent} | Stack {Stack}",
            string.IsNullOrWhiteSpace(dto?.Mensaje) ? "(sin mensaje)" : dto!.Mensaje,
            dto?.Url ?? "-",
            ip,
            dto?.UserAgent ?? "-",
            dto?.Stack ?? "-");
        return Ok();
    }
}