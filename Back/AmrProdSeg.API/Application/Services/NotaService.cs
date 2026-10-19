using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class NotaService : INotaService
{
    private readonly INotaRepository _repo;

    public NotaService(INotaRepository repo) => _repo = repo;

    public async Task<int> CrearAsync(int usuarioId, CrearNotaDto dto)
    {
        var texto = (dto.Texto ?? string.Empty).Trim();
        if (texto.Length == 0)
            throw new BusinessException("Escribí una nota.");
        if (texto.Length > 1000)
            throw new BusinessException("La nota no puede superar los 1000 caracteres.");

        return await _repo.InsertarAsync(usuarioId, texto);
    }

    public async Task<List<NotaDto>> GetAsync(int usuarioId)
    {
        var notas = await _repo.GetPorUsuarioAsync(usuarioId);
        return notas.Select(n => new NotaDto
        {
            Id = n.Id,
            Texto = n.Texto,
            // La BD guarda GETUTCDATE(): se marca UTC para que el navegador muestre hora local.
            FechaCreacion = DateTime.SpecifyKind(n.FechaCreacion, DateTimeKind.Utc)
        }).ToList();
    }

    public async Task EliminarAsync(int id, int usuarioId)
    {
        if (await _repo.EliminarAsync(id, usuarioId) == 0)
            throw new NotFoundException("Nota no encontrada.");
    }
}
