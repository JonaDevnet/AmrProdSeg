using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

/// <summary>Autorización y registro de eliminaciones de póliza. Sólo Administradores.</summary>
[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public class EliminacionesController : ControllerBase
{
    private readonly IEliminacionService _service;
    public EliminacionesController(IEliminacionService service) => _service = service;

    /// <summary>Solicitudes de eliminación de póliza pendientes (para el Admin).</summary>
    [HttpGet("pendientes")]
    public async Task<IActionResult> Pendientes() => Ok(await _service.GetPendientesAsync());

    /// <summary>Registro histórico de eliminaciones (ejecutadas/rechazadas), con quién solicitó y quién autorizó.</summary>
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

    // ── Papelera ──
    /// <summary>Pólizas en la papelera (eliminadas, recuperables).</summary>
    [HttpGet("papelera")]
    public async Task<IActionResult> Papelera() => Ok(await _service.GetPapeleraAsync());

    /// <summary>Restaura una póliza de la papelera (vuelve a estar activa).</summary>
    [HttpPost("papelera/{polizaId:int}/restaurar")]
    public async Task<IActionResult> Restaurar(int polizaId)
    {
        await _service.RestaurarAsync(polizaId, UsuarioActualId());
        return NoContent();
    }

    /// <summary>Borra DEFINITIVAMENTE una póliza de la papelera (no se puede deshacer).</summary>
    [HttpDelete("papelera/{polizaId:int}")]
    public async Task<IActionResult> BorrarDefinitivo(int polizaId)
    {
        await _service.BorrarDefinitivoAsync(polizaId, UsuarioActualId());
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
