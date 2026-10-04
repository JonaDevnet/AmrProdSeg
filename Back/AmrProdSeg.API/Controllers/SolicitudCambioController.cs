using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

/// <summary>Solicitudes de cambio (editar/eliminar cliente, editar póliza) pendientes del Admin.</summary>
[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/solicitudes-cambio")]
public class SolicitudCambioController : ControllerBase
{
    private readonly ISolicitudCambioService _service;

    public SolicitudCambioController(ISolicitudCambioService service) => _service = service;

    [HttpGet("pendientes")]
    public async Task<IActionResult> Pendientes() => Ok(await _service.GetPendientesAsync());

    [HttpGet("historial")]
    public async Task<IActionResult> Historial() => Ok(await _service.GetHistorialAsync());

    [HttpPost("{id:int}/aprobar")]
    public async Task<IActionResult> Aprobar(int id)
    {
        await _service.AprobarAsync(id, UsuarioActualId());
        return NoContent();
    }

    [HttpPost("{id:int}/rechazar")]
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
