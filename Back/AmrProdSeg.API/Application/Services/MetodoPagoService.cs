using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class MetodoPagoService : IMetodoPagoService
{
    private readonly IMetodoPagoRepository _repo;

    public MetodoPagoService(IMetodoPagoRepository repo) => _repo = repo;

    public Task<int> CrearAsync(CrearMetodoPagoDto dto) => _repo.InsertarAsync(dto.Nombre);

    public Task<List<MetodoPago>> GetAllAsync() => _repo.GetAllAsync();

    public async Task EliminarAsync(int id)
    {
        var metodo = (await _repo.GetAllAsync()).FirstOrDefault(m => m.Id == id);
        if (metodo != null && EsFijo(metodo.Nombre))
            throw new Exceptions.BusinessException("Efectivo y Transferencia son métodos fijos: no se pueden eliminar ni modificar.");
        if (await _repo.EliminarAsync(id) == 0)
            throw new Exceptions.NotFoundException("Método de pago no encontrado.");
    }

    /// <summary>Efectivo y Transferencia son fijos (base de la rendición). El resto es "otros medios".</summary>
    public static bool EsFijo(string nombre)
    {
        var s = (nombre ?? string.Empty).ToLowerInvariant();
        return s.Contains("efectivo") || s.Contains("transferencia");
    }
}
