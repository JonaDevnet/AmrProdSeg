using AmrProdSeg.API.Application.DTOs;
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
    public async Task CrearAsync_EmailActivo_LanzaBusinessException()
    {
        var repo = new FakeUsuarioRepository();
        var auth = new FakeAuthRepository
        {
            UsuarioPorEmail = new Usuario { Id = 7, Email = "user@amr.com", Activo = true }
        };
        var svc = new UsuarioService(repo, auth, new FakeResetRepository());

        await Assert.ThrowsAsync<BusinessException>(() => svc.CrearAsync(new CrearUsuarioDto
        {
            Nombre = "Usuario", Email = "user@amr.com", Password = "12345678", Rol = "Productor"
        }));
        Assert.Equal(0, repo.ReactivarLlamadas);
    }

    [Fact]
    public async Task CrearAsync_EmailInactivo_ReactivaElMismoUsuario()
    {
        var repo = new FakeUsuarioRepository();
        var auth = new FakeAuthRepository
        {
            UsuarioPorEmail = new Usuario { Id = 7, Email = "user@amr.com", Activo = false, Rol = "Productor" }
        };
        var svc = new UsuarioService(repo, auth, new FakeResetRepository());

        var id = await svc.CrearAsync(new CrearUsuarioDto
        {
            Nombre = "  Usuario Nuevo  ", Email = " user@amr.com ", Password = "12345678", Rol = "Admin"
        });

        Assert.Equal(7, id);
        Assert.Equal(1, repo.ReactivarLlamadas);
        Assert.Equal("Usuario Nuevo", repo.NombreReactivado);
        Assert.Equal("Admin", repo.RolReactivado);
    }

    [Fact]
    public async Task ActualizarRol_SuperAdmin_LanzaBusinessException()
    {
        var (svc, _) = Crear(new Usuario { Id = 1, Rol = "SuperAdmin" });

        await Assert.ThrowsAsync<BusinessException>(() => svc.ActualizarRolAsync(1, "Admin"));
    }

    [Fact]
    public async Task ActualizarRol_Admin_Ok()
    {
        var (svc, repo) = Crear(new Usuario { Id = 1, Rol = "Admin" });

        await svc.ActualizarRolAsync(1, "Productor");

        Assert.Equal("Productor", repo.RolActualizado);
    }

    [Fact]
    public async Task ActualizarRol_PromoverASuperAdmin_Ok()
    {
        var (svc, repo) = Crear(new Usuario { Id = 2, Rol = "Admin" });

        await svc.ActualizarRolAsync(2, "SuperAdmin");

        Assert.Equal("SuperAdmin", repo.RolActualizado);
    }

    [Fact]
    public async Task ActualizarRol_Productor_Ok()
    {
        var (svc, repo) = Crear(new Usuario { Id = 2, Rol = "Productor" });

        await svc.ActualizarRolAsync(2, "Vendedor");

        Assert.Equal("Vendedor", repo.RolActualizado);
    }

    [Fact]
    public async Task ActualizarRol_UsuarioInexistente_NotFound()
    {
        var (svc, _) = Crear(null);

        await Assert.ThrowsAsync<NotFoundException>(() => svc.ActualizarRolAsync(99, "Vendedor"));
    }
}