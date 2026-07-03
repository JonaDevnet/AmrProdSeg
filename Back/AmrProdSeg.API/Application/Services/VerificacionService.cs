using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain.Enums;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class VerificacionService : IVerificacionService
{
    private readonly IPolizaRepository _polizaRepo;
    private readonly IClienteRepository _clienteRepo;
    private readonly IVehiculoRepository _vehiculoRepo;
    private readonly ICompaniaRepository _companiaRepo;
    private readonly ICobroRepository _cobroRepo;

    public VerificacionService(
        IPolizaRepository polizaRepo, IClienteRepository clienteRepo,
        IVehiculoRepository vehiculoRepo, ICompaniaRepository companiaRepo, ICobroRepository cobroRepo)
    {
        _polizaRepo = polizaRepo;
        _clienteRepo = clienteRepo;
        _vehiculoRepo = vehiculoRepo;
        _companiaRepo = companiaRepo;
        _cobroRepo = cobroRepo;
    }

    public async Task<VerificacionDto?> GetAsync(Guid token)
    {
        var poliza = await _polizaRepo.GetByTokenAsync(token);
        if (poliza is null) return null;

        var cliente = await _clienteRepo.GetByIdAsync(poliza.ClienteId);
        var compania = await _companiaRepo.GetByIdAsync(poliza.CompaniaId);
        var vehiculos = await _vehiculoRepo.GetPorClienteAsync(poliza.ClienteId);
        var veh = vehiculos.FirstOrDefault(v => v.Id == poliza.VehiculoId);

        // Próximo vencimiento = vencimiento de la última cuota pagada (cobertura vigente hasta ahí);
        // si no hay pagas, el de la primera cuota.
        var cuotas = await _cobroRepo.GetPorPolizaAsync(poliza.Id);
        var ultimaPagada = cuotas.Where(c => c.Estado == EstadoCobro.Pagado).OrderBy(c => c.NumeroCuota).LastOrDefault();
        var proxVenc = ultimaPagada?.FechaVencimiento
                       ?? cuotas.OrderBy(c => c.NumeroCuota).FirstOrDefault()?.FechaVencimiento
                       ?? poliza.FechaFin;

        return new VerificacionDto
        {
            ClienteNombre = cliente?.Nombre ?? "—",
            Documento = EnmascararDni(cliente?.Documento),   // no exponemos el DNI completo
            // Domicilio: NO se expone (dato sensible innecesario para verificar la póliza).
            Compania = compania?.Nombre ?? "—",
            NroPoliza = poliza.Numero,
            Marca = veh?.Marca ?? "—",
            Modelo = veh?.Modelo ?? "",
            Patente = veh?.Patente ?? "—",
            Anio = veh is null || veh.Anio == 0 ? "" : veh.Anio.ToString(),
            Cobertura = poliza.Cobertura ?? veh?.TipoCobertura ?? "—",
            Vigente = poliza.Estado == EstadoPoliza.Activa,
            ProximoVencimiento = proxVenc,
        };
    }

    /// <summary>Enmascara el DNI dejando visibles los primeros 2 y últimos 3 dígitos (ej. 12***032).</summary>
    private static string EnmascararDni(string? doc)
    {
        var d = (doc ?? "").Trim();
        if (d.Length == 0) return "—";
        if (d.Length <= 5) return new string('*', d.Length);
        return $"{d[..2]}***{d[^3..]}";
    }
}
