using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly IClienteService _service;
    private readonly IOficinaService _oficinaService;

    public ClientesController(IClienteService service, IOficinaService oficinaService)
    {
        _service = service;
        _oficinaService = oficinaService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string q = "",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => Ok(await _service.BuscarAsync(q, page, pageSize, UsuarioActualId(), EsAdmin()));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var cliente = await _service.GetByIdAsync(id);
        return cliente is null ? NotFound() : Ok(cliente);
    }

    /// <summary>Ficha completa del cliente en PDF (datos + vehículos + todas las pólizas). Se abre inline.</summary>
    [HttpGet("{id:int}/dossier-pdf")]
    public async Task<IActionResult> DossierPdf(int id)
    {
        var bytes = await _service.GenerarDossierPdfAsync(id, UsuarioActualId(), EsAdmin());
        return File(bytes, "application/pdf");
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearClienteDto dto)
    {
        var id = await _service.CrearAsync(dto, UsuarioActualId());
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    /// <summary>Oficinas con las que este cliente está compartido.</summary>
    [HttpGet("{id:int}/compartir")]
    public async Task<IActionResult> GetCompartido(int id)
        => Ok(await _oficinaService.GetOficinasDeClienteAsync(id));

    /// <summary>Comparte el cliente con otra oficina — solo Admin.</summary>
    [HttpPost("{id:int}/compartir")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Compartir(int id, [FromBody] CompartirClienteDto dto)
    {
        await _oficinaService.CompartirClienteAsync(id, dto.OficinaId);
        return NoContent();
    }

    /// <summary>Deja de compartir el cliente con una oficina — solo Admin.</summary>
    [HttpDelete("{id:int}/compartir/{oficinaId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Descompartir(int id, int oficinaId)
    {
        await _oficinaService.DescompartirClienteAsync(id, oficinaId);
        return NoContent();
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarClienteDto dto)
    {
        await _service.ActualizarAsync(id, dto);
        return NoContent();
    }

    /// <summary>Corrección del documento — solo Admin, queda registrada en AuditoriaCambios.</summary>
    [HttpPut("{id:int}/documento")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ActualizarDocumento(int id, [FromBody] ActualizarDocumentoDto dto)
    {
        await _service.ActualizarDocumentoAsync(id, dto.Documento, UsuarioActualId());
        return NoContent();
    }

    /// <summary>Obtiene el Id del usuario autenticado desde el claim "sub"/NameIdentifier.</summary>
    private int UsuarioActualId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : 0;
    }

    private bool EsAdmin() => User.IsInRole("Admin");
}
