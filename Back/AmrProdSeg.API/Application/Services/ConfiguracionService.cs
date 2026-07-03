using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Infrastructure.Interfaces;
using AmrProdSeg.API.Infrastructure.Notifications;
using Microsoft.Extensions.Options;

namespace AmrProdSeg.API.Application.Services;

/// <summary>
/// Config persistida en DB (tabla Configuraciones) que se superpone a appsettings.
/// Hoy gestiona los parámetros SMTP (incluido el correo emisor) editables por el Admin.
/// </summary>
public class ConfiguracionService : IConfiguracionService
{
    private const string Pref = "Smtp:";
    private const string PrefEvo = "Evolution:";
    private readonly IConfiguracionRepository _repo;
    private readonly SmtpOptions _defaults;
    private readonly EvolutionOptions _evoDefaults;

    public ConfiguracionService(IConfiguracionRepository repo, IOptions<SmtpOptions> defaults, IOptions<EvolutionOptions> evoDefaults)
    {
        _repo = repo;
        _defaults = defaults.Value;
        _evoDefaults = evoDefaults.Value;
    }

    public async Task<SmtpOptions> GetSmtpEffectiveAsync()
    {
        var db = await _repo.GetAllAsync();
        string S(string k, string fb) => db.TryGetValue(Pref + k, out var v) && v is not null ? v : fb;
        bool B(string k, bool fb) => db.TryGetValue(Pref + k, out var v) && bool.TryParse(v, out var b) ? b : fb;
        int I(string k, int fb) => db.TryGetValue(Pref + k, out var v) && int.TryParse(v, out var n) ? n : fb;

        return new SmtpOptions
        {
            Habilitado = B("Habilitado", _defaults.Habilitado),
            Host       = S("Host", _defaults.Host),
            Port       = I("Port", _defaults.Port),
            UsarSsl    = B("UsarSsl", _defaults.UsarSsl),
            Usuario    = S("Usuario", _defaults.Usuario),
            Password   = S("Password", _defaults.Password),
            From       = S("From", _defaults.From),
            FromNombre = S("FromNombre", _defaults.FromNombre),
        };
    }

    public async Task<SmtpConfigDto> GetSmtpAsync()
    {
        var e = await GetSmtpEffectiveAsync();
        return new SmtpConfigDto
        {
            Habilitado = e.Habilitado,
            Host = e.Host,
            Port = e.Port,
            UsarSsl = e.UsarSsl,
            Usuario = e.Usuario,
            From = e.From,
            FromNombre = e.FromNombre,
            PasswordConfigurada = !string.IsNullOrEmpty(e.Password),
        };
    }

    public async Task ActualizarSmtpAsync(ActualizarSmtpDto dto)
    {
        await _repo.SetAsync(Pref + "Habilitado", dto.Habilitado.ToString());
        await _repo.SetAsync(Pref + "Host", dto.Host ?? "");
        await _repo.SetAsync(Pref + "Port", dto.Port.ToString());
        await _repo.SetAsync(Pref + "UsarSsl", dto.UsarSsl.ToString());
        await _repo.SetAsync(Pref + "Usuario", dto.Usuario ?? "");
        await _repo.SetAsync(Pref + "From", dto.From ?? "");
        await _repo.SetAsync(Pref + "FromNombre", dto.FromNombre ?? "");
        if (!string.IsNullOrWhiteSpace(dto.Password))
            await _repo.SetAsync(Pref + "Password", dto.Password);
    }

    public async Task<EvolutionOptions> GetEvolutionEffectiveAsync()
    {
        var db = await _repo.GetAllAsync();
        string S(string k, string fb) => db.TryGetValue(PrefEvo + k, out var v) && v is not null ? v : fb;
        bool B(string k, bool fb) => db.TryGetValue(PrefEvo + k, out var v) && bool.TryParse(v, out var b) ? b : fb;
        return new EvolutionOptions
        {
            Habilitado = B("Habilitado", _evoDefaults.Habilitado),
            BaseUrl    = S("BaseUrl", _evoDefaults.BaseUrl),
            Instance   = S("Instance", _evoDefaults.Instance),
            ApiKey     = S("ApiKey", _evoDefaults.ApiKey),
        };
    }

    public async Task<EvolutionConfigDto> GetEvolutionAsync()
    {
        var e = await GetEvolutionEffectiveAsync();
        return new EvolutionConfigDto
        {
            Habilitado = e.Habilitado,
            BaseUrl = e.BaseUrl,
            Instance = e.Instance,
            ApiKeyConfigurada = !string.IsNullOrEmpty(e.ApiKey),
        };
    }

    public async Task ActualizarEvolutionAsync(ActualizarEvolutionDto dto)
    {
        await _repo.SetAsync(PrefEvo + "Habilitado", dto.Habilitado.ToString());
        await _repo.SetAsync(PrefEvo + "BaseUrl", dto.BaseUrl ?? "");
        await _repo.SetAsync(PrefEvo + "Instance", dto.Instance ?? "");
        if (!string.IsNullOrWhiteSpace(dto.ApiKey))
            await _repo.SetAsync(PrefEvo + "ApiKey", dto.ApiKey);
    }
}
