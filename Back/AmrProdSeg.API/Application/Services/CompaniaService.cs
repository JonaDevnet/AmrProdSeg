using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class CompaniaService : ICompaniaService
{
    private readonly ICompaniaRepository _companiaRepo;

    public CompaniaService(ICompaniaRepository companiaRepo) => _companiaRepo = companiaRepo;

    public Task<int> CrearAsync(CrearCompaniaDto dto)
    {
        var compania = new Compania
        {
            Nombre   = dto.Nombre,
            CUIT     = dto.CUIT,
            Telefono = dto.Telefono,
            LogoUrl  = dto.LogoUrl,
            Color    = dto.Color
        };
        return _companiaRepo.InsertarAsync(compania);
    }

    public Task<List<Compania>> GetAllAsync() => _companiaRepo.GetAllAsync();

    public async Task EliminarAsync(int id)
    {
        if (await _companiaRepo.EliminarAsync(id) == 0)
            throw new Exceptions.NotFoundException("Compañía no encontrada.");
    }
}
