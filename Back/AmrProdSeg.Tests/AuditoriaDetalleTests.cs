using AmrProdSeg.API.Application.Services;

namespace AmrProdSeg.Tests;

public class AuditoriaDetalleTests
{
    [Fact]
    public void Cambios_SoloIncluyeLosCamposModificados()
    {
        var d = AuditoriaDetalle.Cambios(new (string, object?, object?)[]
        {
            ("Nombre", "Juan", "Juan"),
            ("Teléfono", "1111", "2222"),
            ("Dirección", "Av. A", "Av. A"),
        });

        Assert.Contains("Teléfono", d);
        Assert.Contains("→", d);
        Assert.DoesNotContain("Nombre", d);
        Assert.DoesNotContain("Dirección", d);
    }

    [Fact]
    public void Cambios_SinCambios_DevuelveMensajePorDefecto()
    {
        var d = AuditoriaDetalle.Cambios(new (string, object?, object?)[]
        {
            ("Nombre", "Juan", "Juan"),
        });

        Assert.Equal("Sin cambios en los campos.", d);
    }

    [Fact]
    public void Fmt_NuloOVacio_Guion()
    {
        Assert.Equal("—", AuditoriaDetalle.Fmt(null));
        Assert.Equal("—", AuditoriaDetalle.Fmt("   "));
    }

    [Fact]
    public void ConMotivo_AgregaElMotivo_CuandoViene()
    {
        Assert.Equal("Teléfono: \"1\" → \"2\" (Motivo: error de carga)",
            AuditoriaDetalle.ConMotivo("Teléfono: \"1\" → \"2\"", "error de carga"));
        Assert.Equal("x", AuditoriaDetalle.ConMotivo("x", "  "));
        Assert.Equal("x", AuditoriaDetalle.ConMotivo("x", null));
    }
}
