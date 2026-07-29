using System.Diagnostics;
using AmrProdSeg.API.Application.Services;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;

namespace AmrProdSeg.Tests;

public class CuotaCalculatorTests
{
    private static Poliza P(decimal total, int cuotas) => new() { Id = 1, PrecioTotal = total, CantidadCuotas = cuotas };

    [Fact]
    public void Generar_CantidadCorrecta_YTodasPendientes()
    {
        var cobros = CuotaCalculator.Generar(P(90000, 3), new DateTime(2026, 8, 12));
        Assert.Equal(3, cobros.Count);
        Assert.All(cobros, c => Assert.Equal(EstadoCobro.Pendiente, c.Estado));
        Assert.Equal(new[] { 1, 2, 3 }, cobros.Select(c => c.NumeroCuota).ToArray());
    }

    [Fact]
    public void Generar_FechasEscalonadasMensuales_MismoDia()
    {
        var cobros = CuotaCalculator.Generar(P(90000, 3), new DateTime(2026, 8, 12));
        Assert.Equal(new DateTime(2026, 8, 12),  cobros[0].FechaVencimiento);
        Assert.Equal(new DateTime(2026, 9, 12),  cobros[1].FechaVencimiento);
        Assert.Equal(new DateTime(2026, 10, 12), cobros[2].FechaVencimiento);
    }

    [Theory]
    [InlineData(90000, 3)]
    [InlineData(100000, 3)]   // división no exacta: 33333.33 x2 + 33333.34
    [InlineData(166800, 3)]
    [InlineData(55600, 1)]
    public void Generar_SumaExactaAlTotal(decimal total, int cuotas)
    {
        var cobros = CuotaCalculator.Generar(P(total, cuotas), new DateTime(2026, 1, 1));
        Assert.Equal(total, cobros.Sum(c => c.Monto)); // la última cuota absorbe el redondeo
    }

    [Fact]
    public void Generar_UnaCuota_MontoTotal_YVencimientoEsPrimero()
    {
        var cobros = CuotaCalculator.Generar(P(55600, 1), new DateTime(2026, 6, 12));
        Assert.Single(cobros);
        Assert.Equal(55600m, cobros[0].Monto);
        Assert.Equal(new DateTime(2026, 6, 12), cobros[0].FechaVencimiento);
    }

    [Fact]
    public void Generar_Rendimiento_10000Iteraciones_MenosDe250ms()
    {
        var poliza = P(166800, 3);
        var venc = new DateTime(2026, 8, 12);
        var sw = Stopwatch.StartNew();
        for (int i = 0; i < 10_000; i++) _ = CuotaCalculator.Generar(poliza, venc);
        sw.Stop();
        // 10k generaciones deben ser instantáneas; si supera 250ms hay una regresión.
        Assert.True(sw.ElapsedMilliseconds < 250, $"CuotaCalculator.Generar lento: {sw.ElapsedMilliseconds}ms/10k");
    }
}
