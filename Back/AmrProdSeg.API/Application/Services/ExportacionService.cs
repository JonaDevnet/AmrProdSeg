using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

/// <summary>
/// Exportación de una póliza (datos del cliente + esa póliza + su vehículo) en PDF,
/// registrando un aviso para que los administradores lo vean en la campanita.
/// </summary>
public class ExportacionService : IExportacionService
{
    private readonly IPolizaRepository _polizaRepo;
    private readonly IClienteRepository _clienteRepo;
    private readonly IVehiculoRepository _vehiculoRepo;
    private readonly ICompaniaRepository _companiaRepo;
    private readonly IPdfService _pdf;
    private readonly IAvisoRepository _avisoRepo;

    public ExportacionService(IPolizaRepository polizaRepo, IClienteRepository clienteRepo,
        IVehiculoRepository vehiculoRepo, ICompaniaRepository companiaRepo, IPdfService pdf, IAvisoRepository avisoRepo)
    {
        _polizaRepo = polizaRepo;
        _clienteRepo = clienteRepo;
        _vehiculoRepo = vehiculoRepo;
        _companiaRepo = companiaRepo;
        _pdf = pdf;
        _avisoRepo = avisoRepo;
    }

    public async Task<byte[]> ExportarPolizaAsync(int polizaId, int? usuarioId)
    {
        var poliza = await _polizaRepo.GetByIdAsync(polizaId)
            ?? throw new NotFoundException("Póliza no encontrada.");
        var cliente = await _clienteRepo.GetByIdAsync(poliza.ClienteId)
            ?? throw new NotFoundException("Cliente no encontrado.");
        var vehiculos = await _vehiculoRepo.GetPorClienteAsync(cliente.Id);
        var veh = vehiculos.FirstOrDefault(v => v.Id == poliza.VehiculoId);
        var compania = await _companiaRepo.GetByIdAsync(poliza.CompaniaId);

        var data = new ClienteDossierData(
            cliente.Nombre, cliente.Documento, cliente.TipoDocumento, cliente.Email, cliente.Telefono,
            cliente.Direccion, cliente.FechaNacimiento, cliente.FechaAlta,
            veh is null
                ? new List<DossierVehiculo>()
                : new List<DossierVehiculo> { new(veh.Patente, veh.Marca, veh.Modelo, veh.Anio, veh.Chasis, veh.Motor, veh.Combustion) },
            new List<DossierPoliza> { new(
                poliza.Numero, poliza.Estado.ToString(), compania?.Nombre ?? "—", poliza.RamoNombre, poliza.Cobertura,
                veh?.Patente, poliza.FechaInicio, poliza.FechaFin, poliza.PrecioTotal, poliza.CantidadCuotas, poliza.FormaPago) });

        var pdf = _pdf.GenerarDossierCliente(data);
        // Aviso para los administradores (campanita).
        await _avisoRepo.InsertarExportacionAsync(usuarioId, poliza.Id, poliza.Numero, cliente.Nombre);
        return pdf;
    }

    public Task<List<AvisoExportacionDto>> RecientesAsync(int top) => _avisoRepo.ListarExportacionesAsync(top);
}
