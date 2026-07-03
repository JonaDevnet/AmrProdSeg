namespace AmrProdSeg.API.Application.DTOs;

// 11.2 — Cobros del período
public class CobroPeriodoDto
{
    public int Id { get; set; }
    public int NumeroCuota { get; set; }
    public DateTime FechaVencimiento { get; set; }
    public decimal Monto { get; set; }
    public int Estado { get; set; }
    public DateTime? FechaPago { get; set; }
    public string NroPoliza { get; set; } = string.Empty;
    public string ClienteNombre { get; set; } = string.Empty;
    public string Compania { get; set; } = string.Empty;
}

// 11.3 — Estado de cuenta (detalle + totales)
public class EstadoCuentaItemDto
{
    public int Id { get; set; }
    public string NroPoliza { get; set; } = string.Empty;
    public int NumeroCuota { get; set; }
    public DateTime FechaVencimiento { get; set; }
    public decimal Monto { get; set; }
    public int Estado { get; set; }
    public DateTime? FechaPago { get; set; }
}

public class EstadoCuentaDto
{
    public List<EstadoCuentaItemDto> Detalle { get; set; } = new();
    public decimal TotalAbonado { get; set; }
    public decimal TotalAdeudado { get; set; }
}

// 11.4 — Deuda acumulada
public class DeudaAcumuladaDto
{
    public int ClienteId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public int CuotasImpagas { get; set; }
    public decimal MontoAdeudado { get; set; }
}

// 11.5 — Pólizas por vencer
public class PolizaPorVencerDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string Patente { get; set; } = string.Empty;
    public string Compania { get; set; } = string.Empty;
    public string NroPoliza { get; set; } = string.Empty;
    public DateTime FechaFin { get; set; }
    public int DiasRestantes { get; set; }
}

// 11.6 — Vencidas sin renovar
public class VencidaSinRenovarDto
{
    public string ClienteNombre { get; set; } = string.Empty;
    public string Patente { get; set; } = string.Empty;
    public string Compania { get; set; } = string.Empty;
    public string NroPoliza { get; set; } = string.Empty;
    public DateTime FechaFin { get; set; }
    public int DiasVencida { get; set; }
    public decimal PrecioTotal { get; set; }
}

// 11.7 — Cartera por compañía
public class CarteraCompaniaDto
{
    public int CompaniaId { get; set; }
    public string Compania { get; set; } = string.Empty;
    public int CantidadPolizas { get; set; }
    public int ClientesUnicos { get; set; }
    public decimal PrimaTotal { get; set; }
}

// 11.8 — Producción mensual
public class ProduccionMensualDto
{
    public int PolizasNuevas { get; set; }
    public int PolizasRenovadas { get; set; }
    public int TotalPolizas { get; set; }
    public decimal PrimaEmitida { get; set; }
}

// 11.9 — Ingresos proyectados
public class IngresoProyectadoDto
{
    public int Anio { get; set; }
    public int Mes { get; set; }
    public decimal MontoProyectado { get; set; }
    public int CantidadCuotas { get; set; }
}

// Pagos recibidos (rango) — base de los tabs Pagos / Rendición / Hechos del día
public class PagoRecibidoDto
{
    public int Id { get; set; }
    public DateTime FechaPago { get; set; }
    public decimal Monto { get; set; }
    public int NumeroCuota { get; set; }
    public int PolizaId { get; set; }
    public string NroPoliza { get; set; } = string.Empty;
    public decimal PrimaOG { get; set; }
    public int CantidadCuotas { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
    public string Compania { get; set; } = string.Empty;
    public int CompaniaId { get; set; }
    public string Ramo { get; set; } = string.Empty;
    public string Metodo { get; set; } = string.Empty;
    public string Patente { get; set; } = string.Empty;
    public int? OficinaId { get; set; }
    public string OficinaNombre { get; set; } = string.Empty;
    public int? VendedorId { get; set; }
    public string VendedorNombre { get; set; } = string.Empty;
}

/// <summary>Fila del export de cartera (Admin): datos completos por póliza.</summary>
public class CarteraExportDto
{
    public DateTime? ProximoVencimiento { get; set; }
    public string Compania { get; set; } = string.Empty;
    public int CuotaActual { get; set; }    // número entero de la cuota en curso
    public int CuotasTotal { get; set; }
    public decimal PrecioCobrado { get; set; }
    public decimal PrecioTotal { get; set; }
    public decimal PrimaOG { get; set; }
    public string NroPoliza { get; set; } = string.Empty;
    // Cliente completo
    public string ClienteNombre { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    // Automóvil completo
    public string Patente { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Anio { get; set; } = string.Empty;
    public string Chasis { get; set; } = string.Empty;
    public string Motor { get; set; } = string.Empty;
    public string Combustion { get; set; } = string.Empty;
    // Al final
    public string TipoCobertura { get; set; } = string.Empty;
}
