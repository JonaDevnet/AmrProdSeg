using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Application.Services;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.Tests;

public class SolicitudCambioServiceTests
{
    [Fact]
    public async Task Aprobar_Ok_MarcaAprobada()
    {
        var repo = new FakeSolicitudCambioRepository
        {
            PorId = SolicitudPendiente(tipo: "Cliente", accion: "Eliminar"),
        };
        var svc = new SolicitudCambioService(repo, new FakeClienteService(), new FakePolizaService(), new FakeNotificacionPusher());

        await svc.AprobarAsync(1, adminId: 9);

        Assert.Equal(1, repo.AprobarLlamado);
        Assert.Equal(0, repo.RechazarLlamado);
    }

    [Fact]
    public async Task Aprobar_CuandoAplicarFalla_RechazaLaSolicitud_YPropagaElError()
    {
        var repo = new FakeSolicitudCambioRepository
        {
            // El cliente ya no existe: AplicarAsync lanza NotFoundException.
            PorId = SolicitudPendiente(tipo: "Cliente", accion: "Eliminar"),
        };
        var clientes = new FakeClienteService { LanzarNotFoundEnEliminar = true };
        var svc = new SolicitudCambioService(repo, clientes, new FakePolizaService(), new FakeNotificacionPusher());

        await Assert.ThrowsAsync<NotFoundException>(() => svc.AprobarAsync(1, adminId: 9));

        // La solicitud NO queda trabada en pendiente: se la rechaza y el Admin ve el motivo.
        Assert.Equal(1, repo.RechazarLlamado);
        Assert.Equal(0, repo.AprobarLlamado);
    }

    [Fact]
    public async Task Aprobar_EdicionCliente_PasaSolicitanteYMotivo()
    {
        var repo = new FakeSolicitudCambioRepository
        {
            PorId = new SolicitudCambio
            {
                Id = 1, Tipo = "Cliente", EntidadId = 99, Accion = "Editar",
                Estado = 0, PayloadJson = "{}", SolicitanteId = 5, Motivo = "corregir teléfono",
            },
        };
        var clientes = new FakeClienteService();
        var svc = new SolicitudCambioService(repo, clientes, new FakePolizaService(), new FakeNotificacionPusher());

        await svc.AprobarAsync(1, adminId: 9);

        Assert.Equal(9, clientes.UltimoUsuarioId);
        Assert.Equal(5, clientes.UltimoSolicitanteId);
        Assert.Equal("corregir teléfono", clientes.UltimoMotivo);
    }

    private static SolicitudCambio SolicitudPendiente(string tipo, string accion)
        => new()
        {
            Id = 1,
            Tipo = tipo,
            EntidadId = 99,
            Accion = accion,
            Estado = 0,
            PayloadJson = null,
        };
}

/// <summary>Fake de ISolicitudCambioRepository que registra llamadas a aprobar/rechazar.</summary>
public class FakeSolicitudCambioRepository : ISolicitudCambioRepository
{
    public SolicitudCambio? PorId;
    public int AprobarLlamado;
    public int RechazarLlamado;
    public int AprobarResultado = 1;

    public Task<int> SolicitarAsync(string tipo, int entidadId, string accion, string? payloadJson, string? motivo, int solicitanteId)
        => Task.FromResult(1);

    public Task<SolicitudCambio?> GetByIdAsync(int id) => Task.FromResult(PorId);

    public Task<int> AprobarAsync(int id, int resolutorId)
    {
        AprobarLlamado++;
        return Task.FromResult(AprobarResultado);
    }

    public Task<int> RechazarAsync(int id, int resolutorId)
    {
        RechazarLlamado++;
        return Task.FromResult(1);
    }

    public Task<List<SolicitudCambio>> ListarAsync(int? estado)
        => Task.FromResult(new List<SolicitudCambio>());
}

/// <summary>Fake de IClienteService (solo la parte que usa AplicarAsync).</summary>
public class FakeClienteService : IClienteService
{
    public bool LanzarNotFoundEnEliminar;
    public int? UltimoUsuarioId;
    public int? UltimoSolicitanteId;
    public string? UltimoMotivo;

    public Task<int> CrearAsync(CrearClienteDto dto, int? usuarioId = null) => Task.FromResult(1);
    public Task ActualizarAsync(int id, ActualizarClienteDto dto, int? usuarioId = null, int? solicitanteId = null, string? motivo = null)
    {
        UltimoUsuarioId = usuarioId;
        UltimoSolicitanteId = solicitanteId;
        UltimoMotivo = motivo;
        return Task.CompletedTask;
    }
    public Task ActualizarDocumentoAsync(int id, string nuevoDocumento, int usuarioId) => Task.CompletedTask;

    public Task<int> EliminarAsync(int id, int? usuarioId = null, int? solicitanteId = null)
        => LanzarNotFoundEnEliminar
            ? throw new NotFoundException("Cliente no encontrado.")
            : Task.FromResult(1);

    public Task<Cliente?> GetByIdAsync(int id) => Task.FromResult<Cliente?>(null);
    public Task<PagedResult<Cliente>> BuscarAsync(string termino, int page, int pageSize, int? usuarioId = null, bool esAdmin = false)
        => Task.FromResult(new PagedResult<Cliente>());
    public Task<byte[]> GenerarDossierPdfAsync(int clienteId, int? usuarioId, bool esAdmin)
        => Task.FromResult(Array.Empty<byte>());
}

/// <summary>Fake de IPolizaService (no se usa en estos casos de prueba).</summary>
public class FakePolizaService : IPolizaService
{
    public Task<PolizaDto> CrearAsync(CrearPolizaDto dto, int? usuarioId = null)
        => Task.FromResult(new PolizaDto());
    public Task<RenovacionResultDto> RenovarAsync(int polizaOrigenId, RenovarPolizaDto dto, int? usuarioId = null)
        => Task.FromResult(new RenovacionResultDto());
    public Task<PolizaDto?> GetByIdAsync(int id) => Task.FromResult<PolizaDto?>(null);
    public Task<PolizaDto?> GetActivaPorPatenteAsync(string patente) => Task.FromResult<PolizaDto?>(null);
    public Task<PagedResult<PolizaDto>> ListarAsync(int? clienteId, int? estado, int page, int pageSize, int? usuarioId = null, bool esAdmin = false, string? termino = null, string? campo = null)
        => Task.FromResult(new PagedResult<PolizaDto>());
    public Task ActualizarAsync(int id, ActualizarPolizaDto dto, int? usuarioId = null, int? solicitanteId = null, string? motivo = null) => Task.CompletedTask;
    public Task AsignarNumeroAsync(int id, string numero, int? usuarioId = null) => Task.CompletedTask;
    public Task CancelarAsync(int id, int? usuarioId = null) => Task.CompletedTask;
    public Task<byte[]> GenerarPdfAsync(int id) => Task.FromResult(Array.Empty<byte>());
}