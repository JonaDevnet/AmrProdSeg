using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.Tests;

/// <summary>Fakes en memoria configurables para testear los servicios sin BD.</summary>

public class FakePolizaRepository : IPolizaRepository
{
    public Poliza? PolizaPorId;
    public Poliza? PolizaActivaPorVehiculo;
    public int InsertarLlamadas;
    public EstadoPoliza? UltimoEstadoCambiado;

    public Task<Poliza?> GetByIdAsync(int id) => Task.FromResult(PolizaPorId);
    public Task<Poliza?> GetByTokenAsync(Guid token) => Task.FromResult(PolizaPorId);
    public Task<int> InsertarAsync(Poliza p) { InsertarLlamadas++; return Task.FromResult(99); }
    public Task<Poliza?> GetActivaPorVehiculoAsync(int vehiculoId) => Task.FromResult(PolizaActivaPorVehiculo);
    public Task CambiarEstadoAsync(int id, EstadoPoliza estado) { UltimoEstadoCambiado = estado; return Task.CompletedTask; }
    public Task<List<Poliza>> BuscarAsync(string termino, int page, int pageSize) => Task.FromResult(new List<Poliza>());
    public Task<(List<Poliza> Items, int Total)> ListarAsync(int? clienteId, int? estado, int page, int pageSize, int? usuarioId = null, bool esAdmin = false, string? termino = null, string? campo = null)
        => Task.FromResult((new List<Poliza>(), 0));
    public Task ActualizarAsync(Poliza p) => Task.CompletedTask;
    public Task<int> AsignarNumeroAsync(int id, string numero) => Task.FromResult(1);
}

public class FakeCobroRepository : ICobroRepository
{
    public Cobro? CobroPorId;
    public int MarcarPagadoLlamadas;

    public Task InsertarLoteAsync(IEnumerable<Cobro> cobros) => Task.CompletedTask;
    public Task MarcarPagadoAsync(int id, DateTime fechaPago, int? metodoPagoId, int? registradoPor = null, int? metodoPago2Id = null, decimal? metodoPago2Monto = null) { MarcarPagadoLlamadas++; return Task.CompletedTask; }
    public Task<Cobro?> GetByIdAsync(int id) => Task.FromResult(CobroPorId);
    public Task<List<Cobro>> GetPendientesMesAsync(int mes, int anio) => Task.FromResult(new List<Cobro>());
    public Task<List<Cobro>> GetPorPolizaAsync(int polizaId) => Task.FromResult(new List<Cobro>());
    public Task MarcarVencidosAsync() => Task.CompletedTask;
    public Task RegenerarPendientesAsync(int polizaId, decimal precioTotal, int cantidadCuotas, DateTime primerVencimiento) => Task.CompletedTask;
}

public class FakeVehiculoRepository : IVehiculoRepository
{
    public Vehiculo? PorPatente;
    public int InsertarLlamadas;

    public Task<int> InsertarAsync(Vehiculo v) { InsertarLlamadas++; return Task.FromResult(7); }
    public Task ActualizarAsync(Vehiculo v) => Task.CompletedTask;
    public Task<List<Vehiculo>> GetPorClienteAsync(int clienteId) => Task.FromResult(new List<Vehiculo>());
    public Task<Vehiculo?> GetByPatenteAsync(string patente) => Task.FromResult(PorPatente);
}

public class FakeClienteRepository : IClienteRepository
{
    public Cliente? PorDocumento;
    public int InsertarLlamadas;

    public Task<int> InsertarAsync(Cliente c) { InsertarLlamadas++; return Task.FromResult(5); }
    public Task ActualizarAsync(Cliente c) => Task.CompletedTask;
    public Task ActualizarDocumentoAsync(int id, string nuevoDocumento, int usuarioId) => Task.CompletedTask;
    public Task<Cliente?> GetByIdAsync(int id) => Task.FromResult<Cliente?>(new Cliente { Id = id });
    public Task<(List<Cliente> Items, int Total)> BuscarAsync(string termino, int page, int pageSize, int? usuarioId = null, bool esAdmin = false)
        => Task.FromResult((new List<Cliente>(), 0));
    public Task<Cliente?> VerificarDocumentoAsync(string documento) => Task.FromResult(PorDocumento);
}

