using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class VehiculosController : ControllerBase
{
    private readonly IVehiculoService _service;

    public VehiculosController(IVehiculoService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> PorCliente([FromQuery] int clienteId)
        => Ok(await _service.GetPorClienteAsync(clienteId));

    [HttpGet("por-patente")]
    public async Task<IActionResult> PorPatente([FromQuery] string patente)
    {
        var v = await _service.GetByPatenteAsync(patente);
        return v is null ? NotFound() : Ok(v);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearVehiculoDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Created($"/api/vehiculos/{id}", new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarVehiculoDto dto)
    {
        await _service.ActualizarAsync(id, dto);
        return NoContent();
    }
}
