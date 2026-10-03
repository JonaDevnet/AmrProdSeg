using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

/// <summary>Auditoría de movimientos. La fecha/hora se toma del servidor de la app
/// (TZ America/Argentina/Buenos_Aires en el contenedor) para mostrar hora local.</summary>
public class AuditoriaMovimientoService : IAuditoriaMovimientoService
{
    private readonly IAuditoriaMovimientoRepository _repo;

    public AuditoriaMovimientoService(IAuditoriaMovimientoRepository repo) => _repo = repo;

    public Task RegistrarAsync(int usuarioId, string entidad, int registroId, string accion, string? detalle)
        => _repo.RegistrarAsync(usuarioId, entidad, registroId, accion, detalle, DateTime.Now);

    public Task<List<AuditoriaMovimiento>> ListarAsync(int? usuarioId)
        => _repo.ListarAsync(usuarioId);
}
