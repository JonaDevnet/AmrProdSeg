using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Application.Mapping;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class PolizaService : IPolizaService
{
    private readonly IPolizaRepository _polizaRepo;
    private readonly ICobroRepository  _cobroRepo;
    private readonly ICompaniaRepository _companiaRepo;
    private readonly IVehiculoRepository _vehiculoRepo;
    private readonly IPdfService       _pdfService;

    public PolizaService(
        IPolizaRepository polizaRepo,
        ICobroRepository  cobroRepo,
        ICompaniaRepository companiaRepo,
        IVehiculoRepository vehiculoRepo,
        IPdfService       pdfService)
    {
        _polizaRepo = polizaRepo;
        _cobroRepo  = cobroRepo;
        _companiaRepo = companiaRepo;
        _vehiculoRepo = vehiculoRepo;
        _pdfService = pdfService;
    }

    /// <summary>Póliza activa (vigente) del vehículo con esa patente, o null.</summary>
    public async Task<PolizaDto?> GetActivaPorPatenteAsync(string patente)
    {
        var vehiculo = await _vehiculoRepo.GetByPatenteAsync((patente ?? string.Empty).Trim());
        if (vehiculo is null) return null;
        var poliza = await _polizaRepo.GetActivaPorVehiculoAsync(vehiculo.Id);
        return poliza?.ToDto();
    }

    public async Task<PolizaDto> CrearAsync(CrearPolizaDto dto, int? usuarioId = null)
    {
        if (await _companiaRepo.GetByIdAsync(dto.CompaniaId) is null)
            throw new BusinessException($"La compañía {dto.CompaniaId} no existe.");

        if (dto.VehiculoId is int vehId)
        {
            var polizaActiva = await _polizaRepo.GetActivaPorVehiculoAsync(vehId);
            if (polizaActiva != null)
                throw new BusinessException("El vehículo ya tiene una póliza activa.");
        }

        var poliza = new Poliza
        {
            ClienteId      = dto.ClienteId,
            VehiculoId     = dto.VehiculoId,
            CompaniaId     = dto.CompaniaId,
            RamoId         = dto.RamoId,
            FechaInicio    = dto.FechaInicio,
            FechaFin       = dto.FechaFin,
            PrecioTotal    = dto.PrecioTotal,
            CantidadCuotas = dto.CantidadCuotas,
            Estado         = EstadoPoliza.Activa,
            FechaEmision   = DateTime.UtcNow,
            VendedorId     = usuarioId,
            Cobertura      = dto.Cobertura
        };

        var id = await _polizaRepo.InsertarAsync(poliza);
        poliza.Id = id;

        await GenerarCuotasAsync(poliza);

        return poliza.ToDto();
    }

    public async Task<RenovacionResultDto> RenovarAsync(int polizaOrigenId, RenovarPolizaDto dto, int? usuarioId = null)
    {
        var origen = await _polizaRepo.GetByIdAsync(polizaOrigenId)
            ?? throw new NotFoundException("Póliza no encontrada.");

        // Validación de negocio: solo se renueva una póliza Activa o Vencida
        if (origen.Estado is not (EstadoPoliza.Activa or EstadoPoliza.Vencida))
            throw new BusinessException(
                $"No se puede renovar una póliza en estado {origen.Estado}.");

        if (dto.CompaniaId is int cia && await _companiaRepo.GetByIdAsync(cia) is null)
            throw new BusinessException($"La compañía {cia} no existe.");

        var nueva = new Poliza
        {
            ClienteId      = origen.ClienteId,
            VehiculoId     = origen.VehiculoId,
            CompaniaId     = dto.CompaniaId ?? origen.CompaniaId,
            FechaInicio    = dto.FechaInicio,
            FechaFin       = dto.FechaFin,
            PrecioTotal    = dto.PrecioTotal,
            CantidadCuotas = dto.CantidadCuotas,
            Estado         = EstadoPoliza.Activa,
            PolizaOrigenId = polizaOrigenId,
            FechaEmision   = DateTime.UtcNow,
            VendedorId     = usuarioId,
            PrimaOG        = dto.PrimaOG ?? origen.PrimaOG,   // prima OG de la renovación (o se mantiene la anterior)
            Cobertura      = string.IsNullOrWhiteSpace(dto.Cobertura) ? origen.Cobertura : dto.Cobertura,
            RamoId         = origen.RamoId,
            FormaPago      = origen.FormaPago
        };

        var nuevoId = await _polizaRepo.InsertarAsync(nueva);
        nueva.Id = nuevoId;

        await _polizaRepo.CambiarEstadoAsync(polizaOrigenId, EstadoPoliza.Renovada);
        await GenerarCuotasAsync(nueva);

        var pdfUrl = await _pdfService.GenerarComprobantePdfAsync(nueva);

        return new RenovacionResultDto { NuevaPolizaId = nuevoId, PdfUrl = pdfUrl };
    }

    public async Task<PolizaDto?> GetByIdAsync(int id)
    {
        var poliza = await _polizaRepo.GetByIdAsync(id);
        return poliza?.ToDto();
    }

    public async Task<PagedResult<PolizaDto>> ListarAsync(int? clienteId, int? estado, int page, int pageSize, int? usuarioId = null, bool esAdmin = false)
    {
        var (items, total) = await _polizaRepo.ListarAsync(clienteId, estado, page, pageSize, usuarioId, esAdmin);
        return new PagedResult<PolizaDto>
        {
            Items    = items.Select(p => p.ToDto()).ToList(),
            Total    = total,
            Page     = page,
            PageSize = pageSize
        };
    }

    public async Task ActualizarAsync(int id, ActualizarPolizaDto dto)
    {
        var poliza = await _polizaRepo.GetByIdAsync(id)
            ?? throw new NotFoundException("Póliza no encontrada.");

        if (await _companiaRepo.GetByIdAsync(dto.CompaniaId) is null)
            throw new BusinessException($"La compañía {dto.CompaniaId} no existe.");

        poliza.CompaniaId     = dto.CompaniaId;
        poliza.RamoId         = dto.RamoId;
        poliza.FechaInicio    = dto.FechaInicio;
        poliza.FechaFin       = dto.FechaFin;
        poliza.PrecioTotal    = dto.PrecioTotal;
        poliza.CantidadCuotas = dto.CantidadCuotas;
        poliza.FormaPago      = dto.FormaPago;
        poliza.PrimaOG        = dto.PrimaOG;
        poliza.Cobertura      = dto.Cobertura;
        await _polizaRepo.ActualizarAsync(poliza);

        // Regenera las cuotas AÚN NO cobradas según el nuevo precio, cantidad y fecha de inicio
        // (agrega/quita cuotas y recalcula montos y vencimientos). Las ya pagadas conservan su
        // monto y vencimiento (lo realmente cobrado), para que los reportes no cambien.
        await _cobroRepo.RegenerarPendientesAsync(id, dto.PrecioTotal, dto.CantidadCuotas, dto.FechaInicio);
    }

    public async Task AsignarNumeroAsync(int id, string numero)
    {
        numero = (numero ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(numero))
            throw new BusinessException("Ingresá el número de póliza.");
        var r = await _polizaRepo.AsignarNumeroAsync(id, numero);
        if (r == -1) throw new BusinessException("Ya existe una póliza con ese número.");
        if (r == 0)  throw new NotFoundException("Póliza no encontrada.");
    }

    public async Task CancelarAsync(int id)
    {
        var poliza = await _polizaRepo.GetByIdAsync(id)
            ?? throw new NotFoundException("Póliza no encontrada.");
        await _polizaRepo.CambiarEstadoAsync(poliza.Id, EstadoPoliza.Cancelada);
    }

    public async Task<byte[]> GenerarPdfAsync(int id)
    {
        var poliza = await _polizaRepo.GetByIdAsync(id)
            ?? throw new NotFoundException("Póliza no encontrada.");
        return await _pdfService.GenerarComprobanteAsync(poliza);
    }

    private Task GenerarCuotasAsync(Poliza poliza)
        => _cobroRepo.InsertarLoteAsync(CuotaCalculator.Generar(poliza));
}
