using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class RamoService : IRamoService
{
    private readonly IRamoRepository _repo;

    public RamoService(IRamoRepository repo) => _repo = repo;

    public Task<int> CrearAsync(CrearRamoDto dto) => _repo.InsertarAsync(dto.Nombre.Trim());

    public Task<List<Ramo>> GetAllAsync() => _repo.GetAllAsync();

    public async Task EliminarAsync(int id)
    {
        if (await _repo.EliminarAsync(id) == 0)
            throw new Exceptions.NotFoundException("Ramo no encontrado.");
    }
}
