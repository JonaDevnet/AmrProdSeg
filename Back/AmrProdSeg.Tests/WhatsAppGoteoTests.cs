using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Jobs;
using AmrProdSeg.API.Infrastructure.Notifications;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Quartz;

namespace AmrProdSeg.Tests;

public class WhatsAppGoteoTests
{
    private static WhatsAppGoteoJob Crear(FakeNotificacionRepository repo, FakeWhatsAppSender wa, int max = 60)
    {
        var opt = Options.Create(new NotificacionOptions
        {
            DiasAnticipacion = 3,
            DiasVencida = 3,
            WhatsAppMaxPorDia = max,
            WhatsAppJitterSegMin = 0,   // sin espera en los tests
            WhatsAppJitterSegMax = 0,
        });
        return new WhatsAppGoteoJob(repo, wa, opt, NullLogger<WhatsAppGoteoJob>.Instance);
    }

    private static CuotaVencimiento Cuota(int cobroId, string? tel = null) => new()
    {
        CobroId = cobroId, NumeroCuota = 1, Monto = 10000m,
        FechaVencimiento = new DateTime(2026, 8, 1), NroPoliza = "P" + cobroId,
        ClienteNombre = "Cliente" + cobroId, Telefono = tel ?? ("26100000" + cobroId.ToString("D2")),
    };

    private static PolizaVencimiento Pol(int polId, string? tel = null) => new()
    {
        PolizaId = polId, Numero = "N" + polId, FechaFin = new DateTime(2026, 8, 1),
        ClienteNombre = "Cli" + polId, Patente = "AAA111", Compania = "Cia",
        Telefono = tel ?? ("26199999" + polId.ToString("D2")),
    };

    [Fact]
    public async Task Deshabilitado_NoEnviaNada()
    {
        var repo = new FakeNotificacionRepository { CuotasPorVencer = { Cuota(1) } };
        var wa = new FakeWhatsAppSender { Habilitado = false };
        var msg = await Crear(repo, wa).EjecutarUnaVezAsync(default);

        Assert.Null(msg);
        Assert.Empty(wa.Enviados);
        Assert.Empty(repo.Registros);
    }

    [Fact]
    public async Task EnviaUnSoloPorDisparo()
    {
        var repo = new FakeNotificacionRepository { CuotasPorVencer = { Cuota(1), Cuota(2), Cuota(3) } };
        var wa = new FakeWhatsAppSender { Habilitado = true };

        await Crear(repo, wa).EjecutarUnaVezAsync(default);

        Assert.Single(wa.Enviados);                 // exactamente 1, no la ráfaga
        Assert.Single(repo.Registros);
    }

    [Fact]
    public async Task TresDisparos_EnvianLosTres_LuegoNada()
    {
        var repo = new FakeNotificacionRepository { CuotasPorVencer = { Cuota(1), Cuota(2), Cuota(3) } };
        var wa = new FakeWhatsAppSender { Habilitado = true };
        var job = Crear(repo, wa);

        await job.EjecutarUnaVezAsync(default);
        await job.EjecutarUnaVezAsync(default);
        await job.EjecutarUnaVezAsync(default);
        var cuarto = await job.EjecutarUnaVezAsync(default);   // ya no queda nada

        Assert.Equal(3, wa.Enviados.Count);
        Assert.Null(cuarto);
        Assert.Equal(3, repo.Registros.Select(r => r.Ref).Distinct().Count());
    }

    [Fact]
    public async Task Idempotencia_NoReenviaLoYaEnviado()
    {
        var repo = new FakeNotificacionRepository { CuotasPorVencer = { Cuota(1), Cuota(2) } };
        repo.MarcarEnviada("Cuota", 1);   // la cuota 1 ya se avisó
        var wa = new FakeWhatsAppSender { Habilitado = true };

        await Crear(repo, wa).EjecutarUnaVezAsync(default);

        Assert.Single(wa.Enviados);
        Assert.Contains(wa.Enviados, e => e.Telefono == Cuota(2).Telefono);   // manda la 2, no la 1
    }

    [Fact]
    public async Task TopeDiario_Frena()
    {
        var repo = new FakeNotificacionRepository { CuotasPorVencer = { Cuota(1), Cuota(2), Cuota(3), Cuota(4) } };
        var wa = new FakeWhatsAppSender { Habilitado = true };
        var job = Crear(repo, wa, max: 2);

        for (int i = 0; i < 5; i++) await job.EjecutarUnaVezAsync(default);

        Assert.Equal(2, wa.Enviados.Count);   // se frena en el tope aunque haya pendientes
    }

    [Fact]
    public async Task SinTelefono_SeSaltea()
    {
        var repo = new FakeNotificacionRepository
        {
            CuotasPorVencer = { Cuota(1, tel: ""), Cuota(2, tel: "2615550000") }
        };
        var wa = new FakeWhatsAppSender { Habilitado = true };

        await Crear(repo, wa).EjecutarUnaVezAsync(default);

        Assert.Single(wa.Enviados);
        Assert.Equal("2615550000", wa.Enviados[0].Telefono);   // saltea la sin teléfono
    }

