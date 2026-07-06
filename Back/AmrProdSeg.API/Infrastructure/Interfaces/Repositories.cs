using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Interfaces;

public interface IDbConnectionFactory
{
    SqlConnection Create();
}

public interface IPolizaRepository
{
    Task<Poliza?> GetByIdAsync(int id);
    Task<Poliza?> GetByTokenAsync(Guid token);
    Task<int> InsertarAsync(Poliza p);
    Task<Poliza?> GetActivaPorVehiculoAsync(int vehiculoId);
    Task CambiarEstadoAsync(int id, EstadoPoliza estado);
    Task<List<Poliza>> BuscarAsync(string termino, int page, int pageSize);
    Task<(List<Poliza> Items, int Total)> ListarAsync(int? clienteId, int? estado, int page, int pageSize, int? usuarioId = null, bool esAdmin = false);
    Task ActualizarAsync(Poliza p);
    Task<int> AsignarNumeroAsync(int id, string numero);
}

public interface ICobroRepository
{
    Task InsertarLoteAsync(IEnumerable<Cobro> cobros);
    Task MarcarPagadoAsync(int id, DateTime fechaPago, int? metodoPagoId, int? registradoPor = null, int? metodoPago2Id = null, decimal? metodoPago2Monto = null);
    Task<Cobro?> GetByIdAsync(int id);
    Task<List<Cobro>> GetPendientesMesAsync(int mes, int anio);
    Task<List<Cobro>> GetPorPolizaAsync(int polizaId);
    Task MarcarVencidosAsync();
    /// <summary>Recalcula el monto de las cuotas NO pagadas al nuevo precio (las pagadas no se tocan).</summary>
    Task RecalcularPendientesAsync(int polizaId, decimal precioTotal, int cantidadCuotas);
}

public interface IClienteRepository
{
    Task<int> InsertarAsync(Cliente c);
    Task ActualizarAsync(Cliente c);
    Task ActualizarDocumentoAsync(int id, string nuevoDocumento, int usuarioId);
    Task<Cliente?> GetByIdAsync(int id);
    Task<(List<Cliente> Items, int Total)> BuscarAsync(string termino, int page, int pageSize, int? usuarioId = null, bool esAdmin = false);
    Task<Cliente?> VerificarDocumentoAsync(string documento);
}

public interface IVehiculoRepository
{
    Task<int> InsertarAsync(Vehiculo v);
    Task ActualizarAsync(Vehiculo v);
    Task<List<Vehiculo>> GetPorClienteAsync(int clienteId);
    Task<Vehiculo?> GetByPatenteAsync(string patente);
}

public interface ICompaniaRepository
{
    Task<int> InsertarAsync(Compania c);
    Task<List<Compania>> GetAllAsync();
    Task<Compania?> GetByIdAsync(int id);
    Task<int> EliminarAsync(int id);
}

public interface IMetodoPagoRepository
{
    Task<int> InsertarAsync(string nombre);
    Task<List<MetodoPago>> GetAllAsync();
    Task<int> EliminarAsync(int id);
}

public interface IRamoRepository
{
    Task<int> InsertarAsync(string nombre);
    Task<List<Ramo>> GetAllAsync();
    Task<int> EliminarAsync(int id);
}

public interface ICoberturaRepository
{
    Task<int> InsertarAsync(string nombre);
    Task<List<Cobertura>> GetAllAsync();
    Task<int> EliminarAsync(int id);
}

public interface IOficinaRepository
{
    Task<int> InsertarAsync(string nombre);
    Task<List<Oficina>> GetAllAsync();
    Task<int> EliminarAsync(int id);
    Task CompartirClienteAsync(int clienteId, int oficinaId);
    Task DescompartirClienteAsync(int clienteId, int oficinaId);
    Task<List<Oficina>> GetOficinasDeClienteAsync(int clienteId);
}

public interface IBajaRepository
{
    Task<int> SolicitarAsync(int polizaId, string motivo, string? observaciones, int usuarioId);
    Task<List<Baja>> GetAllAsync(int? estado);
    Task<bool> AprobarAsync(int id, int adminId);
    Task<bool> RechazarAsync(int id, int adminId);
}

public interface IAuthRepository
{
    Task<Usuario?> GetUsuarioByEmailAsync(string email);
    Task<Usuario?> GetUsuarioByIdAsync(int id);
    Task GuardarRefreshTokenAsync(int usuarioId, string token, DateTime expiracion);
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task RevocarRefreshTokenAsync(string token);
}

public interface IUsuarioRepository
{
    Task<int> InsertarAsync(string nombre, string email, string passwordHash, string rol);
    Task CambiarPasswordAsync(int id, string passwordHash);
    Task<List<Usuario>> GetAllAsync();
    Task AsignarOficinaAsync(int usuarioId, int? oficinaId);
    Task<int?> GetOficinaIdAsync(int usuarioId);
    Task<int> EliminarAsync(int id);
}

public interface IAuditoriaRepository
{
    Task<List<AuditoriaCambio>> GetPorRegistroAsync(string tabla, int registroId);
}

public interface IResetRepository
{
    Task SolicitarAsync(int usuarioId, string email);
    Task<List<SolicitudReset>> GetPendientesAsync();
    Task<bool> AutorizarAsync(int id, int adminId);
    Task<SolicitudReset?> GetAutorizadaPorEmailAsync(string email);
    Task CompletarAsync(int id);
}

