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
public class PolizasController : ControllerBase
{
    private readonly IPolizaService _service;
    private readonly IEliminacionService _eliminacion;
    private readonly IEndosoService _endoso;
    private readonly ISolicitudCambioService _solicitudes;

    public PolizasController(IPolizaService service, IEliminacionService eliminacion, IEndosoService endoso, ISolicitudCambioService solicitudes)
    {
        _service = service;
        _eliminacion = eliminacion;
        _endoso = endoso;
        _solicitudes = solicitudes;
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] int? clienteId,
        [FromQuery] int? estado,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? termino = null,
        [FromQuery] string? campo = null)
        => Ok(await _service.ListarAsync(clienteId, estado, page, pageSize, UsuarioActualId(), EsAdmin(), termino, campo));

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

    /// <summary>
    /// Edita una póliza. El Admin aplica el cambio en el acto; el Productor deja una
    /// solicitud pendiente de autorización (la ve en la campanita del Admin).
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarPolizaDto dto)
    {
        var uid = UsuarioActualId();
        if (EsAdmin())
        {
            await _service.ActualizarAsync(id, dto, uid);
            return Ok(new CambioResultDto { Aplicada = true, Mensaje = "Póliza actualizada." });
        }
        var sid = await _solicitudes.SolicitarAsync("Poliza", id, "Editar", JsonSerializer.Serialize(dto), null, uid);
        return Ok(new CambioResultDto { Solicitada = true, Mensaje = sid == 0 ? "Ya hay una solicitud de edición pendiente para esta póliza." : "Solicitud de edición enviada. Queda pendiente de autorización del administrador." });
    }

    /// <summary>Asigna el número definitivo a una póliza en trámite (E/T).</summary>
    [HttpPut("{id:int}/numero")]
    public async Task<IActionResult> AsignarNumero(int id, [FromBody] AsignarNumeroDto dto)
    {
        await _service.AsignarNumeroAsync(id, dto.Numero, UsuarioActualId());
        return NoContent();
    }

    [HttpPut("{id:int}/cancelar")]
    public async Task<IActionResult> Cancelar(int id)
    {
        await _service.CancelarAsync(id, UsuarioActualId());
        return NoContent();
    }

    /// <summary>
    /// Renueva una póliza. Si la póliza tiene cuotas impagas, el Productor deja una solicitud
    /// pendiente de autorización del Admin (campanita); el Admin la aplica en el acto.
    /// </summary>
    [HttpPost("{id:int}/renovar")]
    public async Task<IActionResult> Renovar(int id, [FromBody] RenovarPolizaDto dto)
    {
        var uid = UsuarioActualId();
        if (await _service.TieneCuotasImpagasAsync(id) && !EsAdmin())
        {
            if (string.IsNullOrWhiteSpace(dto.Motivo))
                return BadRequest(new { error = "Indicá el motivo: la póliza tiene cuotas impagas y requiere autorización del administrador." });
            var sid = await _solicitudes.SolicitarAsync("Poliza", id, "Renovar", JsonSerializer.Serialize(dto), dto.Motivo, uid);
            return Ok(new RenovacionResultDto
            {
                Solicitada = true,
                Mensaje = sid == 0
                    ? "Ya hay una solicitud de renovación pendiente para esta póliza."
                    : "Solicitud de renovación enviada. Queda pendiente de autorización del administrador."
            });
        }
        var res = await _service.RenovarAsync(id, dto, uid);
        res.Aplicada = true;
        res.Mensaje = "Póliza renovada.";
        return Ok(res);
    }

    /// <summary>
    /// Refacturación: agrega un ciclo de cuotas a la MISMA póliza (no crea registro nuevo).
    /// Si hay cuotas impagas, el Productor deja una solicitud pendiente de autorización del Admin.
    /// </summary>
    [HttpPost("{id:int}/refacturar")]
    public async Task<IActionResult> Refacturar(int id, [FromBody] RenovarPolizaDto dto)
    {
        var uid = UsuarioActualId();
        if (await _service.TieneCuotasImpagasAsync(id) && !EsAdmin())
        {
            if (string.IsNullOrWhiteSpace(dto.Motivo))
                return BadRequest(new { error = "Indicá el motivo: la póliza tiene cuotas impagas y requiere autorización del administrador." });
            var sid = await _solicitudes.SolicitarAsync("Poliza", id, "Refacturar", JsonSerializer.Serialize(dto), dto.Motivo, uid);
            return Ok(new RenovacionResultDto
            {
                Solicitada = true,
                Mensaje = sid == 0
                    ? "Ya hay una solicitud de refacturación pendiente para esta póliza."
                    : "Solicitud de refacturación enviada. Queda pendiente de autorización del administrador."
            });
        }
        await _service.RefacturarAsync(id, dto, uid);
        return Ok(new RenovacionResultDto { Aplicada = true, Mensaje = "Póliza refacturada." });
    }

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

    private bool EsAdmin() => User.IsInRole("Admin") || User.IsInRole("SuperAdmin");
}
