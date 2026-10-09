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
    private readonly IRamoRepository   _ramoRepo;
    private readonly IVehiculoRepository _vehiculoRepo;
    private readonly IPdfService       _pdfService;
    private readonly IAuditoriaMovimientoService _auditoria;

    public PolizaService(
        IPolizaRepository polizaRepo,
        ICobroRepository  cobroRepo,
        ICompaniaRepository companiaRepo,
        IRamoRepository   ramoRepo,
        IVehiculoRepository vehiculoRepo,
        IPdfService       pdfService,
        IAuditoriaMovimientoService auditoria)
    {
        _polizaRepo = polizaRepo;
        _cobroRepo  = cobroRepo;
        _companiaRepo = companiaRepo;
        _ramoRepo   = ramoRepo;
        _vehiculoRepo = vehiculoRepo;
        _pdfService = pdfService;
        _auditoria = auditoria;
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

        // 1ª cuota: la indicada o, por defecto, un mes después del inicio.
        await GenerarCuotasAsync(poliza, dto.PrimerVencimiento ?? poliza.FechaInicio.AddMonths(1));

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

        // Se marca la original como Renovada ANTES de asignar el número: así su número queda
        // libre para la renovación (el check de AsignarNumero ignora las canceladas y renovadas).
        await _polizaRepo.CambiarEstadoAsync(polizaOrigenId, EstadoPoliza.Renovada);
        // NOTA: la 1ª cuota de la renovación se genera más abajo con dto.PrimerVencimiento.

        // Número de la renovación: el indicado (por defecto, el de la póliza original).
        if (!string.IsNullOrWhiteSpace(dto.Numero))
        {
            var r = await _polizaRepo.AsignarNumeroAsync(nuevoId, dto.Numero.Trim());
            if (r == -1)
                throw new BusinessException($"Ya existe otra póliza vigente con el número {dto.Numero}.");
            nueva.Numero = dto.Numero.Trim();
        }

        await GenerarCuotasAsync(nueva, dto.PrimerVencimiento ?? nueva.FechaInicio.AddMonths(1));

        var pdfUrl = await _pdfService.GenerarComprobantePdfAsync(nueva);

        return new RenovacionResultDto { NuevaPolizaId = nuevoId, PdfUrl = pdfUrl };
    }

    public async Task<PolizaDto?> GetByIdAsync(int id)
    {
        var poliza = await _polizaRepo.GetByIdAsync(id);
        return poliza?.ToDto();
    }

    public async Task<PagedResult<PolizaDto>> ListarAsync(int? clienteId, int? estado, int page, int pageSize, int? usuarioId = null, bool esAdmin = false, string? termino = null, string? campo = null)
    {
        var (items, total) = await _polizaRepo.ListarAsync(clienteId, estado, page, pageSize, usuarioId, esAdmin, termino, campo);
        return new PagedResult<PolizaDto>
        {
            Items    = items.Select(p => p.ToDto()).ToList(),
            Total    = total,
            Page     = page,
            PageSize = pageSize
        };
    }

    public async Task ActualizarAsync(int id, ActualizarPolizaDto dto, int? usuarioId = null, int? solicitanteId = null, string? motivo = null)
    {
        var poliza = await _polizaRepo.GetByIdAsync(id)
            ?? throw new NotFoundException("Póliza no encontrada.");

        var companiaNueva = await _companiaRepo.GetByIdAsync(dto.CompaniaId)
            ?? throw new BusinessException($"La compañía {dto.CompaniaId} no existe.");

        // Nombres de compañía/ramo para que el detalle sea legible (sólo los cambios).
        var companiaAnterior = await _companiaRepo.GetByIdAsync(poliza.CompaniaId);
        var ramos = (await _ramoRepo.GetAllAsync()).ToDictionary(r => r.Id, r => r.Nombre);
        var ramoAnterior = poliza.RamoId is int ridAnt ? ramos.GetValueOrDefault(ridAnt) : null;
        var ramoNuevo    = dto.RamoId    is int ridNue ? ramos.GetValueOrDefault(ridNue) : null;

        // Identificación de la póliza modificada (n° + patente) + detalle de los campos que cambian.
        var ident = $"Póliza {poliza.Numero}"
            + (string.IsNullOrWhiteSpace(poliza.Patente) ? "" : $" · Patente {poliza.Patente}");
        var detalle = AuditoriaDetalle.Cambios(new (string, object?, object?)[]
        {
            ("Compañía", companiaAnterior?.Nombre, companiaNueva.Nombre),
            ("Ramo", ramoAnterior, ramoNuevo),
            ("Inicio", poliza.FechaInicio, dto.FechaInicio),
            ("Fin", poliza.FechaFin, dto.FechaFin),
            ("Precio total", poliza.PrecioTotal, dto.PrecioTotal),
            ("Cuotas", poliza.CantidadCuotas, dto.CantidadCuotas),
            ("Forma de pago", poliza.FormaPago, dto.FormaPago),
            ("Prima OG", poliza.PrimaOG, dto.PrimaOG),
            ("Cobertura", poliza.Cobertura, dto.Cobertura),
        });

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

        // Regenera las cuotas AÚN NO cobradas según el nuevo precio, cantidad y vencimiento de
        // la 1ª cuota (agrega/quita cuotas y recalcula montos y vencimientos). Las ya pagadas
        // conservan su monto y vencimiento (lo realmente cobrado), para que los reportes no cambien.
        await _cobroRepo.RegenerarPendientesAsync(id, dto.PrecioTotal, dto.CantidadCuotas,
            dto.PrimerVencimiento ?? dto.FechaInicio.AddMonths(1));

        if (usuarioId is int uid)
            await _auditoria.RegistrarAsync(uid, "Poliza", id, "Editar", AuditoriaDetalle.ConMotivo($"{ident} — {detalle}", motivo), solicitanteId);
    }

    public async Task AsignarNumeroAsync(int id, string numero, int? usuarioId = null)
    {
        numero = (numero ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(numero))
            throw new BusinessException("Ingresá el número de póliza.");
        var r = await _polizaRepo.AsignarNumeroAsync(id, numero);
        if (r == -1) throw new BusinessException("Ya existe una póliza con ese número.");
        if (r == 0)  throw new NotFoundException("Póliza no encontrada.");
        if (usuarioId is int uid)
            await _auditoria.RegistrarAsync(uid, "Poliza", id, "AsignarNumero", $"Asignó el número \"{numero}\".");
    }

    public async Task CancelarAsync(int id, int? usuarioId = null)
    {
        var poliza = await _polizaRepo.GetByIdAsync(id)
            ?? throw new NotFoundException("Póliza no encontrada.");
        await _polizaRepo.CambiarEstadoAsync(poliza.Id, EstadoPoliza.Cancelada);
        if (usuarioId is int uid)
            await _auditoria.RegistrarAsync(uid, "Poliza", id, "Cancelar", $"Canceló la póliza {poliza.Numero}.");
    }

    /// <summary>
    /// Refacturación: agrega un nuevo ciclo de cuotas a la MISMA póliza (sin crear registro nuevo
    /// ni pasar al historial) y actualiza el período de cuotas/importes. La vigencia no cambia.
    /// </summary>
    public async Task RefacturarAsync(int id, RenovarPolizaDto dto, int? usuarioId = null)
    {
        var poliza = await _polizaRepo.GetByIdAsync(id)
            ?? throw new NotFoundException("Póliza no encontrada.");

        if (poliza.Estado != EstadoPoliza.Activa)
            throw new BusinessException($"No se puede refacturar una póliza en estado {poliza.Estado}.");
        if (dto.CantidadCuotas is < 1 or > 3)
            throw new BusinessException("El período de cuotas debe ser de 1 a 3 cuotas.");
        if (DateTime.Today >= poliza.FechaFin)
            throw new BusinessException("La vigencia de la póliza terminó: corresponde renovarla, no refacturarla.");

        var primerVenc = dto.PrimerVencimiento ?? DateTime.Today;
        await _cobroRepo.AgregarCicloAsync(id, dto.PrecioTotal, dto.CantidadCuotas, primerVenc,
            dto.PrimaOG, dto.Cobertura, null);

        if (usuarioId is int uid)
            await _auditoria.RegistrarAsync(uid, "Poliza", id, "Refacturar", $"Refacturó la póliza {poliza.Numero} ({dto.CantidadCuotas} cuotas).");
    }

    /// <summary>True si el ciclo vigente de la póliza tiene alguna cuota sin pagar (Pendiente o Vencida).</summary>
    public async Task<bool> TieneCuotasImpagasAsync(int polizaId)
    {
        var cuotas = await _cobroRepo.GetPorPolizaActualAsync(polizaId);
        return cuotas.Any(c => c.Estado != EstadoCobro.Pagado);
    }

    public async Task<byte[]> GenerarPdfAsync(int id)
    {
        var poliza = await _polizaRepo.GetByIdAsync(id)
            ?? throw new NotFoundException("Póliza no encontrada.");
        return await _pdfService.GenerarComprobanteAsync(poliza);
    }

    private Task GenerarCuotasAsync(Poliza poliza, DateTime primerVencimiento)
        => _cobroRepo.InsertarLoteAsync(CuotaCalculator.Generar(poliza, primerVencimiento));
}
