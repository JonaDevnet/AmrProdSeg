using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

/// <summary>Configuración de envío (SMTP/WhatsApp) PROPIA de cada usuario. Si no la carga, se usa la del Admin.</summary>
[ApiController]
[Authorize]
[Route("api/configuracion")]
public class ConfiguracionController : ControllerBase
{
    private readonly IConfiguracionService _service;
    private readonly IWhatsAppSender _whatsapp;
    public ConfiguracionController(IConfiguracionService service, IWhatsAppSender whatsapp)
    {
        _service  = service;
        _whatsapp = whatsapp;
    }

    /// <summary>Config SMTP propia del usuario (sin exponer la contraseña).</summary>
    [HttpGet("smtp")]
    public async Task<IActionResult> GetSmtp() => Ok(await _service.GetSmtpAsync(UsuarioActualId()));

    /// <summary>Actualiza la config SMTP del usuario, incluido su correo emisor.</summary>
    [HttpPut("smtp")]
    public async Task<IActionResult> ActualizarSmtp([FromBody] ActualizarSmtpDto dto)
    {
        await _service.ActualizarSmtpAsync(UsuarioActualId(), dto);
        return NoContent();
    }

    /// <summary>Config de WhatsApp (Evolution API) propia del usuario, sin exponer la ApiKey.</summary>
    [HttpGet("whatsapp")]
    public async Task<IActionResult> GetWhatsapp() => Ok(await _service.GetEvolutionAsync(UsuarioActualId()));

    /// <summary>Actualiza la config de WhatsApp (Evolution API) del usuario.</summary>
    [HttpPut("whatsapp")]
    public async Task<IActionResult> ActualizarWhatsapp([FromBody] ActualizarEvolutionDto dto)
    {
        await _service.ActualizarEvolutionAsync(UsuarioActualId(), dto);
        return NoContent();
    }

    /// <summary>Envía un WhatsApp de prueba al número indicado, usando la config guardada del usuario.</summary>
    [HttpPost("whatsapp/test")]
    public async Task<IActionResult> ProbarWhatsapp([FromBody] ProbarWhatsappDto dto)
    {
        var uid = UsuarioActualId();
        if (string.IsNullOrWhiteSpace(dto.Telefono))
            return Ok(new ProbarWhatsappResultDto { Ok = false, Mensaje = "Ingresá un número de teléfono." });

        if (!await _whatsapp.HabilitadoParaAsync(uid))
            return Ok(new ProbarWhatsappResultDto { Ok = false, Mensaje = "El envío por WhatsApp está desactivado. Habilitalo y guardá la configuración antes de probar." });

        try
        {
            await _whatsapp.EnviarAsync(
                dto.Telefono,
                "✅ Mensaje de prueba de AMR Producción de Seguros. Si lo estás viendo, tu WhatsApp quedó configurado correctamente.",
                uid);
            return Ok(new ProbarWhatsappResultDto { Ok = true, Mensaje = $"Mensaje de prueba enviado a {dto.Telefono}. Revisá el WhatsApp de ese número." });
        }
        catch (Exception ex)
        {
            return Ok(new ProbarWhatsappResultDto { Ok = false, Mensaje = "No se pudo enviar: " + ex.Message });
        }
    }

    private int UsuarioActualId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : 0;
    }
}
