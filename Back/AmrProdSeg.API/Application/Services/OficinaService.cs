using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class OficinaService : IOficinaService
{
    private readonly IOficinaRepository _repo;
    public OficinaService(IOficinaRepository repo) => _repo = repo;

    public Task<int> CrearAsync(CrearOficinaDto dto) => _repo.InsertarAsync(dto.Nombre.Trim());
    public Task<List<Oficina>> GetAllAsync() => _repo.GetAllAsync();

    public async Task EliminarAsync(int id)
    {
        if (await _repo.EliminarAsync(id) == 0)
            throw new NotFoundException("Oficina no encontrada.");
    }

    public Task CompartirClienteAsync(int clienteId, int oficinaId)
        => _repo.CompartirClienteAsync(clienteId, oficinaId);

    public Task DescompartirClienteAsync(int clienteId, int oficinaId)
        => _repo.DescompartirClienteAsync(clienteId, oficinaId);

    public Task<List<Oficina>> GetOficinasDeClienteAsync(int clienteId)
        => _repo.GetOficinasDeClienteAsync(clienteId);
}
