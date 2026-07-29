using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Services;
using AmrProdSeg.API.Domain;

namespace AmrProdSeg.Tests;

public class AltaServiceTests
{
    private static (AltaService svc, FakeAltaRepository alta) Crear(
        Vehiculo? porPatente = null, Poliza? activaPorVehiculo = null, Compania? compania = null)
    {
        var alta = new FakeAltaRepository();
        var svc = new AltaService(
            alta,
            new FakeClienteRepository(),
            new FakeVehiculoRepository { PorPatente = porPatente },
            new FakePolizaRepository { PolizaActivaPorVehiculo = activaPorVehiculo, PolizaPorId = new Poliza { Id = 30, Numero = "E/T-001" } },
            new FakeCompaniaRepository { PorId = compania },
            new FakePdfService());
        return (svc, alta);
    }

    private static AltaAseguradoDto Dto() => new()
    {
        ClienteNombre = "juan perez", Documento = "30111222", Email = "Juan@Mail.com",
        CompaniaId = 1, FechaInicio = DateTime.Today, FechaFin = DateTime.Today.AddMonths(3),
        PrecioTotal = 90000, CantidadCuotas = 3,
        Patente = "ab123cd", Marca = "toyota", Modelo = "corolla", Anio = 2021,
    };

    [Fact]
    public async Task Registrar_VehiculoConPolizaVigente_LanzaBusinessException()
    {
        var (svc, alta) = Crear(
            porPatente: new Vehiculo { Id = 5, Patente = "AB123CD" },
            activaPorVehiculo: new Poliza { Id = 9, Numero = "P-9" },
            compania: new Compania { Id = 1 });

        await Assert.ThrowsAsync<BusinessException>(() => svc.RegistrarAsync(Dto()));
        Assert.Null(alta.ClienteRecibido); // no llegó a crear
    }

    [Fact]
    public async Task Registrar_CompaniaInexistente_LanzaBusinessException()
    {
        var dto = Dto();
        dto.Patente = null; // sin vehículo → llega al chequeo de compañía
        var (svc, _) = Crear(compania: null);

        await Assert.ThrowsAsync<BusinessException>(() => svc.RegistrarAsync(dto));
    }

    [Fact]
    public async Task Registrar_Ok_NormalizaAMayusculas_PeroNoElEmail()
    {
        var (svc, alta) = Crear(compania: new Compania { Id = 1 });

        await svc.RegistrarAsync(Dto());

        Assert.Equal("JUAN PEREZ", alta.ClienteRecibido!.Nombre);
        Assert.Equal("Juan@Mail.com", alta.ClienteRecibido!.Email);   // el email NO se pasa a mayúsculas
        Assert.Equal("AB123CD", alta.VehiculoRecibido!.Patente);
        Assert.Equal("TOYOTA", alta.VehiculoRecibido!.Marca);
    }

    [Fact]
    public async Task Registrar_GeneraLasCuotasSegunCantidad()
    {
        var (svc, alta) = Crear(compania: new Compania { Id = 1 });

        await svc.RegistrarAsync(Dto());

        Assert.Equal(3, alta.CuotasGeneradas);
    }

    [Fact]
    public async Task Registrar_ReutilizaVehiculoExistente_SinPolizaVigente()
    {
        var (svc, alta) = Crear(
            porPatente: new Vehiculo { Id = 55, Patente = "AB123CD" },
            activaPorVehiculo: null,
            compania: new Compania { Id = 1 });

        await svc.RegistrarAsync(Dto());

        Assert.Equal(55, alta.VehiculoRecibido!.Id); // reutiliza el vehículo existente (Id > 0)
    }
}
