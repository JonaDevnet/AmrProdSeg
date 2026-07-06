namespace AmrProdSeg.API.Application.DTOs;

// ---------- Resultado paginado genérico ----------
public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

// ---------- Auditoría ----------
public class ActualizarDocumentoDto
{
    public string Documento { get; set; } = string.Empty;
}

// ---------- Usuarios ----------
public class CrearUsuarioDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Rol { get; set; } = "Productor";
}

public class CambiarPasswordDto
{
    public string PasswordActual { get; set; } = string.Empty;
    public string PasswordNuevo { get; set; } = string.Empty;
}

public class UsuarioDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public DateTime FechaAlta { get; set; }
    public int? OficinaId { get; set; }
    public string? OficinaNombre { get; set; }
}

// ---------- Pólizas ----------
public class CrearPolizaDto
{
    public int ClienteId { get; set; }
    public int? VehiculoId { get; set; }
    public int CompaniaId { get; set; }
    public int? RamoId { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public decimal PrecioTotal { get; set; }
    public int CantidadCuotas { get; set; }
    public string? Cobertura { get; set; }
}

public class ActualizarPolizaDto
{
    public int CompaniaId { get; set; }
    public int? RamoId { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public decimal PrecioTotal { get; set; }
    public int CantidadCuotas { get; set; }
    public string? FormaPago { get; set; }
    public decimal? PrimaOG { get; set; }
    public string? Cobertura { get; set; }
}

public class AsignarNumeroDto
{
    public string Numero { get; set; } = string.Empty;
}

public class RenovarPolizaDto
{
    public int? CompaniaId { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public decimal PrecioTotal { get; set; }
    public int CantidadCuotas { get; set; }
    public decimal? PrimaOG { get; set; }
    public string? Cobertura { get; set; }   // por defecto la de la póliza original
}

public class PolizaDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public int ClienteId { get; set; }
    public int? VehiculoId { get; set; }
    public int CompaniaId { get; set; }
    public int? RamoId { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public decimal PrecioTotal { get; set; }
    public int CantidadCuotas { get; set; }
    public string Estado { get; set; } = string.Empty;
    public int? PolizaOrigenId { get; set; }
    public DateTime FechaEmision { get; set; }
    public string? FormaPago { get; set; }
    public decimal? PrimaOG { get; set; }
    public string? Cobertura { get; set; }
    public string? ClienteNombre { get; set; }
    public string? Patente { get; set; }
    public string? RamoNombre { get; set; }
    public int? CuotasTotal { get; set; }
    public int? CuotasPagadas { get; set; }
    public int? CuotasVencidas { get; set; }
    public string? VendedorNombre { get; set; }          // quién cargó la póliza (admin)
    public string? ClienteVendedorNombre { get; set; }   // de quién es el cliente
}

public class RenovacionResultDto
{
    public int NuevaPolizaId { get; set; }
    public string PdfUrl { get; set; } = string.Empty;
}

// ---------- Clientes ----------
public class CrearClienteDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public string? TipoDocumento { get; set; }
}

public class ActualizarClienteDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public string? TipoDocumento { get; set; }
}

// ---------- Vehículos ----------
public class CrearVehiculoDto
{
    public int ClienteId { get; set; }
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public short Anio { get; set; }
    public string Patente { get; set; } = string.Empty;
    public string? Chasis { get; set; }
    public string? Motor { get; set; }
    public string? TipoCobertura { get; set; }
    public string? Combustion { get; set; }
}

public class ActualizarVehiculoDto
{
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public short Anio { get; set; }
    public string? Chasis { get; set; }
    public string? Motor { get; set; }
    public string? TipoCobertura { get; set; }
    public string? Combustion { get; set; }
}

// ---------- Compañías ----------
public class CrearCompaniaDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? CUIT { get; set; }
    public string? Telefono { get; set; }
    public string? LogoUrl { get; set; }
    public string? Color { get; set; }
}

