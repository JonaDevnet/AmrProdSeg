using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

/// <summary>
/// Notas/recordatorios privados. Todo queda acotado al usuario autenticado:
/// nadie puede listar, crear ni eliminar notas de otro.
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
public class NotasController : ControllerBase
{
    private readonly INotaService _service;

    public NotasController(INotaService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _service.GetAsync(UsuarioActualId()));

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearNotaDto dto)
    {
        var id = await _service.CrearAsync(UsuarioActualId(), dto);
        return Created($"/api/notas/{id}", new { id });
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
