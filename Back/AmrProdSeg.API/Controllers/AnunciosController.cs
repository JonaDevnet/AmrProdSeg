using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

/// <summary>
/// Anuncios internos. Lectura para todos los usuarios autenticados; publicación
/// y eliminación sólo para Admin/SuperAdmin. El texto se guarda y devuelve como
/// texto plano: el frontend nunca lo interpreta como HTML.
/// </summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class AnunciosController : ControllerBase
{
    private readonly IAnuncioService _service;

    public AnunciosController(IAnuncioService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
        => Ok(await _service.GetAllAsync(page, pageSize));

    [HttpGet("nuevos")]
    public async Task<IActionResult> Nuevos()
        => Ok(await _service.GetNuevosAsync(UsuarioActualId()));

    [HttpPost("marcar-vistos")]
    public async Task<IActionResult> MarcarVistos()
    {
        await _service.MarcarVistosAsync(UsuarioActualId());
        return NoContent();
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    [RequestSizeLimit(32768)]
    public async Task<IActionResult> Crear([FromBody] CrearAnuncioDto dto)
    {
        var id = await _service.CrearAsync(UsuarioActualId(), dto);
        return Created($"/api/anuncios/{id}", new { id });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
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
