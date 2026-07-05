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
    public Task<(List<Poliza> Items, int Total)> ListarAsync(int? clienteId, int? estado, int page, int pageSize, int? usuarioId = null, bool esAdmin = false)
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
    public Task<int> InsertarAsync(string nombre, string email, string passwordHash, string rol) => Task.FromResult(1);
    public Task CambiarPasswordAsync(int id, string passwordHash) => Task.CompletedTask;
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
    public Task<bool> HabilitadoParaAsync(int? usuarioId) => Task.FromResult(Habilitado);
    public Task EnviarAsync(string telefono, string mensaje, int? usuarioId = null) => Task.CompletedTask;
    public Task EnviarDocumentoAsync(string telefono, byte[] documento, string nombreArchivo, string caption, int? usuarioId = null) => Task.CompletedTask;
}

public class FakePdfService : IPdfService
{
    public Task<byte[]> GenerarComprobanteAsync(Poliza poliza) => Task.FromResult(Array.Empty<byte>());
    public Task<string> GenerarComprobantePdfAsync(Poliza poliza) => Task.FromResult("/comprobantes/test.pdf");
    public byte[] GenerarTabla(string titulo, List<Dictionary<string, object?>> filas) => Array.Empty<byte>();
    public byte[] GenerarComprobanteCobro(ComprobanteCobroDto dto) => Array.Empty<byte>();
    public byte[] GenerarComprobanteImpresion(ComprobanteCobroDto dto) => Array.Empty<byte>();
    public byte[] GenerarTicketImpresion(ComprobanteCobroDto dto) => Array.Empty<byte>();
}

public class FakeMetodoPagoRepository : IMetodoPagoRepository
{
    public Task<int> InsertarAsync(string nombre) => Task.FromResult(1);
    public Task<List<MetodoPago>> GetAllAsync() => Task.FromResult(new List<MetodoPago>());
    public Task<int> EliminarAsync(int id) => Task.FromResult(1);
}
