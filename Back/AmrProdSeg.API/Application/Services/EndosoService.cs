using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

/// <summary>
/// Endoso de cambio de titular: cambia el cliente de una póliza guardando el titular
/// anterior. No modifica nada más de la póliza; el vehículo asegurado se mueve al
/// nuevo titular. El cliente nuevo se reutiliza si el documento ya existe, o se crea.
/// </summary>
public class EndosoService : IEndosoService
{
    private readonly IEndosoRepository _endosoRepo;
    private readonly IPolizaRepository _polizaRepo;
    private readonly IClienteRepository _clienteRepo;
    private readonly INacionalidadRepository _nacionalidadRepo;

    public EndosoService(
        IEndosoRepository endosoRepo,
        IPolizaRepository polizaRepo,
        IClienteRepository clienteRepo,
        INacionalidadRepository nacionalidadRepo)
    {
        _endosoRepo  = endosoRepo;
        _polizaRepo  = polizaRepo;
        _clienteRepo = clienteRepo;
        _nacionalidadRepo = nacionalidadRepo;
    }

    public async Task<EndosoResultDto> EndosarTitularAsync(int polizaId, EndosoTitularDto dto, int? usuarioId = null)
    {
        if (dto.NacionalidadId is not int nacionalidadId || nacionalidadId <= 0)
            throw new BusinessException("Elegí la nacionalidad.");
        if (await _nacionalidadRepo.GetByIdAsync(nacionalidadId) is null)
            throw new BusinessException("La nacionalidad seleccionada no existe.");

        var poliza = await _polizaRepo.GetByIdAsync(polizaId)
            ?? throw new BusinessException("La póliza no existe.");

        var titularAnteriorId = poliza.ClienteId;

        // Si el documento ya existe, se reutiliza ese cliente; si no, se creará uno nuevo.
        var existente = await _clienteRepo.VerificarDocumentoAsync(dto.Documento);
        if (existente != null && existente.Id == titularAnteriorId)
            throw new BusinessException("El nuevo titular es el mismo que el titular actual de la póliza.");

        var clienteNuevo = new Cliente
        {
            Id            = existente?.Id ?? 0,
            Nombre        = Up(dto.ClienteNombre) ?? dto.ClienteNombre,
            Documento     = dto.Documento,
            Email         = dto.Email,
            Telefono      = dto.Telefono,
            Direccion     = Up(dto.Direccion),
            TipoDocumento = dto.TipoDocumento,
            NacionalidadId = dto.NacionalidadId,
        };

        var nuevoClienteId = await _endosoRepo.EndosarTitularAsync(
            polizaId, titularAnteriorId, clienteNuevo, poliza.VehiculoId, usuarioId, dto.Motivo);

        return new EndosoResultDto
        {
            PolizaId       = polizaId,
            NuevoClienteId = nuevoClienteId,
            Mensaje        = "El titular de la póliza se cambió correctamente."
        };
    }

    public async Task<List<EndosoHistorialDto>> GetHistorialAsync(int polizaId)
    {
        var endosos = await _endosoRepo.GetPorPolizaAsync(polizaId);
        return endosos.Select(e => new EndosoHistorialDto
        {
            Id                       = e.Id,
            FechaEndoso              = e.FechaEndoso,
            ClienteAnteriorNombre    = e.ClienteAnteriorNombre,
            ClienteAnteriorDocumento = e.ClienteAnteriorDocumento,
            ClienteNuevoNombre       = e.ClienteNuevoNombre,
            ClienteNuevoDocumento    = e.ClienteNuevoDocumento,
            UsuarioNombre            = e.UsuarioNombre,
            Motivo                   = e.Motivo,
        }).ToList();
    }

    /// <summary>Normaliza un texto a MAYÚSCULAS (trim). Devuelve null si viene vacío.</summary>
    private static string? Up(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim().ToUpperInvariant();
}
