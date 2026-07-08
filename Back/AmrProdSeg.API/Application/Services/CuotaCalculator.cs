using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;

namespace AmrProdSeg.API.Application.Services;

/// <summary>
/// Genera las cuotas (cobros) de una póliza. La última cuota absorbe la
/// diferencia de redondeo para que la suma sea exactamente el precio total.
/// </summary>
public static class CuotaCalculator
{
    /// <summary>
    /// Genera las cuotas. La 1ª vence en <paramref name="primerVencimiento"/> (por defecto
    /// ~30 días después del inicio) y las siguientes, un mes después de la anterior.
    /// </summary>
    public static List<Cobro> Generar(Poliza poliza, DateTime primerVencimiento)
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
                FechaVencimiento = primerVencimiento.AddMonths(i - 1),
                Monto            = i < poliza.CantidadCuotas ? montoBase : ultima,
                Estado           = EstadoCobro.Pendiente
            });
        }
        return cobros;
    }
}
