using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Domain;

namespace AmrProdSeg.API.Application.Interfaces;

public interface IPolizaService
{
    Task<PolizaDto> CrearAsync(CrearPolizaDto dto, int? usuarioId = null);
    Task<RenovacionResultDto> RenovarAsync(int polizaOrigenId, RenovarPolizaDto dto, int? usuarioId = null);
    Task<PolizaDto?> GetByIdAsync(int id);
    Task<PolizaDto?> GetActivaPorPatenteAsync(string patente);
    Task<PagedResult<PolizaDto>> ListarAsync(int? clienteId, int? estado, int page, int pageSize, int? usuarioId = null, bool esAdmin = false);
    Task ActualizarAsync(int id, ActualizarPolizaDto dto);
    Task AsignarNumeroAsync(int id, string numero);
    Task CancelarAsync(int id);
    Task<byte[]> GenerarPdfAsync(int id);
}

public interface ICobroService
{
    Task<List<Cobro>> GetPorPolizaAsync(int polizaId);
    Task<List<Cobro>> GetPendientesMesAsync(int mes, int anio);
    Task PagarAsync(int id, DateTime fechaPago, int? metodoPagoId, int? usuarioId = null, int? metodoPago2Id = null, decimal? metodoPago2Monto = null);
    Task MarcarVencidosAsync();
    Task<EnviarComprobanteResultDto> EnviarComprobanteAsync(int cobroId, string canal, int usuarioId);
    Task<(byte[] Pdf, string NombreArchivo)> GenerarComprobanteImpresionAsync(int cobroId);
    Task<(byte[] Pdf, string NombreArchivo)> GenerarTicketImpresionAsync(int cobroId);
    Task<(byte[] Pdf, string NombreArchivo)> GenerarComprobanteOnlineAsync(int cobroId);
}

public interface IConfiguracionService
{
    Task<SmtpConfigDto> GetSmtpAsync(int usuarioId);
    Task ActualizarSmtpAsync(int usuarioId, ActualizarSmtpDto dto);
    /// <summary>Config SMTP efectiva del usuario (la suya o la del Admin como fallback), incluye la clave — uso del sender. usuarioId null = Admin/global.</summary>
    Task<AmrProdSeg.API.Infrastructure.Notifications.SmtpOptions> GetSmtpEffectiveAsync(int? usuarioId);

    Task<EvolutionConfigDto> GetEvolutionAsync(int usuarioId);
    Task ActualizarEvolutionAsync(int usuarioId, ActualizarEvolutionDto dto);
    /// <summary>Config Evolution efectiva del usuario (la suya o la del Admin como fallback), incluye la ApiKey — uso del sender. usuarioId null = Admin/global.</summary>
    Task<AmrProdSeg.API.Infrastructure.Notifications.EvolutionOptions> GetEvolutionEffectiveAsync(int? usuarioId);
}

public interface IMovimientoService
{
    Task<int> CrearAsync(int usuarioId, CrearMovimientoDto dto);
    Task<List<Movimiento>> GetPorUsuarioAsync(int usuarioId, DateTime? desde, DateTime? hasta);
    Task EliminarAsync(int id, int usuarioId);
}

public interface IAnulacionService
{
    Task<AnularPagoResultDto> AnularOSolicitarAsync(int cobroId, int usuarioId, bool esAdmin, string? motivo);
    Task<List<AnulacionCobro>> GetPendientesAsync();
    Task<List<AnulacionCobro>> GetHistorialAsync();
    Task AprobarAsync(int id, int adminId);
    Task RechazarAsync(int id, int adminId);
}

public interface IEliminacionService
{
    Task<EliminarPolizaResultDto> EliminarOSolicitarAsync(int polizaId, int usuarioId, bool esAdmin, string? motivo);
    Task<List<EliminacionPoliza>> GetPendientesAsync();
    Task<List<EliminacionPoliza>> GetHistorialAsync();
    Task AprobarAsync(int id, int adminId);
    Task RechazarAsync(int id, int adminId);
    // Papelera
    Task<List<EliminacionPoliza>> GetPapeleraAsync();
    Task RestaurarAsync(int polizaId, int adminId);
    Task BorrarDefinitivoAsync(int polizaId, int adminId);
}

public interface IClienteService
{
    Task<int> CrearAsync(CrearClienteDto dto, int? usuarioId = null);
    Task ActualizarAsync(int id, ActualizarClienteDto dto);
    Task ActualizarDocumentoAsync(int id, string nuevoDocumento, int usuarioId);
    Task<Cliente?> GetByIdAsync(int id);
    Task<PagedResult<Cliente>> BuscarAsync(string termino, int page, int pageSize, int? usuarioId = null, bool esAdmin = false);
}

public interface IOficinaService
{
    Task<int> CrearAsync(CrearOficinaDto dto);
    Task<List<Oficina>> GetAllAsync();
    Task EliminarAsync(int id);
    Task CompartirClienteAsync(int clienteId, int oficinaId);
    Task DescompartirClienteAsync(int clienteId, int oficinaId);
    Task<List<Oficina>> GetOficinasDeClienteAsync(int clienteId);
}

