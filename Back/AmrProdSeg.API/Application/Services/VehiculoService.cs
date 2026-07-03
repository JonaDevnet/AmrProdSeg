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
        var vehiculo = new Vehiculo
        {
            Id            = id,
            Marca         = dto.Marca,
            Modelo        = dto.Modelo,
            Anio          = dto.Anio,
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
