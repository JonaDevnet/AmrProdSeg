using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Application.Mapping;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class ReporteService : IReporteService
{
    private readonly IReporteRepository _repo;

    public ReporteService(IReporteRepository repo) => _repo = repo;

    public async Task<List<CobroPeriodoDto>> CobrosPeriodoAsync(int mes, int anio, int? estado, int? companiaId)
    {
        var filas = await _repo.EjecutarAsync("sp_Reporte_CobrosPeriodo",
            ("@Mes", mes), ("@Anio", anio), ("@Estado", estado), ("@CompaniaId", companiaId));
        return filas.Select(f => new CobroPeriodoDto
        {
            Id               = f.Int("Id"),
            NumeroCuota      = f.Int("NumeroCuota"),
            FechaVencimiento = f.Date("FechaVencimiento"),
            Monto            = f.Dec("Monto"),
            Estado           = f.Int("Estado"),
            FechaPago        = f.DateN("FechaPago"),
            NroPoliza        = f.Str("NroPoliza"),
            ClienteNombre    = f.Str("ClienteNombre"),
            Compania         = f.Str("Compania")
        }).ToList();
    }

    public async Task<EstadoCuentaDto> EstadoCuentaAsync(int clienteId)
    {
        var (detalle, totales) = await _repo.EjecutarDetalleTotalesAsync(
            "sp_Reporte_EstadoCuenta", ("@ClienteId", clienteId));

        return new EstadoCuentaDto
        {
            Detalle = detalle.Select(f => new EstadoCuentaItemDto
            {
                Id               = f.Int("Id"),
                NroPoliza        = f.Str("NroPoliza"),
                NumeroCuota      = f.Int("NumeroCuota"),
                FechaVencimiento = f.Date("FechaVencimiento"),
                Monto            = f.Dec("Monto"),
                Estado           = f.Int("Estado"),
                FechaPago        = f.DateN("FechaPago")
            }).ToList(),
            TotalAbonado  = totales?.Dec("TotalAbonado")  ?? 0m,
            TotalAdeudado = totales?.Dec("TotalAdeudado") ?? 0m
        };
    }

    public async Task<List<DeudaAcumuladaDto>> DeudaAcumuladaAsync()
    {
        var filas = await _repo.EjecutarAsync("sp_Reporte_DeudaAcumulada");
        return filas.Select(f => new DeudaAcumuladaDto
        {
            ClienteId     = f.Int("ClienteId"),
            Nombre        = f.Str("Nombre"),
            Documento     = f.Str("Documento"),
            Telefono      = f.StrN("Telefono"),
            CuotasImpagas = f.Int("CuotasImpagas"),
            MontoAdeudado = f.Dec("MontoAdeudado")
        }).ToList();
    }

    public async Task<List<PolizaPorVencerDto>> PolizasPorVencerAsync(int dias, int? companiaId)
    {
        var filas = await _repo.EjecutarAsync("sp_Reporte_PolizasPorVencer",
            ("@DiasHorizonte", dias), ("@CompaniaId", companiaId));
        return filas.Select(f => new PolizaPorVencerDto
        {
            Nombre        = f.Str("Nombre"),
            Telefono      = f.StrN("Telefono"),
            Patente       = f.Str("Patente"),
            Compania      = f.Str("Compania"),
            NroPoliza     = f.Str("NroPoliza"),
            FechaFin      = f.Date("FechaFin"),
            DiasRestantes = f.Int("DiasRestantes")
        }).ToList();
    }

    public async Task<List<VencidaSinRenovarDto>> VencidasSinRenovarAsync()
    {
        var filas = await _repo.EjecutarAsync("sp_Reporte_VencidasSinRenovar");
        return filas.Select(f => new VencidaSinRenovarDto
        {
            ClienteNombre = f.Str("ClienteNombre"),
            Patente       = f.Str("Patente"),
            Compania      = f.Str("Compania"),
            NroPoliza     = f.Str("NroPoliza"),
            FechaFin      = f.Date("FechaFin"),
            DiasVencida   = f.Int("DiasVencida"),
            PrecioTotal   = f.Dec("PrecioTotal")
        }).ToList();
    }

    public async Task<List<CarteraCompaniaDto>> CarteraPorCompaniaAsync()
    {
        var filas = await _repo.EjecutarAsync("sp_Reporte_CarteraPorCompania");
        return filas.Select(f => new CarteraCompaniaDto
        {
            CompaniaId      = f.Int("CompaniaId"),
            Compania        = f.Str("Compania"),
            CantidadPolizas = f.Int("CantidadPolizas"),
            ClientesUnicos  = f.Int("ClientesUnicos"),
            PrimaTotal      = f.Dec("PrimaTotal")
        }).ToList();
    }

    public async Task<ProduccionMensualDto> ProduccionMensualAsync(int mes, int anio)
    {
        var filas = await _repo.EjecutarAsync("sp_Reporte_ProduccionMensual",
            ("@Mes", mes), ("@Anio", anio));
        var f = filas.FirstOrDefault() ?? new();
        return new ProduccionMensualDto
        {
            PolizasNuevas    = f.Int("PolizasNuevas"),
            PolizasRenovadas = f.Int("PolizasRenovadas"),
            TotalPolizas     = f.Int("TotalPolizas"),
            PrimaEmitida     = f.Dec("PrimaEmitida")
        };
    }

    public async Task<List<IngresoProyectadoDto>> IngresosProyectadosAsync(int meses)
    {
        var filas = await _repo.EjecutarAsync("sp_Reporte_IngresosProyectados", ("@Meses", meses));
        return filas.Select(f => new IngresoProyectadoDto
        {
            Anio            = f.Int("Anio"),
            Mes             = f.Int("Mes"),
            MontoProyectado = f.Dec("MontoProyectado"),
            CantidadCuotas  = f.Int("CantidadCuotas")
        }).ToList();
    }

    public async Task<List<PagoRecibidoDto>> PagosRecibidosAsync(DateTime desde, DateTime hasta, int? companiaId, int? oficinaId = null, int? vendedorId = null, string? vendedorRol = null)
    {
        var filas = await _repo.EjecutarAsync("sp_Reporte_PagosRecibidos",
            ("@Desde", desde), ("@Hasta", hasta), ("@CompaniaId", companiaId), ("@OficinaId", oficinaId), ("@VendedorId", vendedorId), ("@VendedorRol", vendedorRol));
        return filas.Select(f => new PagoRecibidoDto
        {
            Id            = f.Int("Id"),
            FechaPago     = f.Date("FechaPago"),
            Monto         = f.Dec("Monto"),
            NumeroCuota   = f.Int("NumeroCuota"),
            PolizaId      = f.Int("PolizaId"),
            NroPoliza     = f.Str("NroPoliza"),
            PrimaOG       = f.Dec("PrimaOG"),
            CantidadCuotas = f.Int("CantidadCuotas"),
            ClienteNombre = f.Str("ClienteNombre"),
            Compania      = f.Str("Compania"),
            CompaniaId    = f.Int("CompaniaId"),
            Ramo          = f.Str("Ramo"),
            Metodo        = f.Str("Metodo"),
            Patente       = f.Str("Patente"),
            OficinaId     = f.IntN("OficinaId"),
            OficinaNombre = f.Str("OficinaNombre"),
            VendedorId    = f.IntN("VendedorId"),
            VendedorNombre = f.Str("VendedorNombre")
        }).ToList();
    }

    public async Task<List<CarteraExportDto>> CarteraExportAsync(int? vendedorId)
    {
        var filas = await _repo.EjecutarAsync("sp_Reporte_Cartera", ("@VendedorId", vendedorId));
        return filas.Select(f =>
        {
            var pagadas = f.Int("CuotasPagadas");
            var totalC  = f.Int("CuotasTotal");
            var actual  = totalC == 0 ? 0 : Math.Min(pagadas + 1, totalC); // cuota que se está cobrando
            return new CarteraExportDto
            {
                ProximoVencimiento = f.DateN("ProximoVencimiento"),
                Compania      = f.Str("Compania"),
                CuotaActual   = actual,
                CuotasTotal   = totalC,
                PrecioCobrado = f.Dec("PrecioCobrado"),
                PrecioTotal   = f.Dec("PrecioTotal"),
                PrimaOG       = f.Dec("PrimaOG"),
                NroPoliza     = f.Str("NroPoliza"),
                ClienteNombre = f.Str("ClienteNombre"),
                Documento     = f.Str("Documento"),
                TipoDocumento = f.Str("TipoDocumento"),
                Email         = f.Str("Email"),
                Telefono      = f.Str("Telefono"),
                Direccion     = f.Str("Direccion"),
                Patente       = f.Str("Patente"),
                Marca         = f.Str("Marca"),
                Modelo        = f.Str("Modelo"),
                Anio          = f.Str("Anio"),
                Chasis        = f.Str("Chasis"),
                Motor         = f.Str("Motor"),
                Combustion    = f.Str("Combustion"),
                TipoCobertura = f.Str("TipoCobertura"),
            };
        }).ToList();
    }
}
