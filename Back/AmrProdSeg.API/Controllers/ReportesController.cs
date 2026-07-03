using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Application.Mapping;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ReportesController : ControllerBase
{
    private readonly IReporteService _reportes;
    private readonly IPdfService _pdf;
    private readonly IExcelExportService _excel;

    public ReportesController(IReporteService reportes, IPdfService pdf, IExcelExportService excel)
    {
        _reportes = reportes;
        _pdf      = pdf;
        _excel    = excel;
    }

    // ---- Cobros del período (pantalla / pdf / excel) ----
    [HttpGet("cobros-periodo")]
    public async Task<IActionResult> CobrosPeriodo(int mes, int anio, int? estado, int? companiaId)
        => Ok(await _reportes.CobrosPeriodoAsync(mes, anio, estado, companiaId));

    [HttpGet("cobros-periodo/pdf")]
    public async Task<IActionResult> CobrosPeriodoPdf(int mes, int anio, int? estado, int? companiaId)
    {
        var datos = await _reportes.CobrosPeriodoAsync(mes, anio, estado, companiaId);
        return File(_pdf.GenerarTabla("Cobros del período", RowMapper.ToRows(datos)), "application/pdf", "cobros-periodo.pdf");
    }

    [HttpGet("cobros-periodo/excel")]
    public async Task<IActionResult> CobrosPeriodoExcel(int mes, int anio, int? estado, int? companiaId)
    {
        var datos = await _reportes.CobrosPeriodoAsync(mes, anio, estado, companiaId);
        return Xlsx(_excel.Exportar("CobrosPeriodo", RowMapper.ToRows(datos)), "cobros-periodo.xlsx");
    }

    // ---- Estado de cuenta ----
    [HttpGet("estado-cuenta/{clienteId:int}")]
    public async Task<IActionResult> EstadoCuenta(int clienteId)
        => Ok(await _reportes.EstadoCuentaAsync(clienteId));

    [HttpGet("estado-cuenta/{clienteId:int}/pdf")]
    public async Task<IActionResult> EstadoCuentaPdf(int clienteId)
    {
        var ec = await _reportes.EstadoCuentaAsync(clienteId);
        return File(_pdf.GenerarTabla("Estado de cuenta", RowMapper.ToRows(ec.Detalle)), "application/pdf", "estado-cuenta.pdf");
    }

    // ---- Deuda acumulada ----
    [HttpGet("deuda-acumulada")]
    public async Task<IActionResult> DeudaAcumulada()
        => Ok(await _reportes.DeudaAcumuladaAsync());

    [HttpGet("deuda-acumulada/excel")]
    public async Task<IActionResult> DeudaAcumuladaExcel()
        => Xlsx(_excel.Exportar("DeudaAcumulada", RowMapper.ToRows(await _reportes.DeudaAcumuladaAsync())), "deuda-acumulada.xlsx");

    // ---- Pólizas por vencer ----
    [HttpGet("polizas-por-vencer")]
    public async Task<IActionResult> PolizasPorVencer(int dias = 30, int? companiaId = null)
        => Ok(await _reportes.PolizasPorVencerAsync(dias, companiaId));

    [HttpGet("polizas-por-vencer/pdf")]
    public async Task<IActionResult> PolizasPorVencerPdf(int dias = 30, int? companiaId = null)
        => File(_pdf.GenerarTabla("Pólizas por vencer", RowMapper.ToRows(await _reportes.PolizasPorVencerAsync(dias, companiaId))), "application/pdf", "polizas-por-vencer.pdf");

    [HttpGet("polizas-por-vencer/excel")]
    public async Task<IActionResult> PolizasPorVencerExcel(int dias = 30, int? companiaId = null)
        => Xlsx(_excel.Exportar("PolizasPorVencer", RowMapper.ToRows(await _reportes.PolizasPorVencerAsync(dias, companiaId))), "polizas-por-vencer.xlsx");

    // ---- Vencidas sin renovar ----
    [HttpGet("vencidas-sin-renovar")]
    public async Task<IActionResult> VencidasSinRenovar()
        => Ok(await _reportes.VencidasSinRenovarAsync());

    [HttpGet("vencidas-sin-renovar/excel")]
    public async Task<IActionResult> VencidasSinRenovarExcel()
        => Xlsx(_excel.Exportar("VencidasSinRenovar", RowMapper.ToRows(await _reportes.VencidasSinRenovarAsync())), "vencidas-sin-renovar.xlsx");

    // ---- Cartera por compañía ----
    [HttpGet("cartera-por-compania")]
    public async Task<IActionResult> CarteraPorCompania()
        => Ok(await _reportes.CarteraPorCompaniaAsync());

    [HttpGet("cartera-por-compania/pdf")]
    public async Task<IActionResult> CarteraPorCompaniaPdf()
        => File(_pdf.GenerarTabla("Cartera por compañía", RowMapper.ToRows(await _reportes.CarteraPorCompaniaAsync())), "application/pdf", "cartera-por-compania.pdf");

    // ---- Producción mensual ----
    [HttpGet("produccion-mensual")]
    public async Task<IActionResult> ProduccionMensual(int mes, int anio)
        => Ok(await _reportes.ProduccionMensualAsync(mes, anio));

    [HttpGet("produccion-mensual/pdf")]
    public async Task<IActionResult> ProduccionMensualPdf(int mes, int anio)
        => File(_pdf.GenerarTabla("Producción mensual", RowMapper.ToRows(new[] { await _reportes.ProduccionMensualAsync(mes, anio) })), "application/pdf", "produccion-mensual.pdf");

    // ---- Ingresos proyectados ----
    [HttpGet("ingresos-proyectados")]
    public async Task<IActionResult> IngresosProyectados(int meses = 12)
        => Ok(await _reportes.IngresosProyectadosAsync(meses));

    [HttpGet("ingresos-proyectados/excel")]
    public async Task<IActionResult> IngresosProyectadosExcel(int meses = 12)
        => Xlsx(_excel.Exportar("IngresosProyectados", RowMapper.ToRows(await _reportes.IngresosProyectadosAsync(meses))), "ingresos-proyectados.xlsx");

    // ---- Pagos recibidos (rango) — base de Pagos / Rendición / Hechos del día ----
    [HttpGet("pagos-recibidos")]
    public async Task<IActionResult> PagosRecibidos(DateTime desde, DateTime hasta, int? companiaId, int? oficinaId, int? vendedorId, string? vendedorRol)
        => Ok(await _reportes.PagosRecibidosAsync(desde, hasta, companiaId, oficinaId, VendedorScope(vendedorId), SoloAdminRol(vendedorRol)));

    [HttpGet("pagos-recibidos/excel")]
    public async Task<IActionResult> PagosRecibidosExcel(DateTime desde, DateTime hasta, int? companiaId, int? oficinaId, int? vendedorId, string? vendedorRol)
        => Xlsx(_excel.Exportar("PagosRecibidos", RowMapper.ToRows(await _reportes.PagosRecibidosAsync(desde, hasta, companiaId, oficinaId, VendedorScope(vendedorId), SoloAdminRol(vendedorRol)))), "pagos-recibidos.xlsx");

    // ---- Export de cartera (datos completos por póliza) — solo Admin ----
    [HttpGet("cartera")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Cartera(int? vendedorId)
        => Ok(await _reportes.CarteraExportAsync(vendedorId));

    /// <summary>Un productor solo rinde SUS cobros (se fuerza su Id). El Admin ve todos o el vendedor que elija.</summary>
    private int? VendedorScope(int? vendedorId) => User.IsInRole("Admin") ? vendedorId : UsuarioActualId();
    /// <summary>El filtro por rol (ej. todos los Admin) solo lo puede aplicar un Admin.</summary>
    private string? SoloAdminRol(string? rol)
        => User.IsInRole("Admin") && (rol == "Admin" || rol == "Productor") ? rol : null;

    private int UsuarioActualId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub)
               ?? User.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : 0;
    }

    private FileContentResult Xlsx(byte[] bytes, string nombre)
        => File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", nombre);
}
