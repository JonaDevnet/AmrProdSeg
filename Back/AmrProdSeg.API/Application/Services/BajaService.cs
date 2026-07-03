using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class BajaService : IBajaService
{
    private readonly IBajaRepository _repo;
    private readonly IPolizaRepository _polizaRepo;

    public BajaService(IBajaRepository repo, IPolizaRepository polizaRepo)
    {
        _repo = repo;
        _polizaRepo = polizaRepo;
    }

    public async Task<int> SolicitarAsync(SolicitarBajaDto dto, int usuarioId)
    {
        var poliza = await _polizaRepo.GetByIdAsync(dto.PolizaId)
            ?? throw new NotFoundException("Póliza no encontrada.");
        if (poliza.Estado == Domain.Enums.EstadoPoliza.Cancelada)
            throw new BusinessException("La póliza ya está cancelada.");

        var id = await _repo.SolicitarAsync(dto.PolizaId, dto.Motivo.Trim(), dto.Observaciones, usuarioId);
        if (id == 0)
            throw new BusinessException("Esa póliza ya tiene una solicitud de baja pendiente.");
        return id;
    }

    public Task<List<Baja>> GetAllAsync(int? estado) => _repo.GetAllAsync(estado);

    public async Task AprobarAsync(int id, int adminId)
    {
        if (!await _repo.AprobarAsync(id, adminId))
            throw new NotFoundException("La solicitud no existe o ya fue procesada.");
    }

    public async Task RechazarAsync(int id, int adminId)
    {
        if (!await _repo.RechazarAsync(id, adminId))
            throw new NotFoundException("La solicitud no existe o ya fue procesada.");
    }
}
