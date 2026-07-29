using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Services;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Security.Helpers;
using Microsoft.Extensions.Configuration;

namespace AmrProdSeg.Tests;

public class AuthServiceTests
{
    private const string Pass = "secret123";
    private static string Hash(string p) => BCrypt.Net.BCrypt.HashPassword(p);

    private static IConfiguration Cfg() => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "clave-de-prueba-super-larga-de-mas-de-32-caracteres-000",
            ["Jwt:Issuer"] = "test",
            ["Jwt:Audience"] = "test",
            ["Jwt:ExpirationHours"] = "8",
            ["Jwt:RefreshDays"] = "7",
        }).Build();

    private static (AuthService svc, FakeAuthRepository auth, FakeResetRepository reset, FakeUsuarioRepository usu) Crear(
        Usuario? porEmail = null, SolicitudReset? autorizada = null)
    {
        var auth = new FakeAuthRepository { UsuarioPorEmail = porEmail };
        var reset = new FakeResetRepository { Autorizada = autorizada };
        var usu = new FakeUsuarioRepository();
        var cfg = Cfg();
        var svc = new AuthService(auth, usu, reset, new JwtHelper(cfg), cfg);
        return (svc, auth, reset, usu);
    }

    [Fact]
    public async Task Login_CredencialesValidas_DevuelveTokens()
    {
        var (svc, auth, _, _) = Crear(porEmail: new Usuario
        {
            Id = 1, Email = "a@a.com", Nombre = "Admin", Rol = "Admin", PasswordHash = Hash(Pass)
        });

        var r = await svc.LoginAsync(new LoginDto { Email = "a@a.com", Password = Pass });

        Assert.False(string.IsNullOrWhiteSpace(r.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(r.RefreshToken));
        Assert.Equal("Admin", r.Rol);
        Assert.Equal(1, auth.GuardarLlamado); // guardó el refresh token
    }

    [Fact]
    public async Task Login_UsuarioInexistente_LanzaBusinessException()
    {
        var (svc, _, _, _) = Crear(porEmail: null);
        await Assert.ThrowsAsync<BusinessException>(
            () => svc.LoginAsync(new LoginDto { Email = "x@x.com", Password = Pass }));
    }

    [Fact]
    public async Task Login_PasswordIncorrecta_LanzaBusinessException()
    {
        var (svc, _, _, _) = Crear(porEmail: new Usuario { Id = 1, Email = "a@a.com", PasswordHash = Hash(Pass) });
        await Assert.ThrowsAsync<BusinessException>(
            () => svc.LoginAsync(new LoginDto { Email = "a@a.com", Password = "incorrecta" }));
    }

    [Fact]
    public async Task ConfirmarReset_SinSolicitudAutorizada_LanzaBusinessException()
    {
        var (svc, _, _, _) = Crear(autorizada: null);
        await Assert.ThrowsAsync<BusinessException>(
            () => svc.ConfirmarResetAsync("a@a.com", "nueva123"));
    }

    [Fact]
    public async Task ConfirmarReset_ConSolicitud_GuardaHashYCompleta()
    {
        var (svc, _, reset, usu) = Crear(autorizada: new SolicitudReset { Id = 7, UsuarioId = 3, Email = "a@a.com" });

        await svc.ConfirmarResetAsync("a@a.com", "nueva123");

        Assert.NotNull(usu.PasswordCambiada);
        Assert.True(BCrypt.Net.BCrypt.Verify("nueva123", usu.PasswordCambiada!)); // guardó el hash correcto
        Assert.Equal(1, reset.CompletarLlamado);
    }
}
