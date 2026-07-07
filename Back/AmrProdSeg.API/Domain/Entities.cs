using AmrProdSeg.API.Domain.Enums;

namespace AmrProdSeg.API.Domain;

public class Cliente
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public string? TipoDocumento { get; set; }   // DNI | CUIL | CUIT | Pasaporte
    public DateTime? FechaNacimiento { get; set; }
    public int? OficinaId { get; set; }
    public int? VendedorId { get; set; }          // usuario que dio de alta al cliente
    public DateTime FechaAlta { get; set; }
    public bool Activo { get; set; } = true;
}

public class Vehiculo
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public short Anio { get; set; }
    public string Patente { get; set; } = string.Empty;
    public string? Chasis { get; set; }
    public string? Motor { get; set; }
    public string? TipoCobertura { get; set; }
    public string? Combustion { get; set; }      // "Nafta", "Nafta / GNC", etc.
}

public class Compania
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? CUIT { get; set; }
    public string? Telefono { get; set; }
    public string? LogoUrl { get; set; }
    public string? Color { get; set; }
    public bool Activo { get; set; } = true;
}

public class Poliza
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public int ClienteId { get; set; }
    public int? VehiculoId { get; set; }      // opcional: ramos sin vehículo (Hogar, Vida…)
    public int CompaniaId { get; set; }
    public int? RamoId { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public decimal PrecioTotal { get; set; }
    public int CantidadCuotas { get; set; }
    public EstadoPoliza Estado { get; set; }
    public int? PolizaOrigenId { get; set; }
    public DateTime FechaEmision { get; set; }
    public string? FormaPago { get; set; }       // Débito automático | Tarjeta | CBU | Efectivo
    public decimal? PrimaOG { get; set; }         // prima original de la compañía (interno)
    public int? VendedorId { get; set; }          // usuario que cargó la póliza
    public string? Cobertura { get; set; }        // tipo de cobertura de la póliza
    public Guid TokenPublico { get; set; }        // código no adivinable para la verificación pública (QR)

    // Campos de sólo lectura para listados (provienen de JOINs, no se persisten)
    public string? ClienteNombre { get; set; }
    public string? Patente { get; set; }
    public string? RamoNombre { get; set; }
    public int? CuotasTotal { get; set; }
    public int? CuotasPagadas { get; set; }
    public int? CuotasVencidas { get; set; }
    public string? VendedorNombre { get; set; }          // quién cargó la póliza
    public string? ClienteVendedorNombre { get; set; }   // de quién es el cliente (su vendedor)
}

public class EndosoTitular
{
    public int Id { get; set; }
    public int PolizaId { get; set; }
    public DateTime FechaEndoso { get; set; }
    public int ClienteAnteriorId { get; set; }
    public string ClienteAnteriorNombre { get; set; } = string.Empty;
    public string? ClienteAnteriorDocumento { get; set; }
    public int ClienteNuevoId { get; set; }
    public string ClienteNuevoNombre { get; set; } = string.Empty;
    public string? ClienteNuevoDocumento { get; set; }
    public string? UsuarioNombre { get; set; }
    public string? Motivo { get; set; }
}

public class Ramo
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}

public class Cobertura
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}

public class Oficina
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}

public class Baja
{
    public int Id { get; set; }
    public int PolizaId { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
    public int Estado { get; set; } // 0=Pendiente 1=Aprobada 2=Rechazada
    public DateTime FechaSolicitud { get; set; }
    public string? NroPoliza { get; set; }
    public string? ClienteNombre { get; set; }
    public string? Solicitante { get; set; }
}

public class AnulacionCobro
{
    public int Id { get; set; }
    public int CobroId { get; set; }
    public string? Motivo { get; set; }
    public DateTime FechaSolicitud { get; set; }
    public int NumeroCuota { get; set; }
    public decimal Monto { get; set; }
    public string? NroPoliza { get; set; }
    public string? ClienteNombre { get; set; }
    public string? Solicitante { get; set; }
    // Sólo para el historial:
    public int Estado { get; set; }               // 0=Pendiente 1=Aprobada 2=Rechazada
    public DateTime? FechaResolucion { get; set; }
    public string? Resolvio { get; set; }
}

/// <summary>Solicitud/registro de eliminación de póliza (con autorización del Admin).</summary>
public class EliminacionPoliza
{
    public int Id { get; set; }
    public int PolizaId { get; set; }
    public string? PolizaNumero { get; set; }
    public string? ClienteNombre { get; set; }
    public string? Patente { get; set; }
    public int CantidadCuotas { get; set; }
    public int CuotasPagadas { get; set; }
    public int Estado { get; set; }               // 0=Pendiente 1=EnPapelera 2=Rechazada 3=Restaurada 4=BorradaDefinitiva
    public string? Motivo { get; set; }
    public DateTime FechaSolicitud { get; set; }
    public DateTime? FechaResolucion { get; set; }
    public DateTime? FechaEliminacion { get; set; }
    public string? Solicitante { get; set; }
    public string? Resolvio { get; set; }
}

public class Cobro
{
    public int Id { get; set; }
    public int PolizaId { get; set; }
    public int NumeroCuota { get; set; }
    public DateTime FechaVencimiento { get; set; }
    public decimal Monto { get; set; }
    public EstadoCobro Estado { get; set; }
    public DateTime? FechaPago { get; set; }
    public int? MetodoPagoId { get; set; }
    public int? MetodoPago2Id { get; set; }   // segundo método (opcional, ej. parte efectivo + parte transferencia)
    public decimal? MetodoPago2Monto { get; set; }   // cuánto se pagó con el 2° método (el resto va al principal)

    // Campos de sólo lectura para listados (provienen de JOINs, no se persisten)
    public string? NroPoliza { get; set; }
    public string? ClienteNombre { get; set; }
    public string? CobradorNombre { get; set; }   // quién registró el cobro (admin)
}

public class MetodoPago
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}

public class SolicitudReset
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Email { get; set; } = string.Empty;
    public int Estado { get; set; } // 0=Pendiente 1=Autorizada 2=Completada 3=Rechazada
    public DateTime FechaSolicitud { get; set; }
    public string? UsuarioNombre { get; set; }
    public string? Rol { get; set; }
}

public class AuditoriaCambio
{
    public int Id { get; set; }
    public string Tabla { get; set; } = string.Empty;
    public int RegistroId { get; set; }
    public string Campo { get; set; } = string.Empty;
    public string? ValorAnterior { get; set; }
    public string? ValorNuevo { get; set; }
    public int UsuarioId { get; set; }
    public DateTime Fecha { get; set; }
}

public class Movimiento
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Tipo { get; set; } = "egreso";   // ingreso | egreso
    public decimal Monto { get; set; }
    public string? Categoria { get; set; }
    public string? Descripcion { get; set; }
    public DateTime Fecha { get; set; }
}

public class Usuario
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Rol { get; set; } = "Productor";
    public bool Activo { get; set; } = true;
    public DateTime FechaAlta { get; set; }
    public int? OficinaId { get; set; }
    public string? OficinaNombre { get; set; }
}

public class RefreshToken
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime Expiracion { get; set; }
    public bool Revocado { get; set; }
    public DateTime FechaCreado { get; set; }
}
