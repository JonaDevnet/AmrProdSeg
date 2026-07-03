namespace AmrProdSeg.API.Domain;

/// <summary>Read-model: póliza próxima a vencer (para recordatorios).</summary>
public class PolizaVencimiento
{
    public int PolizaId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public DateTime FechaFin { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string Patente { get; set; } = string.Empty;
    public string Compania { get; set; } = string.Empty;
}

/// <summary>Read-model: cuota próxima a vencer (para recordatorios).</summary>
public class CuotaVencimiento
{
    public int CobroId { get; set; }
    public int NumeroCuota { get; set; }
    public decimal Monto { get; set; }
    public DateTime FechaVencimiento { get; set; }
    public string NroPoliza { get; set; } = string.Empty;
    public string ClienteNombre { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
}
