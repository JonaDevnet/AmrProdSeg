using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize]
[Route("api/metodos-pago")]
public class MetodosPagoController : ControllerBase
{
    private readonly IMetodoPagoService _service;

    public MetodosPagoController(IMetodoPagoService service) => _service = service;

    /// <summary>Catálogo compartido — visible para cualquier usuario autenticado.</summary>
    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _service.GetAllAsync());

    /// <summary>Alta de método de pago — solo Admin.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Crear([FromBody] CrearMetodoPagoDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Created($"/api/metodos-pago/{id}", new { id });
    }

    /// <summary>Eliminar (baja lógica) — solo Admin.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _service.EliminarAsync(id);
        return NoContent();
    }
}