    [Fact]
    public async Task RotacionDeTextos_CincoRedaccionesDistintas()
    {
        // 5 cuotas con MISMOS datos visibles (solo cambia el CobroId): el texto difiere solo por la variante.
        var repo = new FakeNotificacionRepository();
        for (int i = 1; i <= 5; i++)
            repo.CuotasPorVencer.Add(new CuotaVencimiento
            {
                CobroId = i, NumeroCuota = 2, Monto = 5000m, FechaVencimiento = new DateTime(2026, 8, 10),
                NroPoliza = "P-100", ClienteNombre = "Juan", Telefono = "2610000000",
            });
        var wa = new FakeWhatsAppSender { Habilitado = true };
        var job = Crear(repo, wa);

        var msgs = new List<string>();
        for (int i = 0; i < 5; i++) msgs.Add((await job.EjecutarUnaVezAsync(default))!);

        Assert.Equal(5, msgs.Distinct().Count());   // rota entre las 5 redacciones, no repite texto
    }

    [Fact]
    public async Task PrioridadCuotaSobrePoliza()
    {
        var repo = new FakeNotificacionRepository
        {
            CuotasPorVencer = { Cuota(7) },
            Polizas = { Pol(99) },
        };
        var wa = new FakeWhatsAppSender { Habilitado = true };

        await Crear(repo, wa).EjecutarUnaVezAsync(default);

        Assert.Equal("Cuota", repo.Registros[0].Tipo);   // primero la cuota, no la póliza
    }

    [Fact]
    public async Task FalloDeEnvio_NoRegistra_YReintentaAlSiguienteTic()
    {
        var repo = new FakeNotificacionRepository { CuotasPorVencer = { Cuota(1) } };
        var wa = new FakeWhatsAppSender { Habilitado = true, Fallar = true };
        var job = Crear(repo, wa);

        var m = await job.EjecutarUnaVezAsync(default);

        Assert.Null(m);
        Assert.Empty(repo.Registros);   // NO se marca como enviado si Evolution falló

        // Se recupera Evolution → el próximo tic sí lo envía
        wa.Fallar = false;
        await job.EjecutarUnaVezAsync(default);
        Assert.Single(wa.Enviados);
    }

    [Fact]
    public async Task Envio_EsCentralizado_UsaConfigGlobal_NoDelProductor()
    {
        // Los recordatorios salen "en general": el job NO pasa usuarioId, así el sender resuelve
        // la config GLOBAL/Admin (no la de un productor). usuarioId debe ser null en cada envío.
        var repo = new FakeNotificacionRepository { CuotasPorVencer = { Cuota(1), Cuota(2), Cuota(3) } };
        var wa = new FakeWhatsAppSender { Habilitado = true };
        var job = Crear(repo, wa);

        for (int i = 0; i < 3; i++) await job.EjecutarUnaVezAsync(default);

        Assert.Equal(3, wa.Enviados.Count);
        Assert.All(wa.Enviados, e => Assert.Null(e.UsuarioId));   // config del Admin, no del vendedor
    }

    [Fact]
    public async Task Simulacion_DiaCompleto_CadaClienteUnaVez_SinDuplicar()
    {
        // 8 cuotas por vencer + 2 vencidas + 3 pólizas por vencer = 13 avisos, tope 60.
        var repo = new FakeNotificacionRepository();
        for (int i = 1; i <= 8; i++) repo.CuotasPorVencer.Add(Cuota(i));
        repo.CuotasVencidas.Add(Cuota(101)); repo.CuotasVencidas.Add(Cuota(102));
        for (int i = 1; i <= 3; i++) repo.Polizas.Add(Pol(i));
        var wa = new FakeWhatsAppSender { Habilitado = true };
        var job = Crear(repo, wa, max: 60);

        // Simulamos muchos "tics" del cron (más que suficientes).
        int enviadosEnEsteTic;
        int totalTics = 0;
        do
        {
            var antes = wa.Enviados.Count;
            await job.EjecutarUnaVezAsync(default);
            enviadosEnEsteTic = wa.Enviados.Count - antes;
            totalTics++;
        } while (enviadosEnEsteTic > 0 && totalTics < 100);

        Assert.Equal(13, wa.Enviados.Count);                                   // los 13 avisos salieron
        Assert.Equal(13, repo.Registros.Select(r => (r.Tipo, r.Ref)).Distinct().Count()); // sin duplicar
        // Y un tic extra ya no manda nada (idempotencia total).
        Assert.Null(await job.EjecutarUnaVezAsync(default));
    }

    [Fact]
    public void Cron_Goteo_DisparaCada5min_EnHorasAlternadas()
    {
        var cron = new CronExpression("0 0/5 9,11,13,15,17,19 * * ?") { TimeZone = TimeZoneInfo.Utc };
        var porHora = new Dictionary<int, int>();
        DateTimeOffset? t = new DateTimeOffset(2026, 7, 30, 7, 59, 0, TimeSpan.Zero);
        var fin = new DateTimeOffset(2026, 7, 30, 20, 30, 0, TimeSpan.Zero);

        while (true)
        {
            var next = cron.GetNextValidTimeAfter(t!.Value);
            if (next is null || next.Value > fin) break;
            var h = next.Value.UtcDateTime.Hour;
            porHora[h] = porHora.GetValueOrDefault(h) + 1;
            t = next.Value;
        }

        Assert.Equal(12, porHora.GetValueOrDefault(9));    // 9:00..9:55 → 12 disparos
        Assert.Equal(0, porHora.GetValueOrDefault(10));    // hora "off"
        Assert.Equal(12, porHora.GetValueOrDefault(11));
        Assert.Equal(0, porHora.GetValueOrDefault(12));
        Assert.Equal(12, porHora.GetValueOrDefault(19));
        Assert.Equal(0, porHora.GetValueOrDefault(20));
    }
}