public class FakeUsuarioRepository : IUsuarioRepository
{
    public int? OficinaId;
    public string? PasswordCambiada;
    public Task<int> InsertarAsync(string nombre, string email, string passwordHash, string rol) => Task.FromResult(1);
    public Task CambiarPasswordAsync(int id, string passwordHash) { PasswordCambiada = passwordHash; return Task.CompletedTask; }
    public Task<List<Usuario>> GetAllAsync() => Task.FromResult(new List<Usuario>());
    public Task AsignarOficinaAsync(int usuarioId, int? oficinaId) { OficinaId = oficinaId; return Task.CompletedTask; }
    public Task<int?> GetOficinaIdAsync(int usuarioId) => Task.FromResult(OficinaId);
    public Task<int> EliminarAsync(int id) => Task.FromResult(1);
}

public class FakeCompaniaRepository : ICompaniaRepository
{
    // Por defecto la compañía existe (para no romper validaciones ajenas al test)
    public Compania? PorId = new() { Id = 1, Nombre = "Compañía Test" };

    public Task<int> InsertarAsync(Compania c) => Task.FromResult(1);
    public Task<List<Compania>> GetAllAsync() => Task.FromResult(new List<Compania>());
    public Task<Compania?> GetByIdAsync(int id) => Task.FromResult(PorId);
    public Task<int> EliminarAsync(int id) => Task.FromResult(1);
}

public class FakeEmailSender : IEmailSender
{
    public bool Habilitado { get; set; }
    public Task<bool> HabilitadoParaAsync(int? usuarioId) => Task.FromResult(Habilitado);
    public Task EnviarAsync(string destino, string asunto, string cuerpo, int? usuarioId = null) => Task.CompletedTask;
    public Task EnviarConAdjuntoAsync(string destino, string asunto, string cuerpo, byte[] adjunto, string nombreArchivo, int? usuarioId = null) => Task.CompletedTask;
}

public class FakeWhatsAppSender : IWhatsAppSender
{
    public bool Habilitado { get; set; }
    public bool Fallar { get; set; }   // simula Evolution caído en el envío
    public readonly List<(string Telefono, string Mensaje, int? UsuarioId)> Enviados = new();

    public Task<bool> HabilitadoParaAsync(int? usuarioId) => Task.FromResult(Habilitado);
    public Task EnviarAsync(string telefono, string mensaje, int? usuarioId = null)
    {
        if (Fallar) throw new Exception("Evolution no responde");
        Enviados.Add((telefono, mensaje, usuarioId));
        return Task.CompletedTask;
    }
    public Task EnviarDocumentoAsync(string telefono, byte[] documento, string nombreArchivo, string caption, int? usuarioId = null) => Task.CompletedTask;
}

public class FakeNotificacionRepository : INotificacionRepository
{
    public List<PolizaVencimiento> Polizas = new();
    public List<CuotaVencimiento> CuotasPorVencer = new();
    public List<CuotaVencimiento> CuotasVencidas = new();
    public readonly HashSet<string> Enviadas = new();                                  // "tipo|ref|canal"
    public readonly List<(string Tipo, int Ref, string Canal, string? Destino)> Registros = new();

    public Task<List<PolizaVencimiento>> GetPolizasPorVencerAsync(int dias) => Task.FromResult(Polizas);
    public Task<List<CuotaVencimiento>> GetCuotasPorVencerAsync(int dias) => Task.FromResult(CuotasPorVencer);
    public Task<List<CuotaVencimiento>> GetCuotasVencidasAsync(int dias) => Task.FromResult(CuotasVencidas);

    public Task<bool> YaEnviadaAsync(string tipo, int referenciaId, string canal)
        => Task.FromResult(Enviadas.Contains($"{tipo}|{referenciaId}|{canal}"));

    public Task RegistrarAsync(string tipo, int referenciaId, string canal, string? destino)
    {
        Enviadas.Add($"{tipo}|{referenciaId}|{canal}");
        Registros.Add((tipo, referenciaId, canal, destino));
        return Task.CompletedTask;
    }

