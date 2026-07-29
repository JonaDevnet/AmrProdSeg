using AmrProdSeg.API.Application.Services;
using AmrProdSeg.API.Infrastructure.Notifications;
using Microsoft.Extensions.Options;

namespace AmrProdSeg.Tests;

public class ConfiguracionServiceTests
{
    private static ConfiguracionService Crear(FakeConfiguracionRepository repo)
        => new(repo,
            Options.Create(new SmtpOptions { Habilitado = false, Host = "smtp.default" }),
            Options.Create(new EvolutionOptions { Habilitado = false, BaseUrl = "https://default", Instance = "def" }));

    private static Dictionary<string, string?> EvoCfg(bool hab, string instancia) => new()
    {
        ["Evolution:Habilitado"] = hab.ToString(),
        ["Evolution:BaseUrl"] = "https://vps",
        ["Evolution:Instance"] = instancia,
    };

    [Fact]
    public async Task Evolution_Admin_UsaSuPropiaConfig()
    {
        var repo = new FakeConfiguracionRepository { AdminId = 1 };
        repo.PorUsuario[1] = EvoCfg(true, "AdminInst");
        var svc = Crear(repo);

        var opt = await svc.GetEvolutionEffectiveAsync(1);

        Assert.True(opt.Habilitado);
        Assert.Equal("AdminInst", opt.Instance);
    }

    [Fact]
    public async Task Evolution_UsuarioSinConfig_HaceFallbackAlAdmin()
    {
        var repo = new FakeConfiguracionRepository { AdminId = 1 };
        repo.PorUsuario[1] = EvoCfg(true, "AdminInst"); // solo el Admin configuró
        var svc = Crear(repo);

        var opt = await svc.GetEvolutionEffectiveAsync(5); // usuario 5 sin config

        Assert.True(opt.Habilitado);              // heredó del Admin
        Assert.Equal("AdminInst", opt.Instance);
    }

    [Fact]
    public async Task Evolution_UsuarioConConfigPropia_NoHaceFallback()
    {
        var repo = new FakeConfiguracionRepository { AdminId = 1 };
        repo.PorUsuario[1] = EvoCfg(true, "AdminInst");
        repo.PorUsuario[5] = EvoCfg(false, "MiInst"); // el usuario 5 tiene la suya
        var svc = Crear(repo);

        var opt = await svc.GetEvolutionEffectiveAsync(5);

        Assert.False(opt.Habilitado);            // la suya, NO la del Admin
        Assert.Equal("MiInst", opt.Instance);
    }

    [Fact]
    public async Task Evolution_UsuarioIdNull_UsaElAdmin()
    {
        var repo = new FakeConfiguracionRepository { AdminId = 1 };
        repo.PorUsuario[1] = EvoCfg(true, "AdminInst");
        var svc = Crear(repo);

        var opt = await svc.GetEvolutionEffectiveAsync(null);

        Assert.Equal("AdminInst", opt.Instance);
    }

    [Fact]
    public async Task Evolution_SinConfigEnNingunLado_UsaLosDefaults()
    {
        var repo = new FakeConfiguracionRepository { AdminId = 1 }; // nadie configuró nada
        var svc = Crear(repo);

        var opt = await svc.GetEvolutionEffectiveAsync(1);

        Assert.False(opt.Habilitado);
        Assert.Equal("https://default", opt.BaseUrl); // default de IOptions
    }
}
