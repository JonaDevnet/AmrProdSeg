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
public class PolizasController : ControllerBase
{
    private readonly IPolizaService _service;
    private readonly IEliminacionService _eliminacion;
    private readonly IEndosoService _endoso;

    public PolizasController(IPolizaService service, IEliminacionService eliminacion, IEndosoService endoso)
    {
        _service = service;
        _eliminacion = eliminacion;
        _endoso = endoso;
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] int? clienteId,
        [FromQuery] int? estado,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
        => Ok(await _service.ListarAsync(clienteId, estado, page, pageSize, UsuarioActualId(), EsAdmin()));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var poliza = await _service.GetByIdAsync(id);
        return poliza is null ? NotFound() : Ok(poliza);
    }

    /// <summary>Devuelve la póliza vigente del vehículo con esa patente (o 204 si no hay).</summary>
    [HttpGet("activa-por-patente/{patente}")]
    public async Task<IActionResult> ActivaPorPatente(string patente)
    {
        var poliza = await _service.GetActivaPorPatenteAsync(patente);
        return poliza is null ? NoContent() : Ok(poliza);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearPolizaDto dto)
    {
        var resultado = await _service.CrearAsync(dto, UsuarioActualId());
        return CreatedAtAction(nameof(GetById), new { id = resultado.Id }, resultado);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarPolizaDto dto)
    {
        await _service.ActualizarAsync(id, dto);
        return NoContent();
    }

    /// <summary>Asigna el número definitivo a una póliza en trámite (E/T).</summary>
    [HttpPut("{id:int}/numero")]
    public async Task<IActionResult> AsignarNumero(int id, [FromBody] AsignarNumeroDto dto)
    {
        await _service.AsignarNumeroAsync(id, dto.Numero);
        return NoContent();
    }

    [HttpPut("{id:int}/cancelar")]
    public async Task<IActionResult> Cancelar(int id)
    {
        await _service.CancelarAsync(id);
        return NoContent();
    }

    [HttpPost("{id:int}/renovar")]
    public async Task<IActionResult> Renovar(int id, [FromBody] RenovarPolizaDto dto)
        => Ok(await _service.RenovarAsync(id, dto, UsuarioActualId()));

    /// <summary>Endoso de cambio de titular: cambia el cliente de la póliza (guardando el anterior).</summary>
    [HttpPost("{id:int}/endoso")]
    public async Task<IActionResult> Endosar(int id, [FromBody] EndosoTitularDto dto)
        => Ok(await _endoso.EndosarTitularAsync(id, dto, UsuarioActualId()));

    /// <summary>Historial de endosos (titulares anteriores) de la póliza.</summary>
    [HttpGet("{id:int}/endosos")]
    public async Task<IActionResult> Endosos(int id)
        => Ok(await _endoso.GetHistorialAsync(id));

    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> Pdf(int id)
    {
        var bytes = await _service.GenerarPdfAsync(id);
        return File(bytes, "application/pdf", $"poliza-{id}.pdf");
    }

    /// <summary>Elimina la póliza y todo su registro (cuotas y vehículo si queda huérfano; conserva el cliente).
    /// El Admin la ejecuta en el acto; el Productor deja una solicitud pendiente de autorización.</summary>
    [HttpPost("{id:int}/eliminar")]
    public async Task<IActionResult> Eliminar(int id, [FromBody] EliminarPolizaDto? dto)
        => Ok(await _eliminacion.EliminarOSolicitarAsync(id, UsuarioActualId(), EsAdmin(), dto?.Motivo));

    private int UsuarioActualId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : 0;
    }

    private bool EsAdmin() => User.IsInRole("Admin");
}