public interface IAltaRepository
{
    /// <summary>
    /// Inserta cliente, vehículo, póliza y sus cuotas en una única transacción.
    /// Si algo falla, hace rollback completo. Las cuotas se generan con el
    /// PolizaId recién creado vía <paramref name="cuotasFactory"/>.
    /// </summary>
    Task<(int ClienteId, int? VehiculoId, int PolizaId)> AltaCompletaAsync(
        Cliente cliente, Vehiculo? vehiculo, Poliza poliza,
        Func<int, IEnumerable<Cobro>> cuotasFactory);
}

public interface IEndosoRepository
{
    /// <summary>
    /// Cambia el titular de una póliza en una única transacción: si el cliente nuevo
    /// tiene Id 0 lo inserta (si no, lo reutiliza), registra el endoso guardando el
    /// titular anterior, actualiza el titular de la póliza y mueve el vehículo al nuevo
    /// titular. Devuelve el Id del nuevo titular.
    /// </summary>
    Task<int> EndosarTitularAsync(
        int polizaId, int titularAnteriorId, Cliente clienteNuevo,
        int? vehiculoId, int? usuarioId, string? motivo);

    Task<List<EndosoTitular>> GetPorPolizaAsync(int polizaId);
}

public interface INotificacionRepository
{
    Task<List<PolizaVencimiento>> GetPolizasPorVencerAsync(int dias);
    Task<List<CuotaVencimiento>> GetCuotasPorVencerAsync(int dias);
    Task<bool> YaEnviadaAsync(string tipo, int referenciaId, string canal);
    Task RegistrarAsync(string tipo, int referenciaId, string canal, string? destino);
}

public interface IConfiguracionRepository
{
    Task<Dictionary<string, string?>> GetByUsuarioAsync(int usuarioId);
    Task SetAsync(int usuarioId, string clave, string? valor);
    /// <summary>Id del Admin (fallback de la config para usuarios que no cargaron la suya).</summary>
    Task<int> GetAdminIdAsync();
}

public interface IMovimientoRepository
{
    Task<int> InsertarAsync(Movimiento m);
    Task<List<Movimiento>> GetPorUsuarioAsync(int usuarioId, DateTime? desde, DateTime? hasta);
    Task<int> EliminarAsync(int id, int usuarioId);
}

public interface IAnulacionRepository
{
    Task<int> AnularPagoDirectoAsync(int cobroId);
    Task<int> SolicitarAsync(int cobroId, int usuarioId, string? motivo);
    Task<List<AnulacionCobro>> GetPendientesAsync();
    Task<List<AnulacionCobro>> GetHistorialAsync();
    Task<int> AprobarAsync(int id, int adminId);
    Task<int> RechazarAsync(int id, int adminId);
}

public interface IEliminacionRepository
{
    Task<(int Id, bool YaExistia)> SolicitarAsync(int polizaId, int usuarioId, string? motivo);
    Task<int> AprobarAsync(int id, int adminId);
    Task<int> RechazarAsync(int id, int adminId);
    Task<List<EliminacionPoliza>> GetPendientesAsync();
    Task<List<EliminacionPoliza>> GetHistorialAsync();
    // Papelera
    Task<List<EliminacionPoliza>> GetPapeleraAsync();
    Task<int> RestaurarAsync(int polizaId, int adminId);
    Task<int> BorrarDefinitivoAsync(int polizaId, int adminId);
}

/// <summary>Envío de correo (SMTP propio).</summary>
public interface IEmailSender
{
    bool Habilitado { get; }   // config del Admin/global (para jobs del sistema)
    /// <summary>¿El envío por email está habilitado para ese usuario (o el Admin si null)?</summary>
    Task<bool> HabilitadoParaAsync(int? usuarioId);
    Task EnviarAsync(string destino, string asunto, string cuerpo, int? usuarioId = null);
    /// <summary>Envía un correo con un archivo adjunto (ej. el comprobante en PDF), desde la config del usuario.</summary>
    Task EnviarConAdjuntoAsync(string destino, string asunto, string cuerpo, byte[] adjunto, string nombreArchivo, int? usuarioId = null);
}

/// <summary>Envío de WhatsApp (Evolution API). Desactivado hasta completar configuración.</summary>
public interface IWhatsAppSender
{
    bool Habilitado { get; }   // config del Admin/global (para jobs del sistema)
    /// <summary>¿El envío por WhatsApp está habilitado para ese usuario (o el Admin si null)?</summary>
    Task<bool> HabilitadoParaAsync(int? usuarioId);
    Task EnviarAsync(string telefono, string mensaje, int? usuarioId = null);
    /// <summary>Envía un documento (ej. el comprobante en PDF) con un texto opcional, desde la config del usuario.</summary>
    Task EnviarDocumentoAsync(string telefono, byte[] documento, string nombreArchivo, string caption, int? usuarioId = null);
}

public interface IReporteRepository
{
    Task<List<Dictionary<string, object?>>> EjecutarAsync(
        string storedProcedure, params (string Nombre, object? Valor)[] parametros);

    Task<(List<Dictionary<string, object?>> Detalle, Dictionary<string, object?>? Totales)> EjecutarDetalleTotalesAsync(
        string storedProcedure, params (string Nombre, object? Valor)[] parametros);
}
