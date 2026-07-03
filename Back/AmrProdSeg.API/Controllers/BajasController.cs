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
public class BajasController : ControllerBase
{
    private readonly IBajaService _service;

    public BajasController(IBajaService service) => _service = service;

    /// <summary>Listado de bajas (opcional filtro por estado 0/1/2).</summary>
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] int? estado)
        => Ok(await _service.GetAllAsync(estado));

    /// <summary>Solicitar la baja de una póliza (queda pendiente de aprobación del Admin).</summary>
    [HttpPost]
    public async Task<IActionResult> Solicitar([FromBody] SolicitarBajaDto dto)
    {
        var id = await _service.SolicitarAsync(dto, UsuarioActualId());
        return Created($"/api/bajas/{id}", new { id });
    }

    /// <summary>Aprobar una baja — solo Admin (cancela la póliza).</summary>
    [HttpPost("{id:int}/aprobar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Aprobar(int id)
    {
        await _service.AprobarAsync(id, UsuarioActualId());
        return NoContent();
    }

    /// <summary>Rechazar una baja — solo Admin.</summary>
    [HttpPost("{id:int}/rechazar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Rechazar(int id)
    {
        await _service.RechazarAsync(id, UsuarioActualId());
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
