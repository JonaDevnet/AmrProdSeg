using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _service;

    public AuthController(IAuthService service) => _service = service;

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
        => Ok(await _service.LoginAsync(dto));

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequestDto dto)
        => Ok(await _service.RefreshAsync(dto.RefreshToken));

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshRequestDto dto)
    {
        await _service.LogoutAsync(dto.RefreshToken);
        return NoContent();
    }

    /// <summary>El vendedor solicita restablecer su contraseña (queda pendiente de autorización).</summary>
    [HttpPost("reset/solicitar")]
    [AllowAnonymous]
    public async Task<IActionResult> SolicitarReset([FromBody] SolicitarResetDto dto)
    {
        await _service.SolicitarResetAsync(dto.Email);
        return Ok(new { mensaje = "Si el email existe, se generó la solicitud. El administrador debe autorizarla." });
    }

    /// <summary>El vendedor define su nueva contraseña (sólo si el Admin autorizó la solicitud).</summary>
    [HttpPost("reset/confirmar")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmarReset([FromBody] ConfirmarResetDto dto)
    {
        await _service.ConfirmarResetAsync(dto.Email, dto.NuevaPassword);
        return NoContent();
    }
}
