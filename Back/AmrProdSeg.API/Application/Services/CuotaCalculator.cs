using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;

namespace AmrProdSeg.API.Application.Services;

/// <summary>
/// Genera las cuotas (cobros) de una póliza. La última cuota absorbe la
/// diferencia de redondeo para que la suma sea exactamente el precio total.
/// </summary>
public static class CuotaCalculator
{
    public static List<Cobro> Generar(Poliza poliza)
    {
        var montoBase = Math.Round(poliza.PrecioTotal / poliza.CantidadCuotas, 2, MidpointRounding.AwayFromZero);
        var ultima    = poliza.PrecioTotal - montoBase * (poliza.CantidadCuotas - 1);

        var cobros = new List<Cobro>(poliza.CantidadCuotas);
        for (int i = 1; i <= poliza.CantidadCuotas; i++)
        {
            cobros.Add(new Cobro
            {
                PolizaId         = poliza.Id,
                NumeroCuota      = i,
                // La 1ª cuota vence ~30 días después del inicio; las siguientes, mensualmente.
                FechaVencimiento = poliza.FechaInicio.AddMonths(i),
                Monto            = i < poliza.CantidadCuotas ? montoBase : ultima,
                Estado           = EstadoCobro.Pendiente
            });
        }
        return cobros;
    }
}
