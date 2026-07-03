using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CoberturasController : ControllerBase
{
    private readonly ICoberturaService _service;
    public CoberturasController(ICoberturaService service) => _service = service;

    /// <summary>Catálogo de coberturas — visible para cualquier usuario autenticado.</summary>
    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _service.GetAllAsync());

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Crear([FromBody] CrearCoberturaDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Created($"/api/coberturas/{id}", new { id });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _service.EliminarAsync(id);
        return NoContent();
    }
}
