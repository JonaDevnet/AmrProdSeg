using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize]
[Route("api")]
public class CompaniasController : ControllerBase
{
    private readonly ICompaniaService _service;
    private readonly IReporteRepository _reporteRepo; // reutilizado para sp_Busqueda_Global

    public CompaniasController(ICompaniaService service, IReporteRepository reporteRepo)
    {
        _service     = service;
        _reporteRepo = reporteRepo;
    }

    [HttpGet("companias")]
    public async Task<IActionResult> Listar() => Ok(await _service.GetAllAsync());

    [HttpPost("companias")]
    public async Task<IActionResult> Crear([FromBody] CrearCompaniaDto dto)
    {
        var id = await _service.CrearAsync(dto);
        return Created($"/api/companias/{id}", new { id });
    }

    /// <summary>Eliminar (baja lógica) — sólo Admin.</summary>
    [HttpDelete("companias/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Eliminar(int id)
    {
        await _service.EliminarAsync(id);
        return NoContent();
    }

    [HttpGet("search")]
    public async Task<IActionResult> BusquedaGlobal([FromQuery] string q = "")
        => Ok(await _reporteRepo.EjecutarAsync("sp_Busqueda_Global", ("@Termino", q)));
}
