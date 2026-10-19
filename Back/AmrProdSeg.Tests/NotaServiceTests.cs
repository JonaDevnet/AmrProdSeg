using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Services;
using AmrProdSeg.API.Domain;

namespace AmrProdSeg.Tests;

public class NotaServiceTests
{
    [Fact]
    public async Task CrearAsync_TextoVacio_LanzaBusinessException()
    {
        var repo = new FakeNotaRepository();
        var svc = new NotaService(repo);

        await Assert.ThrowsAsync<BusinessException>(() => svc.CrearAsync(7, new CrearNotaDto { Texto = "   " }));
        Assert.Equal(0, repo.InsertarLlamadas);
    }

    [Fact]
    public async Task CrearAsync_GuardaTextoRecortadoYUsuario()
    {
        var repo = new FakeNotaRepository();
        var svc = new NotaService(repo);

        await svc.CrearAsync(7, new CrearNotaDto { Texto = "  Avisar del cambio  " });

        Assert.Equal(1, repo.InsertarLlamadas);
        Assert.Equal(7, repo.UltimoUsuarioId);
        Assert.Equal("Avisar del cambio", repo.UltimoTexto);
    }

    [Fact]
    public async Task EliminarAsync_NotaAjenaONoExiste_LanzaNotFound()
    {
        var repo = new FakeNotaRepository { EliminarResultado = 0 };
        var svc = new NotaService(repo);

        await Assert.ThrowsAsync<NotFoundException>(() => svc.EliminarAsync(99, 7));
    }

    [Fact]
    public async Task GetAsync_MapeaFechaComoUtc()
    {
        var repo = new FakeNotaRepository
        {
            Notas =
            {
                new Nota { Id = 1, Texto = "Nota", FechaCreacion = new DateTime(2026, 10, 19, 12, 0, 0, DateTimeKind.Unspecified) }
            }
        };
        var svc = new NotaService(repo);

        var notas = await svc.GetAsync(7);

        var nota = Assert.Single(notas);
        Assert.Equal(DateTimeKind.Utc, nota.FechaCreacion.Kind);
    }
}
