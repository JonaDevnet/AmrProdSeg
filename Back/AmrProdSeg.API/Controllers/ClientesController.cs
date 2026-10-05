using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
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
    private readonly ISolicitudCambioService _solicitudes;

    public ClientesController(IClienteService service, IOficinaService oficinaService, ISolicitudCambioService solicitudes)
    {
        _service = service;
        _oficinaService = oficinaService;
        _solicitudes = solicitudes;
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
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Compartir(int id, [FromBody] CompartirClienteDto dto)
    {
        await _oficinaService.CompartirClienteAsync(id, dto.OficinaId);
        return NoContent();
    }

    /// <summary>Deja de compartir el cliente con una oficina — solo Admin.</summary>
    [HttpDelete("{id:int}/compartir/{oficinaId:int}")]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<IActionResult> Descompartir(int id, int oficinaId)
    {
        await _oficinaService.DescompartirClienteAsync(id, oficinaId);
        return NoContent();
    }

    /// <summary>
    /// Edita un cliente. El Admin aplica el cambio en el acto; el Productor deja una
    /// solicitud pendiente de autorización (la ve en la campanita del Admin).
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarClienteDto dto)
    {
        var uid = UsuarioActualId();
        if (EsAdmin())
        {
            await _service.ActualizarAsync(id, dto, uid);
            return Ok(new CambioResultDto { Aplicada = true, Mensaje = "Cliente actualizado." });
        }
        var sid = await _solicitudes.SolicitarAsync("Cliente", id, "Editar", JsonSerializer.Serialize(dto), null, uid);
        return Ok(new CambioResultDto { Solicitada = true, Mensaje = sid == 0 ? "Ya hay una solicitud de edición pendiente para este cliente." : "Solicitud de edición enviada. Queda pendiente de autorización del administrador." });
    }

    /// <summary>
    /// Elimina (borrado lógico) un cliente. El Admin lo ejecuta en el acto; el Productor
    /// deja una solicitud pendiente de autorización.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id, [FromBody] EliminarClienteDto? dto)
    {
        var uid = UsuarioActualId();
        if (EsAdmin())
        {
            var afectadas = await _service.EliminarAsync(id, uid);
            return afectadas == 0
                ? NotFound(new CambioResultDto { Mensaje = "Cliente no encontrado." })
                : Ok(new CambioResultDto { Aplicada = true, Mensaje = "Cliente eliminado." });
        }
        var sid = await _solicitudes.SolicitarAsync("Cliente", id, "Eliminar", null, dto?.Motivo, uid);
        return Ok(new CambioResultDto { Solicitada = true, Mensaje = sid == 0 ? "Ya hay una solicitud de eliminación pendiente para este cliente." : "Solicitud de eliminación enviada. Queda pendiente de autorización del administrador." });
    }

    /// <summary>Corrección del documento — solo Admin, queda registrada en AuditoriaCambios.</summary>
    [HttpPut("{id:int}/documento")]
    [Authorize(Roles = "Admin,SuperAdmin")]
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

    private bool EsAdmin() => User.IsInRole("Admin") || User.IsInRole("SuperAdmin");
}
