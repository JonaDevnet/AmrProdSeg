using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public class AnulacionesController : ControllerBase
{
    private readonly IAnulacionService _service;
    public AnulacionesController(IAnulacionService service) => _service = service;

    /// <summary>Solicitudes de anulación de pago pendientes (para el Admin).</summary>
    [HttpGet("pendientes")]
    public async Task<IActionResult> Pendientes() => Ok(await _service.GetPendientesAsync());

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