public interface IVehiculoService
{
    Task<int> CrearAsync(CrearVehiculoDto dto);
    Task ActualizarAsync(int id, ActualizarVehiculoDto dto);
    Task<List<Vehiculo>> GetPorClienteAsync(int clienteId);
    Task<Vehiculo?> GetByPatenteAsync(string patente);
}

public interface ICompaniaService
{
    Task<int> CrearAsync(CrearCompaniaDto dto);
    Task<List<Compania>> GetAllAsync();
    Task EliminarAsync(int id);
}

public interface IMetodoPagoService
{
    Task<int> CrearAsync(CrearMetodoPagoDto dto);
    Task<List<MetodoPago>> GetAllAsync();
    Task EliminarAsync(int id);
}

public interface IRamoService
{
    Task<int> CrearAsync(CrearRamoDto dto);
    Task<List<Ramo>> GetAllAsync();
    Task EliminarAsync(int id);
}

public interface ICoberturaService
{
    Task<int> CrearAsync(CrearCoberturaDto dto);
    Task<List<Cobertura>> GetAllAsync();
    Task EliminarAsync(int id);
}

public interface IBajaService
{
    Task<int> SolicitarAsync(SolicitarBajaDto dto, int usuarioId);
    Task<List<Baja>> GetAllAsync(int? estado);
    Task AprobarAsync(int id, int adminId);
    Task RechazarAsync(int id, int adminId);
}

public interface IAuthService
{
    Task<LoginResultDto> LoginAsync(LoginDto dto);
    Task<LoginResultDto> RefreshAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
    Task SolicitarResetAsync(string email);
    Task ConfirmarResetAsync(string email, string nuevaPassword);
}

public interface IUsuarioService
{
    Task<int> CrearAsync(CrearUsuarioDto dto);
    Task CambiarPasswordAsync(int usuarioId, CambiarPasswordDto dto);
    Task<List<UsuarioDto>> GetAllAsync();
    Task<List<SolicitudReset>> GetSolicitudesResetAsync();
    Task AutorizarResetAsync(int id, int adminId);
    Task AsignarOficinaAsync(int usuarioId, int? oficinaId);
    Task EliminarAsync(int id);
}

public interface IAuditoriaService
{
    Task<List<AuditoriaCambio>> GetPorRegistroAsync(string tabla, int registroId);
}

public interface IVerificacionService
{
    /// <summary>Datos públicos de la póliza para la web de verificación (QR). Null si no existe.</summary>
    Task<VerificacionDto?> GetAsync(Guid token);
}

public interface IAltaService
{
    Task<AltaResultDto> RegistrarAsync(AltaAseguradoDto dto, int? usuarioId = null);
}

public interface IEndosoService
{
    /// <summary>Cambia el titular de la póliza guardando el anterior. No modifica nada más de la póliza.</summary>
    Task<EndosoResultDto> EndosarTitularAsync(int polizaId, EndosoTitularDto dto, int? usuarioId = null);
    Task<List<EndosoHistorialDto>> GetHistorialAsync(int polizaId);
}

public interface IReporteService
{
    Task<List<CobroPeriodoDto>> CobrosPeriodoAsync(int mes, int anio, int? estado, int? companiaId);
    Task<EstadoCuentaDto> EstadoCuentaAsync(int clienteId);
    Task<List<DeudaAcumuladaDto>> DeudaAcumuladaAsync();
    Task<List<PolizaPorVencerDto>> PolizasPorVencerAsync(int dias, int? companiaId);
    Task<List<VencidaSinRenovarDto>> VencidasSinRenovarAsync();
    Task<List<CarteraCompaniaDto>> CarteraPorCompaniaAsync();
    Task<ProduccionMensualDto> ProduccionMensualAsync(int mes, int anio);
    Task<List<IngresoProyectadoDto>> IngresosProyectadosAsync(int meses);
    Task<List<PagoRecibidoDto>> PagosRecibidosAsync(DateTime desde, DateTime hasta, int? companiaId, int? oficinaId = null, int? vendedorId = null, string? vendedorRol = null);
    Task<List<CarteraExportDto>> CarteraExportAsync(int? vendedorId);
}

public interface IPdfService
{
    Task<byte[]> GenerarComprobanteAsync(Poliza poliza);
    Task<string> GenerarComprobantePdfAsync(Poliza poliza);
    byte[] GenerarTabla(string titulo, List<Dictionary<string, object?>> filas);
    /// <summary>Online: comprobante (1ª hoja) + ticket (2ª hoja) en un PDF, con los datos del cobro.</summary>
    byte[] GenerarComprobanteCobro(ComprobanteCobroDto dto);
    /// <summary>Impresión: solo el comprobante (1ª hoja) con talón recortable.</summary>
    byte[] GenerarComprobanteImpresion(ComprobanteCobroDto dto);
    /// <summary>Impresión: solo el ticket (2ª hoja), sin logo.</summary>
    byte[] GenerarTicketImpresion(ComprobanteCobroDto dto);
}

public interface IExcelExportService
{
    byte[] Exportar(string hoja, List<Dictionary<string, object?>> filas);
}
