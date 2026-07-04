using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Domain;

namespace AmrProdSeg.API.Application.Mapping;

public static class Mappings
{
    public static PolizaDto ToDto(this Poliza p) => new()
    {
        Id             = p.Id,
        Numero         = p.Numero,
        ClienteId      = p.ClienteId,
        VehiculoId     = p.VehiculoId,
        CompaniaId     = p.CompaniaId,
        RamoId         = p.RamoId,
        FechaInicio    = p.FechaInicio,
        FechaFin       = p.FechaFin,
        PrecioTotal    = p.PrecioTotal,
        CantidadCuotas = p.CantidadCuotas,
        Estado         = p.Estado.ToString(),
        PolizaOrigenId = p.PolizaOrigenId,
        FechaEmision   = p.FechaEmision,
        FormaPago      = p.FormaPago,
        PrimaOG        = p.PrimaOG,
        Cobertura      = p.Cobertura,
        ClienteNombre  = p.ClienteNombre,
        Patente        = p.Patente,
        RamoNombre     = p.RamoNombre,
        CuotasTotal    = p.CuotasTotal,
        CuotasPagadas  = p.CuotasPagadas,
        CuotasVencidas = p.CuotasVencidas,
        VendedorNombre = p.VendedorNombre,
        ClienteVendedorNombre = p.ClienteVendedorNombre
    };
}