// ---------- Cobros ----------
public class MarcarPagoDto
{
    public DateTime FechaPago { get; set; } = DateTime.UtcNow;
    public int? MetodoPagoId { get; set; }    // obligatorio (validado en el servicio)
    public int? MetodoPago2Id { get; set; }   // segundo método opcional (pago mixto)
    public decimal? MetodoPago2Monto { get; set; }   // monto pagado con el 2° método
}

// ---------- Métodos de pago ----------
public class CrearMetodoPagoDto
{
    public string Nombre { get; set; } = string.Empty;
}

// ---------- Configuración SMTP (editable por Admin) ----------
public class SmtpConfigDto
{
    public bool Habilitado { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UsarSsl { get; set; } = true;
    public string Usuario { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string FromNombre { get; set; } = string.Empty;
    public bool PasswordConfigurada { get; set; }   // no se devuelve la clave, solo si está cargada
}

public class ActualizarSmtpDto
{
    public bool Habilitado { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UsarSsl { get; set; } = true;
    public string Usuario { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string FromNombre { get; set; } = string.Empty;
    public string? Password { get; set; }            // null/empty = mantener la actual
}

// ---------- Configuración WhatsApp / Evolution (editable por Admin) ----------
public class EvolutionConfigDto
{
    public bool Habilitado { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
    public string Instance { get; set; } = string.Empty;
    public bool ApiKeyConfigurada { get; set; }   // no se devuelve la clave, solo si está cargada
}

public class ActualizarEvolutionDto
{
    public bool Habilitado { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
    public string Instance { get; set; } = string.Empty;
    public string? ApiKey { get; set; }            // null/empty = mantener la actual
}

/// <summary>Prueba de envío: manda un WhatsApp de test al número indicado con la config guardada.</summary>
public class ProbarWhatsappDto
{
    public string Telefono { get; set; } = string.Empty;
}

public class ProbarWhatsappResultDto
{
    public bool Ok { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}

// ---------- Movimientos (finanzas personales) ----------
public class CrearMovimientoDto
{
    public string Tipo { get; set; } = "egreso";   // ingreso | egreso
    public decimal Monto { get; set; }
    public string? Categoria { get; set; }
    public string? Descripcion { get; set; }
    public DateTime Fecha { get; set; }
}

// ---------- Anulación de pago ----------
public class AnularPagoDto
{
    public string? Motivo { get; set; }
}

public class AnularPagoResultDto
{
    public bool Anulada { get; set; }     // revertida en el acto (Admin)
    public bool Solicitada { get; set; }  // queda pendiente de aprobación (Productor)
    public string Mensaje { get; set; } = string.Empty;
}

// ---------- Eliminación de póliza ----------
public class EliminarPolizaDto
{
    public string? Motivo { get; set; }
}

public class EliminarPolizaResultDto
{
    public bool Eliminada { get; set; }   // ejecutada en el acto (Admin)
    public bool Solicitada { get; set; }  // queda pendiente de autorización (Productor)
    public string Mensaje { get; set; } = string.Empty;
}

// ---------- Envío de comprobante ----------
public class EnviarComprobanteDto
{
    public string Canal { get; set; } = "email";   // "email" | "whatsapp"
}

public class EnviarComprobanteResultDto
{
    public bool Enviado { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}

/// <summary>Datos públicos que muestra la web de verificación (al escanear el QR).</summary>
public class VerificacionDto
{
    public string ClienteNombre { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;   // enmascarado (ej. 12***032)
    public string Compania { get; set; } = string.Empty;
    public string NroPoliza { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Patente { get; set; } = string.Empty;
    public string Anio { get; set; } = string.Empty;
    public string Cobertura { get; set; } = string.Empty;
    public bool Vigente { get; set; }
    public DateTime? ProximoVencimiento { get; set; }
}

/// <summary>Datos para generar el comprobante de pago en PDF (comprobante + recibo).</summary>
public class ComprobanteCobroDto
{
    public string ReciboNumero { get; set; } = string.Empty;
    public DateTime FechaPago { get; set; }
    public string PolizaNumero { get; set; } = string.Empty;
    public string Compania { get; set; } = string.Empty;
    public string Asegurado { get; set; } = string.Empty;
    public string RiesgoAsegurado { get; set; } = string.Empty;
    public string Dominio { get; set; } = string.Empty;
    public string Anio { get; set; } = string.Empty;
    public int CuotaActual { get; set; }
    public int CuotasTotal { get; set; }
    public DateTime? ProxVencimiento { get; set; }
    public decimal Importe { get; set; }
    public string Cobertura { get; set; } = string.Empty;
    public string MedioPago { get; set; } = string.Empty;
    public string QrUrl { get; set; } = string.Empty;
}

// ---------- Alta de asegurado (wizard atómico: cliente + vehículo + póliza) ----------
public class AltaAseguradoDto
{
    // Cliente
    public string ClienteNombre { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }

    public string? TipoDocumento { get; set; }   // DNI | CUIL | CUIT | Pasaporte

    // Vehículo (opcional: solo ramos que lo requieren, p. ej. Automotor/Motovehículo)
    public string? Marca { get; set; }
    public string? Modelo { get; set; }
    public short? Anio { get; set; }
    public string? Patente { get; set; }
    public string? Chasis { get; set; }
    public string? Motor { get; set; }
    public string? TipoCobertura { get; set; }
    public string? Combustion { get; set; }       // "Nafta", "Nafta / GNC", etc.

    // Póliza
    public int CompaniaId { get; set; }
    public int? RamoId { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public decimal PrecioTotal { get; set; }
    public int CantidadCuotas { get; set; }
    public string? FormaPago { get; set; }        // Débito automático | Tarjeta | CBU | Efectivo
    public decimal? PrimaOG { get; set; }          // prima original de la compañía (interno)
}

public class AltaResultDto
{
    public int ClienteId { get; set; }
    public int? VehiculoId { get; set; }
    public int PolizaId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string PdfUrl { get; set; } = string.Empty;
}

// ---------- Endoso de titular ----------
/// <summary>Datos del nuevo titular para el endoso (los mismos que al dar de alta un cliente).</summary>
public class EndosoTitularDto
{
    public string ClienteNombre { get; set; } = string.Empty;
    public string Documento { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public string? TipoDocumento { get; set; }   // DNI | CUIL | CUIT | Pasaporte
    public string? Motivo { get; set; }
}

public class EndosoResultDto
{
    public int PolizaId { get; set; }
    public int NuevoClienteId { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}

/// <summary>Fila del historial de endosos (titulares anteriores) de una póliza.</summary>
public class EndosoHistorialDto
{
    public int Id { get; set; }
    public DateTime FechaEndoso { get; set; }
    public string ClienteAnteriorNombre { get; set; } = string.Empty;
    public string? ClienteAnteriorDocumento { get; set; }
    public string ClienteNuevoNombre { get; set; } = string.Empty;
    public string? ClienteNuevoDocumento { get; set; }
    public string? UsuarioNombre { get; set; }
    public string? Motivo { get; set; }
}

public class CrearRamoDto
{
    public string Nombre { get; set; } = string.Empty;
}

public class CrearCoberturaDto
{
    public string Nombre { get; set; } = string.Empty;
}

// ---------- Oficinas ----------
public class CrearOficinaDto
{
    public string Nombre { get; set; } = string.Empty;
}

public class AsignarOficinaDto
{
    public int? OficinaId { get; set; }
}

public class CompartirClienteDto
{
    public int OficinaId { get; set; }
}

public class SolicitarBajaDto
{
    public int PolizaId { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string? Observaciones { get; set; }
}

// ---------- Auth ----------
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResultDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
}

public class RefreshRequestDto
{
    public string RefreshToken { get; set; } = string.Empty;
}

public class SolicitarResetDto
{
    public string Email { get; set; } = string.Empty;
}

public class ConfirmarResetDto
{
    public string Email { get; set; } = string.Empty;
    public string NuevaPassword { get; set; } = string.Empty;
}
