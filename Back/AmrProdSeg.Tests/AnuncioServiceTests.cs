using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Services;

namespace AmrProdSeg.Tests;

public class AnuncioServiceTests
{
    private static (AnuncioService Service, FakeAnuncioRepository Repo, FakeNotificacionPusher Pusher, FakeAuditoriaMovimientoService Auditoria) Crear()
    {
        var repo = new FakeAnuncioRepository();
        var pusher = new FakeNotificacionPusher();
        var auditoria = new FakeAuditoriaMovimientoService();
        return (new AnuncioService(repo, pusher, auditoria), repo, pusher, auditoria);
    }

    [Fact]
    public async Task CrearAsync_Ok_LimpiaYNotifica()
    {
        var (svc, repo, pusher, auditoria) = Crear();

        await svc.CrearAsync(7, new CrearAnuncioDto
        {
            Titulo = "  Hola  ",
            Subtitulo = "  Resumen  ",
            Texto = "  Línea 1\n\nLínea 2  ",
        });

        Assert.Equal(1, repo.InsertarLlamadas);
        Assert.Equal("Hola", repo.UltimoTitulo);
        Assert.Equal("Resumen", repo.UltimoSubtitulo);
        Assert.Equal("Línea 1\n\nLínea 2", repo.UltimoTexto);
        Assert.Equal(7, repo.UltimoPublicadoPor);
        Assert.Contains("notificaciones", pusher.Tipos);

        var r = Assert.Single(auditoria.Registros);
        Assert.Equal("Anuncio", r.entidad);
        Assert.Equal("Publicar", r.accion);
        Assert.Equal(7, r.usuarioId);
    }

    [Fact]
    public async Task CrearAsync_TituloVacio_LanzaBusinessException()
    {
        var (svc, repo, _, _) = Crear();

        await Assert.ThrowsAsync<BusinessException>(() => svc.CrearAsync(7, new CrearAnuncioDto
        {
            Titulo = "   ",
            Texto = "Texto",
        }));

        Assert.Equal(0, repo.InsertarLlamadas);
    }

    [Fact]
    public async Task CrearAsync_TextoMuyLargo_LanzaBusinessException()
    {
        var (svc, repo, _, _) = Crear();

        await Assert.ThrowsAsync<BusinessException>(() => svc.CrearAsync(7, new CrearAnuncioDto
        {
            Titulo = "Título",
            Texto = new string('x', 5001),
        }));

        Assert.Equal(0, repo.InsertarLlamadas);
    }

    [Fact]
    public async Task EliminarAsync_Inexistente_LanzaNotFound()
    {
        var (svc, repo, pusher, _) = Crear();
        repo.EliminarResultado = 0;

        await Assert.ThrowsAsync<NotFoundException>(() => svc.EliminarAsync(99, 7));

        Assert.Empty(pusher.Tipos);
    }

    [Fact]
    public async Task EliminarAsync_Ok_NotificaYAudita()
    {
        var (svc, repo, pusher, auditoria) = Crear();

        await svc.EliminarAsync(5, 7);

        Assert.Equal(1, repo.EliminarLlamadas);
        Assert.Equal(5, repo.UltimoEliminado);
        Assert.Contains("notificaciones", pusher.Tipos);
        var r = Assert.Single(auditoria.Registros);
        Assert.Equal("Eliminar", r.accion);
        Assert.Equal(7, r.usuarioId);
    }
}
