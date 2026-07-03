using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class CoberturaService : ICoberturaService
{
    private readonly ICoberturaRepository _repo;
    public CoberturaService(ICoberturaRepository repo) => _repo = repo;

    public Task<int> CrearAsync(CrearCoberturaDto dto) => _repo.InsertarAsync(dto.Nombre.Trim());
    public Task<List<Cobertura>> GetAllAsync() => _repo.GetAllAsync();

    public async Task EliminarAsync(int id)
    {
        if (await _repo.EliminarAsync(id) == 0)
            throw new NotFoundException("Cobertura no encontrada.");
    }
}
