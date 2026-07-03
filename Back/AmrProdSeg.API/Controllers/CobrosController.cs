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
public class CobrosController : ControllerBase
{
    private readonly ICobroService _service;
    private readonly IAnulacionService _anulacion;

    public CobrosController(ICobroService service, IAnulacionService anulacion)
    {
        _service = service;
        _anulacion = anulacion;
    }

    [HttpGet]
    public async Task<IActionResult> PorPoliza([FromQuery] int polizaId)
        => Ok(await _service.GetPorPolizaAsync(polizaId));

    [HttpGet("pendientes")]
    public async Task<IActionResult> Pendientes([FromQuery] int mes, [FromQuery] int anio)
        => Ok(await _service.GetPendientesMesAsync(mes, anio));

    [HttpPut("{id:int}/pagar")]
    public async Task<IActionResult> Pagar(int id, [FromBody] MarcarPagoDto dto)
    {
        await _service.PagarAsync(id, dto.FechaPago, dto.MetodoPagoId, UsuarioActualId());
        return NoContent();
    }

    /// <summary>Envía el comprobante de pago por Email o WhatsApp al asegurado.</summary>
    [HttpPost("{id:int}/comprobante/enviar")]
    public async Task<IActionResult> EnviarComprobante(int id, [FromBody] EnviarComprobanteDto dto)
        => Ok(await _service.EnviarComprobanteAsync(id, dto.Canal));

    /// <summary>Descarga el comprobante (1ª hoja, con talón recortable) para imprimir.</summary>
    [HttpGet("{id:int}/comprobante/imprimir")]
    public async Task<IActionResult> ImprimirComprobante(int id)
    {
        var (pdf, nombreArchivo) = await _service.GenerarComprobanteImpresionAsync(id);
        return File(pdf, "application/pdf", nombreArchivo);
    }

    /// <summary>Descarga el ticket (2ª hoja, sin logo) para imprimir.</summary>
    [HttpGet("{id:int}/ticket/imprimir")]
    public async Task<IActionResult> ImprimirTicket(int id)
    {
        var (pdf, nombreArchivo) = await _service.GenerarTicketImpresionAsync(id);
        return File(pdf, "application/pdf", nombreArchivo);
    }

    /// <summary>
    /// Anula el pago de una cuota. El Admin la revierte en el acto; el Productor
    /// genera una solicitud que el Admin debe aprobar.
    /// </summary>
    [HttpPost("{id:int}/anular")]
    public async Task<IActionResult> Anular(int id, [FromBody] AnularPagoDto dto)
        => Ok(await _anulacion.AnularOSolicitarAsync(id, UsuarioActualId(), EsAdmin(), dto.Motivo));

    private bool EsAdmin() => User.IsInRole("Admin");

    private int UsuarioActualId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : 0;
    }
}
