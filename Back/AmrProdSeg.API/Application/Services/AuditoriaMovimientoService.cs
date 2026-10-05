using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

/// <summary>Auditoría de movimientos. La fecha/hora se toma del servidor de la app
/// (TZ America/Argentina/Buenos_Aires en el contenedor) para mostrar hora local.</summary>
public class AuditoriaMovimientoService : IAuditoriaMovimientoService
{
    private const int MaxDetalle = 500;   // columna Detalle NVARCHAR(500)

    private readonly IAuditoriaMovimientoRepository _repo;
    private readonly ILogger<AuditoriaMovimientoService> _logger;

    public AuditoriaMovimientoService(IAuditoriaMovimientoRepository repo, ILogger<AuditoriaMovimientoService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task RegistrarAsync(int usuarioId, string entidad, int registroId, string accion, string? detalle)
    {
        var d = string.IsNullOrEmpty(detalle) ? detalle : detalle.Length <= MaxDetalle ? detalle : detalle[..MaxDetalle];
        try
        {
            // La auditoría corre DESPUÉS del cambio de negocio ya confirmado: si el INSERT
            // falla (BD caída, FK, etc.) no debe tumbar la operación aplicada ni devolver 500.
            await _repo.RegistrarAsync(usuarioId, entidad, registroId, accion, d, DateTime.Now);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "No se pudo registrar auditoría: {Entidad}#{RegistroId} {Accion}.", entidad, registroId, accion);
        }
    }

    public Task<List<AuditoriaMovimiento>> ListarAsync(int? usuarioId)
        => _repo.ListarAsync(usuarioId);
}