    public Task<int> ContarEnviadasHoyAsync(string canal)
        => Task.FromResult(Registros.Count(r => r.Canal == canal));

    // Helper para pre-marcar como ya enviado (idempotencia / tope).
    public void MarcarEnviada(string tipo, int referenciaId, string canal = "WhatsApp")
    {
        Enviadas.Add($"{tipo}|{referenciaId}|{canal}");
        Registros.Add((tipo, referenciaId, canal, "pre"));
    }
}

public class FakePdfService : IPdfService
{
    public Task<byte[]> GenerarComprobanteAsync(Poliza poliza) => Task.FromResult(Array.Empty<byte>());
    public Task<string> GenerarComprobantePdfAsync(Poliza poliza) => Task.FromResult("/comprobantes/test.pdf");
    public byte[] GenerarTabla(string titulo, List<Dictionary<string, object?>> filas) => Array.Empty<byte>();
    public byte[] GenerarComprobanteCobro(ComprobanteCobroDto dto) => Array.Empty<byte>();
    public byte[] GenerarComprobanteImpresion(ComprobanteCobroDto dto) => Array.Empty<byte>();
    public byte[] GenerarTicketImpresion(ComprobanteCobroDto dto) => Array.Empty<byte>();
    public byte[] GenerarDossierCliente(ClienteDossierData data) => Array.Empty<byte>();
}

public class FakeMetodoPagoRepository : IMetodoPagoRepository
{
    public Task<int> InsertarAsync(string nombre) => Task.FromResult(1);
    public Task<List<MetodoPago>> GetAllAsync() => Task.FromResult(new List<MetodoPago>());
    public Task<int> EliminarAsync(int id) => Task.FromResult(1);
}

public class FakeAuthRepository : IAuthRepository
{
    public Usuario? UsuarioPorEmail;
    public Usuario? UsuarioPorId;
    public RefreshToken? RefreshPorToken;
    public int GuardarLlamado;

    public Task<Usuario?> GetUsuarioByEmailAsync(string email) => Task.FromResult(UsuarioPorEmail);
    public Task<Usuario?> GetUsuarioByIdAsync(int id) => Task.FromResult(UsuarioPorId);
    public Task GuardarRefreshTokenAsync(int usuarioId, string token, DateTime expiracion) { GuardarLlamado++; return Task.CompletedTask; }
    public Task<RefreshToken?> GetRefreshTokenAsync(string token) => Task.FromResult(RefreshPorToken);
    public Task RevocarRefreshTokenAsync(string token) => Task.CompletedTask;
}

public class FakeResetRepository : IResetRepository
{
    public SolicitudReset? Autorizada;
    public int SolicitarLlamado;
    public int CompletarLlamado;

    public Task SolicitarAsync(int usuarioId, string email) { SolicitarLlamado++; return Task.CompletedTask; }
    public Task<List<SolicitudReset>> GetPendientesAsync() => Task.FromResult(new List<SolicitudReset>());
    public Task<bool> AutorizarAsync(int id, int adminId) => Task.FromResult(true);
    public Task<SolicitudReset?> GetAutorizadaPorEmailAsync(string email) => Task.FromResult(Autorizada);
    public Task CompletarAsync(int id) { CompletarLlamado++; return Task.CompletedTask; }
}

public class FakeAvisoRepository : IAvisoRepository
{
    public int InsertarLlamado;
    public int? UltimoUsuarioId;
    public int? UltimoPolizaId;
    public string? UltimoPolizaNumero;
    public List<AvisoExportacionDto> Recientes = new();

    public Task InsertarExportacionAsync(int? usuarioId, int? polizaId, string? polizaNumero, string? clienteNombre)
    {
        InsertarLlamado++;
        UltimoUsuarioId = usuarioId; UltimoPolizaId = polizaId; UltimoPolizaNumero = polizaNumero;
        return Task.CompletedTask;
    }
    public Task<List<AvisoExportacionDto>> ListarExportacionesAsync(int top) => Task.FromResult(Recientes);
}

public class FakeConfiguracionRepository : IConfiguracionRepository
{
    public int AdminId = 1;
    public Dictionary<int, Dictionary<string, string?>> PorUsuario = new();

