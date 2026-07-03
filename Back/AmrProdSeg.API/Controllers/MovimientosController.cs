using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

/// <summary>
/// Finanzas personales (ingresos / egresos). Todo queda acotado al usuario
/// autenticado: nadie ve los movimientos de otro.
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
public class MovimientosController : ControllerBase
{
    private readonly IMovimientoService _service;
    public MovimientosController(IMovimientoService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        => Ok(await _service.GetPorUsuarioAsync(UsuarioActualId(), desde, hasta));

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearMovimientoDto dto)
    {
        var id = await _service.CrearAsync(UsuarioActualId(), dto);
        return Created($"/api/movimientos/{id}", new { id });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _service.EliminarAsync(id, UsuarioActualId());
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
