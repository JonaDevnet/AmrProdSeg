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

        // Un vehículo solo puede tener UNA póliza vigente a la vez. Si la patente ya existe
        // pero sus pólizas están dadas de baja (canceladas/vencidas), se REUTILIZA el vehículo
        // para la nueva póliza en lugar de bloquear la carga.
        var tienePatente = !string.IsNullOrWhiteSpace(dto.Patente);
        var vehiculoExistente = tienePatente
            ? await _vehiculoRepo.GetByPatenteAsync(dto.Patente!)
            : null;
        if (vehiculoExistente != null)
        {
            var polizaVigente = await _polizaRepo.GetActivaPorVehiculoAsync(vehiculoExistente.Id);
            if (polizaVigente != null)
                throw new BusinessException(
                    $"El vehículo con patente {dto.Patente} ya posee una póliza vigente ({polizaVigente.Numero}). " +
                    "Dala de baja antes de crear una nueva.");
        }

        if (await _companiaRepo.GetByIdAsync(dto.CompaniaId) is null)
            throw new BusinessException($"La compañía {dto.CompaniaId} no existe.");

        var cliente = new Cliente
        {
            Id            = clienteExistente?.Id ?? 0,   // >0 = cliente ya existente (no se crea de nuevo)
            Nombre        = Up(dto.ClienteNombre) ?? dto.ClienteNombre,
            Documento     = dto.Documento,
            Email         = dto.Email,          // el email queda como se escribió (no en mayúsculas)
            Telefono      = dto.Telefono,
            Direccion     = Up(dto.Direccion),
            TipoDocumento = dto.TipoDocumento,
            FechaNacimiento = dto.FechaNacimiento
        };

        // El vehículo se crea sólo si el ramo lo requiere (hay patente/marca cargada).
        // Si la patente ya existía (póliza dada de baja), Id>0 → se reutiliza el vehículo.
        Vehiculo? vehiculo = tienePatente
            ? new Vehiculo
            {
                Id            = vehiculoExistente?.Id ?? 0,
                Marca         = Up(dto.Marca) ?? "",
                Modelo        = Up(dto.Modelo) ?? "",
                Anio          = dto.Anio ?? 0,
                Patente       = Up(dto.Patente) ?? dto.Patente!,
                Chasis        = Up(dto.Chasis),
                Motor         = Up(dto.Motor),
                TipoCobertura = Up(dto.TipoCobertura),
                Combustion    = Up(dto.Combustion)
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
            Cobertura      = Up(dto.TipoCobertura)   // la cobertura elegida en el alta
        };

        // Todo en una transacción; las cuotas se generan con el PolizaId creado
        var (clienteId, vehiculoId, polizaId) = await _altaRepo.AltaCompletaAsync(
            cliente, vehiculo, poliza,
            nuevoPolizaId =>
            {
                poliza.Id = nuevoPolizaId;
                return CuotaCalculator.Generar(poliza, dto.PrimerVencimiento ?? poliza.FechaInicio.AddMonths(1));
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

    /// <summary>Normaliza un texto a MAYÚSCULAS (trim). Devuelve null si viene vacío.</summary>
    private static string? Up(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim().ToUpperInvariant();
}
