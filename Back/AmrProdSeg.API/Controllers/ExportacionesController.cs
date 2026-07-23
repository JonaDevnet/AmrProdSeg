using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize]
[Route("api/exportaciones")]
public class ExportacionesController : ControllerBase
{
    private readonly IExportacionService _service;
    public ExportacionesController(IExportacionService service) => _service = service;

    /// <summary>Exporta una póliza (cliente + póliza + vehículo) en PDF. Todo usuario puede.
    /// Registra un aviso para los administradores. Se abre inline.</summary>
    [HttpGet("poliza/{id:int}/pdf")]
    public async Task<IActionResult> ExportarPoliza(int id)
    {
        var bytes = await _service.ExportarPolizaAsync(id, UsuarioActualId());
        return File(bytes, "application/pdf");
    }

    /// <summary>Exportaciones recientes (para la campanita de los administradores).</summary>
    [HttpGet("recientes")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Recientes([FromQuery] int top = 20)
        => Ok(await _service.RecientesAsync(top));

    private int UsuarioActualId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : 0;
    }
}
