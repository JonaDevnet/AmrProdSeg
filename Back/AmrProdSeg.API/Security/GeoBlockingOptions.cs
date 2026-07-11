namespace AmrProdSeg.API.Security;

/// <summary>
/// Configuración del bloqueo geográfico (solo se permite el país configurado).
/// Se enlaza a la sección "GeoBlocking" (appsettings / variables de entorno).
/// </summary>
public class GeoBlockingOptions
{
    /// <summary>Interruptor general. Por defecto apagado (se enciende por env: GeoBlocking__Habilitado=true).</summary>
    public bool Habilitado { get; set; } = false;

    /// <summary>Código ISO del país permitido (ipquery.io → location.country_code).</summary>
    public string PaisPermitido { get; set; } = "AR";

    /// <summary>Base del servicio de geolocalización. Se consulta {ApiUrl}/{ip}.</summary>
    public string ApiUrl { get; set; } = "https://api.ipquery.io";

    /// <summary>Timeout de la consulta externa (segundos). Corto para no colgar la request.</summary>
    public int TimeoutSegundos { get; set; } = 3;

    /// <summary>Horas que se cachea la decisión por IP (evita reconsultar en cada request).</summary>
    public int CacheHoras { get; set; } = 24;
}
