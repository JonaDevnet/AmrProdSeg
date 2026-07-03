using System.Globalization;

namespace AmrProdSeg.API.Application.Mapping;

/// <summary>
/// Helpers para leer valores tipados desde las filas genéricas (columna→valor)
/// que devuelven los SP de reportes.
/// </summary>
public static class DictMap
{
    public static int Int(this Dictionary<string, object?> d, string key)
        => d.TryGetValue(key, out var v) && v is not null
            ? Convert.ToInt32(v, CultureInfo.InvariantCulture) : 0;

    public static int? IntN(this Dictionary<string, object?> d, string key)
        => d.TryGetValue(key, out var v) && v is not null
            ? Convert.ToInt32(v, CultureInfo.InvariantCulture) : null;

    public static decimal Dec(this Dictionary<string, object?> d, string key)
        => d.TryGetValue(key, out var v) && v is not null
            ? Convert.ToDecimal(v, CultureInfo.InvariantCulture) : 0m;

    public static string Str(this Dictionary<string, object?> d, string key)
        => d.TryGetValue(key, out var v) && v is not null ? v.ToString()! : string.Empty;

    public static string? StrN(this Dictionary<string, object?> d, string key)
        => d.TryGetValue(key, out var v) && v is not null ? v.ToString() : null;

    public static DateTime Date(this Dictionary<string, object?> d, string key)
        => d.TryGetValue(key, out var v) && v is not null
            ? Convert.ToDateTime(v, CultureInfo.InvariantCulture) : default;

    public static DateTime? DateN(this Dictionary<string, object?> d, string key)
        => d.TryGetValue(key, out var v) && v is not null
            ? Convert.ToDateTime(v, CultureInfo.InvariantCulture) : null;
}
