using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class AltaService : IAltaService
{
    private readonly IAltaRepository _altaRepo;
    private readonly IClienteRepository _clienteRepo;
    private readonly IVehiculoRepository _vehiculoRepo;
    private readonly IPolizaRepository _polizaRepo;
    private readonly ICompaniaRepository _companiaRepo;
    private readonly IPdfService _pdfService;

    public AltaService(
        IAltaRepository altaRepo,
        IClienteRepository clienteRepo,
        IVehiculoRepository vehiculoRepo,
        IPolizaRepository polizaRepo,
        ICompaniaRepository companiaRepo,
        IPdfService pdfService)
    {
        _altaRepo     = altaRepo;
        _clienteRepo  = clienteRepo;
        _vehiculoRepo = vehiculoRepo;
        _polizaRepo   = polizaRepo;
        _companiaRepo = companiaRepo;
        _pdfService   = pdfService;
    }

    public async Task<AltaResultDto> RegistrarAsync(AltaAseguradoDto dto, int? usuarioId = null)
    {
        // Un cliente puede tener muchas pólizas: si el documento ya existe, se REUTILIZA el cliente.
        var clienteExistente = await _clienteRepo.VerificarDocumentoAsync(dto.Documento);

        // El vehículo pertenece a un solo cliente y una sola póliza: la patente no se puede repetir.
        var tienePatente = !string.IsNullOrWhiteSpace(dto.Patente);
        if (tienePatente && await _vehiculoRepo.GetByPatenteAsync(dto.Patente!) != null)
            throw new BusinessException($"Ya existe un vehículo con la patente {dto.Patente}. Un vehículo solo puede tener una póliza.");

        if (await _companiaRepo.GetByIdAsync(dto.CompaniaId) is null)
            throw new BusinessException($"La compañía {dto.CompaniaId} no existe.");

        var cliente = new Cliente
        {
            Id            = clienteExistente?.Id ?? 0,   // >0 = cliente ya existente (no se crea de nuevo)
            Nombre        = dto.ClienteNombre,
            Documento     = dto.Documento,
            Email         = dto.Email,
            Telefono      = dto.Telefono,
            Direccion     = dto.Direccion,
            TipoDocumento = dto.TipoDocumento
        };

        // El vehículo se crea sólo si el ramo lo requiere (hay patente/marca cargada)
        Vehiculo? vehiculo = tienePatente
            ? new Vehiculo
            {
                Marca         = dto.Marca ?? "",
                Modelo        = dto.Modelo ?? "",
                Anio          = dto.Anio ?? 0,
                Patente       = dto.Patente!,
                Chasis        = dto.Chasis,
                Motor         = dto.Motor,
                TipoCobertura = dto.TipoCobertura,
                Combustion    = dto.Combustion
            }
            : null;

        var poliza = new Poliza
        {
            CompaniaId     = dto.CompaniaId,
            RamoId         = dto.RamoId,
            FechaInicio    = dto.FechaInicio,
            FechaFin       = dto.FechaFin,
            PrecioTotal    = dto.PrecioTotal,
            CantidadCuotas = dto.CantidadCuotas,
            Estado         = EstadoPoliza.Activa,
            FechaEmision   = DateTime.UtcNow,
            FormaPago      = dto.FormaPago,
            PrimaOG        = dto.PrimaOG,
            VendedorId     = usuarioId,
            Cobertura      = dto.TipoCobertura   // la cobertura elegida en el alta
        };

        // Todo en una transacción; las cuotas se generan con el PolizaId creado
        var (clienteId, vehiculoId, polizaId) = await _altaRepo.AltaCompletaAsync(
            cliente, vehiculo, poliza,
            nuevoPolizaId =>
            {
                poliza.Id = nuevoPolizaId;
                return CuotaCalculator.Generar(poliza);
            });

        // Comprobante PDF (fuera de la transacción)
        var polizaCreada = await _polizaRepo.GetByIdAsync(polizaId);
        var pdfUrl = polizaCreada != null
            ? await _pdfService.GenerarComprobantePdfAsync(polizaCreada)
            : string.Empty;

        return new AltaResultDto
        {
            ClienteId  = clienteId,
            VehiculoId = vehiculoId,
            PolizaId   = polizaId,
            Numero     = polizaCreada?.Numero ?? string.Empty,
            PdfUrl     = pdfUrl
        };
    }
}