    public Task<Dictionary<string, string?>> GetByUsuarioAsync(int usuarioId)
        => Task.FromResult(PorUsuario.TryGetValue(usuarioId, out var d) ? d : new Dictionary<string, string?>());
    public Task SetAsync(int usuarioId, string clave, string? valor) => Task.CompletedTask;
    public Task<int> GetAdminIdAsync() => Task.FromResult(AdminId);
}

public class FakeBajaRepository : IBajaRepository
{
    public int SolicitarResultado = 1;
    public bool AprobarResultado = true;
    public bool RechazarResultado = true;
    public Task<int> SolicitarAsync(int polizaId, string motivo, string? observaciones, int usuarioId) => Task.FromResult(SolicitarResultado);
    public Task<List<Baja>> GetAllAsync(int? estado) => Task.FromResult(new List<Baja>());
    public Task<bool> AprobarAsync(int id, int adminId) => Task.FromResult(AprobarResultado);
    public Task<bool> RechazarAsync(int id, int adminId) => Task.FromResult(RechazarResultado);
}

public class FakeAnulacionRepository : IAnulacionRepository
{
    public int AnularDirectoResultado = 1;
    public int SolicitarResultado = 1;
    public int AprobarResultado = 1;
    public int RechazarResultado = 1;
    public Task<int> AnularPagoDirectoAsync(int cobroId) => Task.FromResult(AnularDirectoResultado);
    public Task<int> SolicitarAsync(int cobroId, int usuarioId, string? motivo) => Task.FromResult(SolicitarResultado);
    public Task<List<AnulacionCobro>> GetPendientesAsync() => Task.FromResult(new List<AnulacionCobro>());
    public Task<List<AnulacionCobro>> GetHistorialAsync() => Task.FromResult(new List<AnulacionCobro>());
    public Task<int> AprobarAsync(int id, int adminId) => Task.FromResult(AprobarResultado);
    public Task<int> RechazarAsync(int id, int adminId) => Task.FromResult(RechazarResultado);
}

public class FakeEliminacionRepository : IEliminacionRepository
{
    public (int Id, bool YaExistia) SolicitarResultado = (1, false);
    public int AprobarResultado = 1;
    public int RechazarResultado = 1;
    public int RestaurarResultado = 1;
    public int BorrarResultado = 1;
    public Task<(int Id, bool YaExistia)> SolicitarAsync(int polizaId, int usuarioId, string? motivo) => Task.FromResult(SolicitarResultado);
    public Task<int> AprobarAsync(int id, int adminId) => Task.FromResult(AprobarResultado);
    public Task<int> RechazarAsync(int id, int adminId) => Task.FromResult(RechazarResultado);
    public Task<List<EliminacionPoliza>> GetPendientesAsync() => Task.FromResult(new List<EliminacionPoliza>());
    public Task<List<EliminacionPoliza>> GetHistorialAsync() => Task.FromResult(new List<EliminacionPoliza>());
    public Task<List<EliminacionPoliza>> GetPapeleraAsync() => Task.FromResult(new List<EliminacionPoliza>());
    public Task<int> RestaurarAsync(int polizaId, int adminId) => Task.FromResult(RestaurarResultado);
    public Task<int> BorrarDefinitivoAsync(int polizaId, int adminId) => Task.FromResult(BorrarResultado);
}

public class FakeAltaRepository : IAltaRepository
{
    public Cliente? ClienteRecibido;
    public Vehiculo? VehiculoRecibido;
    public Poliza? PolizaRecibida;
    public int CuotasGeneradas;

    public Task<(int ClienteId, int? VehiculoId, int PolizaId)> AltaCompletaAsync(
        Cliente cliente, Vehiculo? vehiculo, Poliza poliza, Func<int, IEnumerable<Cobro>> cuotasFactory)
    {
        ClienteRecibido = cliente;
        VehiculoRecibido = vehiculo;
        PolizaRecibida = poliza;
        CuotasGeneradas = cuotasFactory(30).Count(); // ejecuta el factory (PolizaId ficticio)
        return Task.FromResult((10, (int?)20, 30));
    }
}
