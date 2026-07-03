using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class MovimientoService : IMovimientoService
{
    private readonly IMovimientoRepository _repo;
    public MovimientoService(IMovimientoRepository repo) => _repo = repo;

    public Task<int> CrearAsync(int usuarioId, CrearMovimientoDto dto)
    {
        var tipo = (dto.Tipo ?? "").Trim().ToLowerInvariant();
        if (tipo != "ingreso" && tipo != "egreso")
            throw new BusinessException("El tipo debe ser 'ingreso' o 'egreso'.");
        if (dto.Monto <= 0)
            throw new BusinessException("El monto debe ser mayor a 0.");

        return _repo.InsertarAsync(new Movimiento
        {
            UsuarioId   = usuarioId,
            Tipo        = tipo,
            Monto       = dto.Monto,
            Categoria   = string.IsNullOrWhiteSpace(dto.Categoria) ? null : dto.Categoria.Trim(),
            Descripcion = string.IsNullOrWhiteSpace(dto.Descripcion) ? null : dto.Descripcion.Trim(),
            Fecha       = dto.Fecha == default ? DateTime.UtcNow.Date : dto.Fecha,
        });
    }

    public Task<List<Movimiento>> GetPorUsuarioAsync(int usuarioId, DateTime? desde, DateTime? hasta)
        => _repo.GetPorUsuarioAsync(usuarioId, desde, hasta);

    public async Task EliminarAsync(int id, int usuarioId)
    {
        if (await _repo.EliminarAsync(id, usuarioId) == 0)
            throw new NotFoundException("Movimiento no encontrado.");
    }
}
