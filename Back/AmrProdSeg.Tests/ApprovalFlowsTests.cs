using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Services;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;

namespace AmrProdSeg.Tests;

public class BajaServiceTests
{
    private static BajaService Crear(FakeBajaRepository baja, Poliza? poliza)
        => new(baja, new FakePolizaRepository { PolizaPorId = poliza });

    private static SolicitarBajaDto Dto() => new() { PolizaId = 1, Motivo = "no paga", Observaciones = null };

    [Fact]
    public async Task Solicitar_PolizaInexistente_NotFound()
    {
        var svc = Crear(new FakeBajaRepository(), poliza: null);
        await Assert.ThrowsAsync<NotFoundException>(() => svc.SolicitarAsync(Dto(), 2));
    }

    [Fact]
    public async Task Solicitar_PolizaYaCancelada_BusinessException()
    {
        var svc = Crear(new FakeBajaRepository(), new Poliza { Id = 1, Estado = EstadoPoliza.Cancelada });
        await Assert.ThrowsAsync<BusinessException>(() => svc.SolicitarAsync(Dto(), 2));
    }

    [Fact]
    public async Task Solicitar_Duplicada_BusinessException()
    {
        var svc = Crear(new FakeBajaRepository { SolicitarResultado = 0 }, new Poliza { Id = 1, Estado = EstadoPoliza.Activa });
        await Assert.ThrowsAsync<BusinessException>(() => svc.SolicitarAsync(Dto(), 2));
    }

    [Fact]
    public async Task Solicitar_Ok_DevuelveId()
    {
        var svc = Crear(new FakeBajaRepository { SolicitarResultado = 5 }, new Poliza { Id = 1, Estado = EstadoPoliza.Activa });
        Assert.Equal(5, await svc.SolicitarAsync(Dto(), 2));
    }

    [Fact]
    public async Task Aprobar_NoExiste_NotFound()
    {
        var svc = Crear(new FakeBajaRepository { AprobarResultado = false }, null);
        await Assert.ThrowsAsync<NotFoundException>(() => svc.AprobarAsync(1, 9));
    }
}

public class AnulacionServiceTests
{
    [Fact]
    public async Task Admin_AnulaDirecto_Ok()
    {
        var svc = new AnulacionService(new FakeAnulacionRepository { AnularDirectoResultado = 1 });
        var r = await svc.AnularOSolicitarAsync(1, 9, esAdmin: true, "x");
        Assert.True(r.Anulada);
    }

    [Fact]
    public async Task Admin_CuotaNoPagada_BusinessException()
    {
        var svc = new AnulacionService(new FakeAnulacionRepository { AnularDirectoResultado = 0 });
        await Assert.ThrowsAsync<BusinessException>(() => svc.AnularOSolicitarAsync(1, 9, esAdmin: true, "x"));
    }

    [Fact]
    public async Task Productor_Solicita_Ok()
    {
        var svc = new AnulacionService(new FakeAnulacionRepository { SolicitarResultado = 3 });
        var r = await svc.AnularOSolicitarAsync(1, 2, esAdmin: false, "x");
        Assert.True(r.Solicitada);
    }

    [Fact]
    public async Task Productor_SolicitudDuplicada_BusinessException()
    {
        var svc = new AnulacionService(new FakeAnulacionRepository { SolicitarResultado = 0 });
        await Assert.ThrowsAsync<BusinessException>(() => svc.AnularOSolicitarAsync(1, 2, esAdmin: false, "x"));
    }

    [Fact]
    public async Task Aprobar_NoExiste_BusinessException()
    {
        var svc = new AnulacionService(new FakeAnulacionRepository { AprobarResultado = 0 });
        await Assert.ThrowsAsync<BusinessException>(() => svc.AprobarAsync(1, 9));
    }
}

public class EliminacionServiceTests
{
    [Fact]
    public async Task PolizaInexistente_NotFound()
    {
        var svc = new EliminacionService(new FakeEliminacionRepository { SolicitarResultado = (0, false) });
        await Assert.ThrowsAsync<NotFoundException>(() => svc.EliminarOSolicitarAsync(1, 2, esAdmin: false, "x"));
    }

    [Fact]
    public async Task Admin_Elimina_EnElActo()
    {
        var svc = new EliminacionService(new FakeEliminacionRepository { SolicitarResultado = (1, false), AprobarResultado = 1 });
        var r = await svc.EliminarOSolicitarAsync(1, 9, esAdmin: true, "x");
        Assert.True(r.Eliminada);
    }

    [Fact]
    public async Task Admin_NoSePudoEliminar_BusinessException()
    {
        var svc = new EliminacionService(new FakeEliminacionRepository { SolicitarResultado = (1, false), AprobarResultado = 0 });
        await Assert.ThrowsAsync<BusinessException>(() => svc.EliminarOSolicitarAsync(1, 9, esAdmin: true, "x"));
    }

    [Fact]
    public async Task Productor_Solicita_Ok()
    {
        var svc = new EliminacionService(new FakeEliminacionRepository { SolicitarResultado = (1, false) });
        var r = await svc.EliminarOSolicitarAsync(1, 2, esAdmin: false, "x");
        Assert.True(r.Solicitada);
    }

    [Fact]
    public async Task Productor_SolicitudDuplicada_BusinessException()
    {
        var svc = new EliminacionService(new FakeEliminacionRepository { SolicitarResultado = (1, true) });
        await Assert.ThrowsAsync<BusinessException>(() => svc.EliminarOSolicitarAsync(1, 2, esAdmin: false, "x"));
    }

    [Fact]
    public async Task Restaurar_NoEnPapelera_BusinessException()
    {
        var svc = new EliminacionService(new FakeEliminacionRepository { RestaurarResultado = 0 });
        await Assert.ThrowsAsync<BusinessException>(() => svc.RestaurarAsync(1, 9));
    }
}
