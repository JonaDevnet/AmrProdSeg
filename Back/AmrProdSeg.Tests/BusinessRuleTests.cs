using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Services;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;
using Microsoft.Extensions.Configuration;

namespace AmrProdSeg.Tests;

public class CobroServiceTests
{
    private static CobroService Crear(FakeCobroRepository repo) => new(
        repo, new FakePolizaRepository(), new FakeClienteRepository(), new FakeCompaniaRepository(),
        new FakeVehiculoRepository(), new FakeMetodoPagoRepository(), new FakePdfService(),
        new ConfigurationBuilder().Build(), new FakeEmailSender(), new FakeWhatsAppSender());

    [Fact]
    public async Task PagarAsync_CuotaYaPagada_LanzaBusinessException()
    {
        var repo = new FakeCobroRepository { CobroPorId = new Cobro { Id = 1, Estado = EstadoCobro.Pagado } };
        var service = Crear(repo);

        await Assert.ThrowsAsync<BusinessException>(
            () => service.PagarAsync(1, DateTime.UtcNow, 2));
        Assert.Equal(0, repo.MarcarPagadoLlamadas);
    }

    [Fact]
    public async Task PagarAsync_CuotaInexistente_LanzaNotFound()
    {
        var repo = new FakeCobroRepository { CobroPorId = null };
        var service = Crear(repo);

        await Assert.ThrowsAsync<NotFoundException>(
            () => service.PagarAsync(99, DateTime.UtcNow, 2));
    }

    [Fact]
    public async Task PagarAsync_SinMetodoDePago_LanzaBusinessException()
    {
        var repo = new FakeCobroRepository { CobroPorId = new Cobro { Id = 1, Estado = EstadoCobro.Pendiente } };
        var service = Crear(repo);

        await Assert.ThrowsAsync<BusinessException>(
            () => service.PagarAsync(1, DateTime.UtcNow, null));
        Assert.Equal(0, repo.MarcarPagadoLlamadas);
    }

    [Fact]
    public async Task PagarAsync_CuotaPendiente_MarcaPagada()
    {
        var repo = new FakeCobroRepository { CobroPorId = new Cobro { Id = 1, Estado = EstadoCobro.Pendiente } };
        var service = Crear(repo);

        await service.PagarAsync(1, DateTime.UtcNow, 2);

        Assert.Equal(1, repo.MarcarPagadoLlamadas);
    }

    [Fact]
    public async Task PagarAsync_ConDosMetodosYMonto_MarcaPagada()
    {
        var repo = new FakeCobroRepository { CobroPorId = new Cobro { Id = 1, Estado = EstadoCobro.Pendiente, Monto = 10000m } };
        var service = Crear(repo);

        await service.PagarAsync(1, DateTime.UtcNow, 1, null, 2, 4000m);

        Assert.Equal(1, repo.MarcarPagadoLlamadas);
    }

    [Fact]
    public async Task PagarAsync_SegundoMetodoSinMonto_LanzaBusinessException()
    {
        var repo = new FakeCobroRepository { CobroPorId = new Cobro { Id = 1, Estado = EstadoCobro.Pendiente, Monto = 10000m } };
        var service = Crear(repo);

        await Assert.ThrowsAsync<BusinessException>(
            () => service.PagarAsync(1, DateTime.UtcNow, 1, null, 2));
        Assert.Equal(0, repo.MarcarPagadoLlamadas);
    }
}

public class PolizaServiceTests
{
    private static PolizaService Crear(FakePolizaRepository polizaRepo)
        => new(polizaRepo, new FakeCobroRepository(), new FakeCompaniaRepository(), new FakeVehiculoRepository(), new FakePdfService());

