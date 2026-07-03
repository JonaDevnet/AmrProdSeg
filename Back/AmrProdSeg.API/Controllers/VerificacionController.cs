using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

/// <summary>Verificación pública de póliza (destino del QR del comprobante). Sin autenticación.</summary>
[ApiController]
[AllowAnonymous]
[Route("api/[controller]")]
public class VerificarController : ControllerBase
{
    private readonly IVerificacionService _service;
    public VerificarController(IVerificacionService service) => _service = service;

    [HttpGet("{token:guid}")]
    public async Task<IActionResult> Get(Guid token)
    {
        var data = await _service.GetAsync(token);
        return data is null ? NotFound() : Ok(data);
    }
}
