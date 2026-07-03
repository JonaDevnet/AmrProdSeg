using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

/// <summary>Configuración del sistema. Sólo el Admin puede leer/editar.</summary>
[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/configuracion")]
public class ConfiguracionController : ControllerBase
{
    private readonly IConfiguracionService _service;
    public ConfiguracionController(IConfiguracionService service) => _service = service;

    /// <summary>Config SMTP actual (sin exponer la contraseña).</summary>
    [HttpGet("smtp")]
    public async Task<IActionResult> GetSmtp() => Ok(await _service.GetSmtpAsync());

    /// <summary>Actualiza la config SMTP, incluido el correo emisor.</summary>
    [HttpPut("smtp")]
    public async Task<IActionResult> ActualizarSmtp([FromBody] ActualizarSmtpDto dto)
    {
        await _service.ActualizarSmtpAsync(dto);
        return NoContent();
    }

    /// <summary>Config de WhatsApp (Evolution API), sin exponer la ApiKey.</summary>
    [HttpGet("whatsapp")]
    public async Task<IActionResult> GetWhatsapp() => Ok(await _service.GetEvolutionAsync());

    /// <summary>Actualiza la config de WhatsApp (Evolution API).</summary>
    [HttpPut("whatsapp")]
    public async Task<IActionResult> ActualizarWhatsapp([FromBody] ActualizarEvolutionDto dto)
    {
        await _service.ActualizarEvolutionAsync(dto);
        return NoContent();
    }
}