    [Theory]
    [InlineData(EstadoPoliza.Cancelada)]
    [InlineData(EstadoPoliza.Renovada)]
    public async Task RenovarAsync_EstadoNoRenovable_LanzaBusinessException(EstadoPoliza estado)
    {
        var repo = new FakePolizaRepository { PolizaPorId = new Poliza { Id = 1, Estado = estado } };
        var service = Crear(repo);

        await Assert.ThrowsAsync<BusinessException>(
            () => service.RenovarAsync(1, NuevaRenovacion()));
        Assert.Equal(0, repo.InsertarLlamadas);
    }

    [Fact]
    public async Task RenovarAsync_PolizaInexistente_LanzaNotFound()
    {
        var repo = new FakePolizaRepository { PolizaPorId = null };
        var service = Crear(repo);

        await Assert.ThrowsAsync<NotFoundException>(
            () => service.RenovarAsync(1, NuevaRenovacion()));
    }

    [Fact]
    public async Task RenovarAsync_PolizaActiva_CreaNuevaYMarcaOrigenRenovada()
    {
        var repo = new FakePolizaRepository { PolizaPorId = new Poliza { Id = 1, Estado = EstadoPoliza.Activa } };
        var service = Crear(repo);

        var result = await service.RenovarAsync(1, NuevaRenovacion());

        Assert.Equal(99, result.NuevaPolizaId);
        Assert.Equal(EstadoPoliza.Renovada, repo.UltimoEstadoCambiado);
    }

    [Fact]
    public async Task CrearAsync_VehiculoConPolizaActiva_LanzaBusinessException()
    {
        var repo = new FakePolizaRepository { PolizaActivaPorVehiculo = new Poliza { Id = 50 } };
        var service = Crear(repo);

        await Assert.ThrowsAsync<BusinessException>(() => service.CrearAsync(new CrearPolizaDto
        {
            ClienteId = 1, VehiculoId = 1, CompaniaId = 1,
            FechaInicio = DateTime.Today, FechaFin = DateTime.Today.AddYears(1),
            PrecioTotal = 1000, CantidadCuotas = 6
        }));
    }

    private static RenovarPolizaDto NuevaRenovacion() => new()
    {
        FechaInicio = DateTime.Today,
        FechaFin = DateTime.Today.AddYears(1),
        PrecioTotal = 50000,
        CantidadCuotas = 12
    };
}

public class VehiculoServiceTests
{
    [Fact]
    public async Task CrearAsync_PatenteDuplicada_LanzaBusinessException()
    {
        var repo = new FakeVehiculoRepository { PorPatente = new Vehiculo { Id = 1, Patente = "AB123CD" } };
        var service = new VehiculoService(repo);

        await Assert.ThrowsAsync<BusinessException>(() => service.CrearAsync(new CrearVehiculoDto
        {
            ClienteId = 1, Marca = "Toyota", Modelo = "Corolla", Anio = 2021, Patente = "AB123CD"
        }));
        Assert.Equal(0, repo.InsertarLlamadas);
    }

    [Fact]
    public async Task CrearAsync_PatenteNueva_Inserta()
    {
        var repo = new FakeVehiculoRepository { PorPatente = null };
        var service = new VehiculoService(repo);

        var id = await service.CrearAsync(new CrearVehiculoDto
        {
            ClienteId = 1, Marca = "Toyota", Modelo = "Corolla", Anio = 2021, Patente = "ZZ999ZZ"
        });

        Assert.Equal(7, id);
        Assert.Equal(1, repo.InsertarLlamadas);
    }
}

public class ClienteServiceTests
{
    [Fact]
    public async Task CrearAsync_DocumentoDuplicado_LanzaBusinessException()
    {
        var repo = new FakeClienteRepository { PorDocumento = new Cliente { Id = 1, Documento = "30111222" } };
        var service = new ClienteService(repo, new FakeUsuarioRepository());

        await Assert.ThrowsAsync<BusinessException>(() => service.CrearAsync(new CrearClienteDto
        {
            Nombre = "Juan Pérez", Documento = "30111222"
        }));
        Assert.Equal(0, repo.InsertarLlamadas);
    }
}
