using System.Globalization;

namespace AmrProdSeg.API.Application.Services;

/// <summary>Arma el detalle de auditoría listando SOLO los campos que cambiaron: "Campo: antes → después".</summary>
public static class AuditoriaDetalle
{
    private static readonly CultureInfo EsAr = CultureInfo.GetCultureInfo("es-AR");

    public static string Cambios(IEnumerable<(string Campo, object? Antes, object? Nuevo)> campos)
    {
        var partes = new List<string>();
        foreach (var (campo, antes, nuevo) in campos)
        {
            var a = Fmt(antes);
            var n = Fmt(nuevo);
            if (!string.Equals(a, n, StringComparison.Ordinal))
                partes.Add($"{campo}: {a} → {n}");
        }
        return partes.Count == 0 ? "Sin cambios en los campos." : string.Join("; ", partes);
    }

    public static string Fmt(object? v) => v switch
    {
        null => "—",
        string s => string.IsNullOrWhiteSpace(s) ? "—" : $"\"{s.Trim()}\"",
        DateTime d => d.ToString("dd/MM/yyyy"),
        decimal m => "$ " + m.ToString("N2", EsAr),
        bool b => b ? "Sí" : "No",
        _ => v.ToString() ?? "—",
    };

    /// <summary>Concatena el motivo de la solicitud al detalle (si vino).</summary>
    public static string ConMotivo(string detalle, string? motivo)
        => string.IsNullOrWhiteSpace(motivo) ? detalle : $"{detalle} (Motivo: {motivo.Trim()})";
}
