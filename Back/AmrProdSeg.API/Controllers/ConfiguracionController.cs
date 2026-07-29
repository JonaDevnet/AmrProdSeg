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
    private readonly IEmailSender _email;
    public ConfiguracionController(IConfiguracionService service, IWhatsAppSender whatsapp, IEmailSender email)
    {
        _service  = service;
        _whatsapp = whatsapp;
        _email    = email;
    }

    /// <summary>Config de correo (Resend) propia del usuario, sin exponer la ApiKey.</summary>
    [HttpGet("resend")]
    public async Task<IActionResult> GetResend() => Ok(await _service.GetResendAsync(UsuarioActualId()));

    /// <summary>Actualiza la config de correo (Resend) del usuario, incluido su remitente.</summary>
    [HttpPut("resend")]
    public async Task<IActionResult> ActualizarResend([FromBody] ActualizarResendDto dto)
    {
        await _service.ActualizarResendAsync(UsuarioActualId(), dto);
        return NoContent();
    }

    /// <summary>Envía un correo de prueba al destino indicado, usando la config guardada del usuario.</summary>
    [HttpPost("resend/test")]
    public async Task<IActionResult> ProbarResend([FromBody] ProbarEmailDto dto)
    {
        var uid = UsuarioActualId();
        if (string.IsNullOrWhiteSpace(dto.Destino))
            return Ok(new ProbarWhatsappResultDto { Ok = false, Mensaje = "Ingresá un correo de destino." });

        if (!await _email.HabilitadoParaAsync(uid))
            return Ok(new ProbarWhatsappResultDto { Ok = false, Mensaje = "El envío de correo está desactivado o falta la ApiKey/remitente. Completá y guardá la configuración antes de probar." });

        try
        {
            await _email.EnviarAsync(
                dto.Destino,
                "Prueba de correo — AMR Producción de Seguros",
                "<p>✅ Este es un correo de prueba de <b>AMR Producción de Seguros</b>. Si lo estás viendo, Resend quedó configurado correctamente.</p>",
                uid);
            return Ok(new ProbarWhatsappResultDto { Ok = true, Mensaje = $"Correo de prueba enviado a {dto.Destino}. Revisá la bandeja (y spam)." });
        }
        catch (Exception ex)
        {
            return Ok(new ProbarWhatsappResultDto { Ok = false, Mensaje = "No se pudo enviar: " + ex.Message });
        }
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
