using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class OficinasController : ControllerBase
{
    private readonly IOficinaService _service;
    public OficinasController(IOficinaService service) => _service = service;

    /// <summary>Listado de oficinas — visible para cualquier usuario autenticado.</summary>
    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _service.GetAllAsync());

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Crear([FromBody] CrearOficinaDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Created($"/api/oficinas/{id}", new { id });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _service.EliminarAsync(id);
        return NoContent();
    }
}
