using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class EliminacionService : IEliminacionService
{
    private readonly IEliminacionRepository _repo;
    public EliminacionService(IEliminacionRepository repo) => _repo = repo;

    public async Task<EliminarPolizaResultDto> EliminarOSolicitarAsync(int polizaId, int usuarioId, bool esAdmin, string? motivo)
    {
        var (id, yaExistia) = await _repo.SolicitarAsync(polizaId, usuarioId, motivo);
        if (id == 0)
            throw new NotFoundException("La póliza no existe.");

        // Admin: ejecuta el borrado en el acto (aprueba la solicitud recién creada / existente).
        if (esAdmin)
        {
            if (await _repo.AprobarAsync(id, usuarioId) == 0)
                throw new BusinessException("No se pudo eliminar la póliza.");
            return new EliminarPolizaResultDto { Eliminada = true, Mensaje = "Póliza eliminada. Se registró el movimiento." };
        }

        // Productor: queda pendiente de autorización del Admin.
        if (yaExistia)
            throw new BusinessException("Ya existe una solicitud de eliminación pendiente para esta póliza.");
        return new EliminarPolizaResultDto { Solicitada = true, Mensaje = "Solicitud de eliminación enviada. Queda pendiente de autorización del administrador." };
    }

    public Task<List<EliminacionPoliza>> GetPendientesAsync() => _repo.GetPendientesAsync();
    public Task<List<EliminacionPoliza>> GetHistorialAsync() => _repo.GetHistorialAsync();
    public Task<List<EliminacionPoliza>> GetPapeleraAsync() => _repo.GetPapeleraAsync();

    public async Task RestaurarAsync(int polizaId, int adminId)
    {
        if (await _repo.RestaurarAsync(polizaId, adminId) == 0)
            throw new BusinessException("La póliza no está en la papelera.");
    }

    public async Task BorrarDefinitivoAsync(int polizaId, int adminId)
    {
        if (await _repo.BorrarDefinitivoAsync(polizaId, adminId) == 0)
            throw new BusinessException("La póliza no está en la papelera.");
    }

    public async Task AprobarAsync(int id, int adminId)
    {
        if (await _repo.AprobarAsync(id, adminId) == 0)
            throw new BusinessException("La solicitud no existe o ya fue resuelta.");
    }

    public async Task RechazarAsync(int id, int adminId)
    {
        if (await _repo.RechazarAsync(id, adminId) == 0)
            throw new BusinessException("La solicitud no existe o ya fue resuelta.");
    }
}
