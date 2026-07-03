using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class AuditoriaService : IAuditoriaService
{
    private readonly IAuditoriaRepository _repo;

    public AuditoriaService(IAuditoriaRepository repo) => _repo = repo;

    public Task<List<AuditoriaCambio>> GetPorRegistroAsync(string tabla, int registroId)
        => _repo.GetPorRegistroAsync(tabla, registroId);
}
