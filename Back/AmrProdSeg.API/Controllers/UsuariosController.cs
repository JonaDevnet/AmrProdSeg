using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _service;

    public UsuariosController(IUsuarioService service) => _service = service;

    /// <summary>Listado de usuarios — solo Admin.</summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Listar() => Ok(await _service.GetAllAsync());

    /// <summary>Alta de usuario (hashea con BCrypt) — solo Admin.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Crear([FromBody] CrearUsuarioDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Created($"/api/usuarios/{id}", new { id });
    }

    /// <summary>Cambio de la propia contraseña — cualquier usuario autenticado.</summary>
    [HttpPut("password")]
    public async Task<IActionResult> CambiarPassword([FromBody] CambiarPasswordDto dto)
    {
        await _service.CambiarPasswordAsync(UsuarioActualId(), dto);
        return NoContent();
    }

    /// <summary>Solicitudes de reset pendientes de autorización — solo Admin.</summary>
    [HttpGet("solicitudes-reset")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SolicitudesReset()
        => Ok(await _service.GetSolicitudesResetAsync());

    /// <summary>Autoriza una solicitud de reset — solo Admin.</summary>
    [HttpPost("solicitudes-reset/{id:int}/autorizar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AutorizarReset(int id)
    {
        await _service.AutorizarResetAsync(id, UsuarioActualId());
        return NoContent();
    }

    /// <summary>Asigna (o quita, con null) la oficina de un usuario — solo Admin.</summary>
    [HttpPut("{id:int}/oficina")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AsignarOficina(int id, [FromBody] AsignarOficinaDto dto)
    {
        await _service.AsignarOficinaAsync(id, dto.OficinaId);
        return NoContent();
    }

    /// <summary>Da de baja (baja lógica) un usuario — solo Admin.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Eliminar(int id)
    {
        if (id == UsuarioActualId())
            return BadRequest(new { mensaje = "No podés darte de baja a vos mismo." });
        await _service.EliminarAsync(id);
        return NoContent();
    }

    private int UsuarioActualId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : 0;
    }
}
