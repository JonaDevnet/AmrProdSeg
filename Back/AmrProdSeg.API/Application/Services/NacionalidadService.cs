using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class NacionalidadService : INacionalidadService
{
    private readonly INacionalidadRepository _repo;

    public NacionalidadService(INacionalidadRepository repo) => _repo = repo;

    public Task<int> CrearAsync(CrearNacionalidadDto dto) => _repo.InsertarAsync(dto.Nombre.Trim());

    public Task<List<Nacionalidad>> GetAllAsync() => _repo.GetAllAsync();

    public async Task EliminarAsync(int id)
    {
        if (await _repo.EliminarAsync(id) == 0)
            throw new NotFoundException("Nacionalidad no encontrada.");
    }
}
