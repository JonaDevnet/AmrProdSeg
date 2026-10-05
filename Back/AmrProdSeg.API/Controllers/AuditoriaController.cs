using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin,SuperAdmin")]
[Route("api/[controller]")]
public class AuditoriaController : ControllerBase
{
    private readonly IAuditoriaService _service;
    private readonly IAuditoriaMovimientoService _movimientos;

    public AuditoriaController(IAuditoriaService service, IAuditoriaMovimientoService movimientos)
    {
        _service     = service;
        _movimientos = movimientos;
    }

    /// <summary>Historial de cambios de un registro — solo Admin.</summary>
    [HttpGet]
    public async Task<IActionResult> PorRegistro([FromQuery] string tabla, [FromQuery] int registroId)
        => Ok(await _service.GetPorRegistroAsync(tabla, registroId));

    /// <summary>Movimientos de auditoría (opcional filtrar por usuario) — solo Admin.</summary>
    [HttpGet("movimientos")]
    public async Task<IActionResult> Movimientos([FromQuery] int? usuarioId)
        => Ok(await _movimientos.ListarAsync(usuarioId));
}
