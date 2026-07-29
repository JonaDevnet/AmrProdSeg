using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Services;
using AmrProdSeg.API.Domain;

namespace AmrProdSeg.Tests;

public class ExportacionServiceTests
{
    private static (ExportacionService svc, FakeAvisoRepository aviso) Crear(Poliza? poliza)
    {
        var aviso = new FakeAvisoRepository();
        var svc = new ExportacionService(
            new FakePolizaRepository { PolizaPorId = poliza },
            new FakeClienteRepository(),
            new FakeVehiculoRepository(),
            new FakeCompaniaRepository(),
            new FakePdfService(),
            aviso);
        return (svc, aviso);
    }

    [Fact]
    public async Task Exportar_PolizaInexistente_NotFound()
    {
        var (svc, _) = Crear(poliza: null);
        await Assert.ThrowsAsync<NotFoundException>(() => svc.ExportarPolizaAsync(1, 7));
    }

    [Fact]
    public async Task Exportar_Ok_GeneraPdf_YRegistraAviso()
    {
        var (svc, aviso) = Crear(new Poliza { Id = 30, Numero = "E/T-9", ClienteId = 1, CompaniaId = 1 });

        var pdf = await svc.ExportarPolizaAsync(30, usuarioId: 7);

        Assert.NotNull(pdf);                       // devolvió un PDF
        Assert.Equal(1, aviso.InsertarLlamado);    // registró el aviso para los admins
        Assert.Equal("E/T-9", aviso.UltimoPolizaNumero);
        Assert.Equal(7, aviso.UltimoUsuarioId);
    }

    [Fact]
    public async Task Recientes_DevuelveLaListaDelRepo()
    {
        var (svc, aviso) = Crear(poliza: null);
        aviso.Recientes.Add(new AvisoExportacionDto { Id = 1, PolizaNumero = "E/T-9", UsuarioNombre = "Admin" });

        var lista = await svc.RecientesAsync(20);

        Assert.Single(lista);
        Assert.Equal("E/T-9", lista[0].PolizaNumero);
    }
}
