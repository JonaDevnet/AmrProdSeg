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
public class AltasController : ControllerBase
{
    private readonly IAltaService _service;

    public AltasController(IAltaService service) => _service = service;

    /// <summary>
    /// Alta de asegurado completa (wizard): cliente + vehículo + póliza + cuotas
    /// en una única transacción. Si algo falla, rollback total.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Registrar([FromBody] AltaAseguradoDto dto)
    {
        var resultado = await _service.RegistrarAsync(dto, UsuarioActualId());
        return Created($"/api/polizas/{resultado.PolizaId}", resultado);
    }

    private int UsuarioActualId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : 0;
    }
}
