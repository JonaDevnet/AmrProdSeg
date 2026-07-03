using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class RamosController : ControllerBase
{
    private readonly IRamoService _service;

    public RamosController(IRamoService service) => _service = service;

    /// <summary>Catálogo de ramos — visible para cualquier usuario autenticado.</summary>
    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _service.GetAllAsync());

    /// <summary>Alta de ramo — sólo Admin.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Crear([FromBody] CrearRamoDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Created($"/api/ramos/{id}", new { id });
    }

    /// <summary>Eliminar (baja lógica) — sólo Admin.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _service.EliminarAsync(id);
        return NoContent();
    }
}
