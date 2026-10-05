using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Services;
using AmrProdSeg.API.Domain;

namespace AmrProdSeg.Tests;

public class UsuarioServiceTests
{
    private static (UsuarioService svc, FakeUsuarioRepository repo) Crear(Usuario? usuarioPorId)
    {
        var repo = new FakeUsuarioRepository();
        var svc = new UsuarioService(
            repo,
            new FakeAuthRepository { UsuarioPorId = usuarioPorId },
            new FakeResetRepository());
        return (svc, repo);
    }

    [Fact]
    public async Task ActualizarRol_Admin_LanzaBusinessException()
    {
        var (svc, _) = Crear(new Usuario { Id = 1, Rol = "Admin" });

        await Assert.ThrowsAsync<BusinessException>(() => svc.ActualizarRolAsync(1, "Productor"));
    }

    [Fact]
    public async Task ActualizarRol_Productor_Ok()
    {
        var (svc, repo) = Crear(new Usuario { Id = 2, Rol = "Productor" });

        await svc.ActualizarRolAsync(2, "Vendedor");
    }

    [Fact]
    public async Task ActualizarRol_UsuarioInexistente_NotFound()
    {
        var (svc, _) = Crear(null);

        await Assert.ThrowsAsync<NotFoundException>(() => svc.ActualizarRolAsync(99, "Vendedor"));
    }
}