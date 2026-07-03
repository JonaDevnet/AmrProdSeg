using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public class AuditoriaController : ControllerBase
{
    private readonly IAuditoriaService _service;

    public AuditoriaController(IAuditoriaService service) => _service = service;

    /// <summary>Historial de cambios de un registro — solo Admin.</summary>
    [HttpGet]
    public async Task<IActionResult> PorRegistro([FromQuery] string tabla, [FromQuery] int registroId)
        => Ok(await _service.GetPorRegistroAsync(tabla, registroId));
}
