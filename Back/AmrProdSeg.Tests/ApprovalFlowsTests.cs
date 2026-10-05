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
    private static (EliminacionService svc, FakeEliminacionRepository repo, FakeAuditoriaMovimientoService auditoria) Crear()
    {
        var repo = new FakeEliminacionRepository();
        var auditoria = new FakeAuditoriaMovimientoService();
        return (new EliminacionService(repo, auditoria), repo, auditoria);
    }

    [Fact]
    public async Task PolizaInexistente_NotFound()
    {
        var (svc, repo, _) = Crear();
        repo.SolicitarResultado = (0, false);
        await Assert.ThrowsAsync<NotFoundException>(() => svc.EliminarOSolicitarAsync(1, 2, esAdmin: false, "x"));
    }

    [Fact]
    public async Task Admin_Elimina_EnElActo()
    {
        var (svc, repo, _) = Crear();
        var r = await svc.EliminarOSolicitarAsync(1, 9, esAdmin: true, "x");
        Assert.True(r.Eliminada);
    }

    [Fact]
    public async Task Admin_NoSePudoEliminar_BusinessException()
    {
        var (svc, repo, _) = Crear();
        repo.AprobarResultado = 0;
        await Assert.ThrowsAsync<BusinessException>(() => svc.EliminarOSolicitarAsync(1, 9, esAdmin: true, "x"));
    }

    [Fact]
    public async Task Productor_Solicita_Ok()
    {
        var (svc, _, _) = Crear();
        var r = await svc.EliminarOSolicitarAsync(1, 2, esAdmin: false, "x");
        Assert.True(r.Solicitada);
    }

    [Fact]
    public async Task Productor_SolicitudDuplicada_BusinessException()
    {
        var (svc, repo, _) = Crear();
        repo.SolicitarResultado = (1, true);
        await Assert.ThrowsAsync<BusinessException>(() => svc.EliminarOSolicitarAsync(1, 2, esAdmin: false, "x"));
    }

    [Fact]
    public async Task Restaurar_NoEnPapelera_BusinessException()
    {
        var (svc, repo, _) = Crear();
        repo.RestaurarResultado = 0;
        await Assert.ThrowsAsync<BusinessException>(() => svc.RestaurarAsync(1, 9));
    }

    [Fact]
    public async Task Admin_Elimina_RegistraAuditoria()
    {
        var (svc, repo, auditoria) = Crear();
        repo.PorId = new EliminacionPoliza { PolizaId = 9, PolizaNumero = "P-9", ClienteNombre = "Cliente X", Patente = "AB123CD" };

        await svc.EliminarOSolicitarAsync(9, 7, esAdmin: true, "x");

        var r = Assert.Single(auditoria.Registros);
        Assert.Equal("Poliza", r.entidad);
        Assert.Equal(9, r.registroId);
        Assert.Equal("Eliminar", r.accion);
        Assert.Contains("P-9", r.detalle);
    }

    [Fact]
    public async Task Aprobar_Solicitud_RegistraAuditoria()
    {
        var (svc, repo, auditoria) = Crear();
        repo.PorId = new EliminacionPoliza { PolizaId = 9, PolizaNumero = "P-9" };

        await svc.AprobarAsync(5, 9);

        var r = Assert.Single(auditoria.Registros);
        Assert.Equal("Poliza", r.entidad);
        Assert.Equal(9, r.registroId);
        Assert.Equal("Eliminar", r.accion);
    }

    [Fact]
    public async Task Restaurar_RegistraAuditoria()
    {
        var (svc, repo, auditoria) = Crear();
        repo.PorPoliza = new EliminacionPoliza { PolizaId = 9, PolizaNumero = "P-9" };

        await svc.RestaurarAsync(9, 9);

        var r = Assert.Single(auditoria.Registros);
        Assert.Equal("Restaurar", r.accion);
        Assert.Equal(9, r.registroId);
    }

    [Fact]
    public async Task BorrarDefinitivo_RegistraAuditoria()
    {
        var (svc, repo, auditoria) = Crear();
        repo.PorPoliza = new EliminacionPoliza { PolizaId = 9, PolizaNumero = "P-9" };

        await svc.BorrarDefinitivoAsync(9, 9);

        var r = Assert.Single(auditoria.Registros);
        Assert.Equal("BorrarDefinitivo", r.accion);
        Assert.Equal(9, r.registroId);
    }
}
