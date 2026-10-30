using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class VehiculoService : IVehiculoService
{
    private readonly IVehiculoRepository _vehiculoRepo;

    public VehiculoService(IVehiculoRepository vehiculoRepo) => _vehiculoRepo = vehiculoRepo;

    public async Task<int> CrearAsync(CrearVehiculoDto dto)
    {
        var existente = await _vehiculoRepo.GetByPatenteAsync(dto.Patente);
        if (existente != null)
            throw new BusinessException($"Ya existe un vehículo con la patente {dto.Patente}.");

        var vehiculo = new Vehiculo
        {
            ClienteId     = dto.ClienteId,
            Marca         = dto.Marca,
            Modelo        = dto.Modelo,
            Anio          = dto.Anio,
            Patente       = dto.Patente,
            Chasis        = dto.Chasis,
            Motor         = dto.Motor,
            TipoCobertura = dto.TipoCobertura,
            Combustion    = dto.Combustion
        };
        return await _vehiculoRepo.InsertarAsync(vehiculo);
    }

    public async Task ActualizarAsync(int id, ActualizarVehiculoDto dto)
    {
        // Patente opcional: si viene, se normaliza y se valida que no esté en uso por otro vehículo.
        string? patente = string.IsNullOrWhiteSpace(dto.Patente)
            ? null
            : dto.Patente.Trim().ToUpperInvariant();

        if (patente is not null)
        {
            var existente = await _vehiculoRepo.GetByPatenteAsync(patente);
            if (existente is not null && existente.Id != id)
                throw new BusinessException($"Ya existe un vehículo con la patente {patente}.");
        }

        var vehiculo = new Vehiculo
        {
            Id            = id,
            Marca         = dto.Marca,
            Modelo        = dto.Modelo,
            Anio          = dto.Anio,
            Patente       = patente ?? string.Empty,   // vacío = no se modifica (COALESCE en el SP)
            Chasis        = dto.Chasis,
            Motor         = dto.Motor,
            TipoCobertura = dto.TipoCobertura,
            Combustion    = dto.Combustion
        };
        await _vehiculoRepo.ActualizarAsync(vehiculo);
    }

    public Task<List<Vehiculo>> GetPorClienteAsync(int clienteId)
        => _vehiculoRepo.GetPorClienteAsync(clienteId);

    public Task<Vehiculo?> GetByPatenteAsync(string patente)
        => _vehiculoRepo.GetByPatenteAsync(patente);
}
