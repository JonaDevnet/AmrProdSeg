using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class AnulacionService : IAnulacionService
{
    private readonly IAnulacionRepository _repo;
    public AnulacionService(IAnulacionRepository repo) => _repo = repo;

    public async Task<AnularPagoResultDto> AnularOSolicitarAsync(int cobroId, int usuarioId, bool esAdmin, string? motivo)
    {
        if (esAdmin)
        {
            var afectadas = await _repo.AnularPagoDirectoAsync(cobroId);
            if (afectadas == 0)
                throw new BusinessException("La cuota no está pagada o no existe.");
            return new AnularPagoResultDto { Anulada = true, Mensaje = "Pago anulado: la cuota volvió a estado pendiente." };
        }

        var id = await _repo.SolicitarAsync(cobroId, usuarioId, motivo);
        if (id == 0)
            throw new BusinessException("Ya existe una solicitud de anulación pendiente para esta cuota.");
        return new AnularPagoResultDto { Solicitada = true, Mensaje = "Solicitud de anulación enviada. Queda pendiente de aprobación del administrador." };
    }

    public Task<List<AnulacionCobro>> GetPendientesAsync() => _repo.GetPendientesAsync();
    public Task<List<AnulacionCobro>> GetHistorialAsync() => _repo.GetHistorialAsync();

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
