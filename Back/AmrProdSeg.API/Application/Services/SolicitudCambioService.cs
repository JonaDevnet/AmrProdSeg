using System.Text.Json;
using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

/// <summary>
/// Flujo de autorización de cambios (editar/eliminar cliente, editar póliza).
/// El Productor deja una solicitud pendiente; al aprobarla, el Admin aplica el cambio
/// (el payload JSON se deserializa al DTO correspondiente) y queda registrado en la
/// auditoría de movimientos con el Admin como actor.
/// </summary>
public class SolicitudCambioService : ISolicitudCambioService
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    private readonly ISolicitudCambioRepository _repo;
    private readonly IClienteService _clientes;
    private readonly IPolizaService _polizas;
    private readonly INotificacionPusher _pusher;

    public SolicitudCambioService(
        ISolicitudCambioRepository repo, IClienteService clientes, IPolizaService polizas, INotificacionPusher pusher)
    {
        _repo = repo;
        _clientes = clientes;
        _polizas = polizas;
        _pusher = pusher;
    }

    public async Task<int> SolicitarAsync(string tipo, int entidadId, string accion, string? payloadJson, string? motivo, int solicitanteId)
    {
        // Columna Motivo NVARCHAR(200): recortar evita SqlException de truncación.
        const int maxMotivo = 200;
        var m = string.IsNullOrEmpty(motivo) ? motivo
            : motivo.Length <= maxMotivo ? motivo : motivo[..maxMotivo];
        var id = await _repo.SolicitarAsync(tipo, entidadId, accion, payloadJson, m, solicitanteId);
        if (id > 0)
            await _pusher.NotificarAsync("solicitud");
        return id;
    }

    public Task<List<SolicitudCambioDto>> GetPendientesAsync() => ListarDtoAsync(0);
    public Task<List<SolicitudCambioDto>> GetHistorialAsync()  => ListarDtoAsync(null);

    public async Task AprobarAsync(int id, int adminId)
    {
        var s = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException("La solicitud no existe.");
        if (s.Estado != 0)
            throw new BusinessException("La solicitud ya fue resuelta.");

        try
        {
            // Aplica el cambio; si falla, la solicitud NO debe quedar trabada en pendiente
            // (ni permitir un reintento que re-aplique un efecto ya aplicado parcialmente):
            // se la marca como rechazada y se propaga el motivo al Admin.
            await AplicarAsync(s, adminId);
        }
        catch
        {
            try { await _repo.RechazarAsync(id, adminId); } catch { /* best effort: no enmascarar el error original */ }
            throw;
        }

        if (await _repo.AprobarAsync(id, adminId) == 0)
            throw new BusinessException("La solicitud ya fue resuelta.");
    }

    public async Task RechazarAsync(int id, int adminId)
    {
        if (await _repo.RechazarAsync(id, adminId) == 0)
            throw new BusinessException("La solicitud no existe o ya fue resuelta.");
    }

    private async Task AplicarAsync(SolicitudCambio s, int adminId)
    {
        switch ((s.Tipo, s.Accion))
        {
            case ("Cliente", "Editar"):
                var dc = JsonSerializer.Deserialize<ActualizarClienteDto>(s.PayloadJson ?? "{}", JsonOpts)
                         ?? throw new BusinessException("Datos de edición inválidos.");
                await _clientes.ActualizarAsync(s.EntidadId, dc, adminId, s.SolicitanteId, s.Motivo);
                break;
            case ("Cliente", "Eliminar"):
                await _clientes.EliminarAsync(s.EntidadId, adminId, s.SolicitanteId);
                break;
            case ("Poliza", "Editar"):
                var dp = JsonSerializer.Deserialize<ActualizarPolizaDto>(s.PayloadJson ?? "{}", JsonOpts)
                         ?? throw new BusinessException("Datos de edición inválidos.");
                await _polizas.ActualizarAsync(s.EntidadId, dp, adminId, s.SolicitanteId, s.Motivo);
                break;
            default:
                throw new BusinessException($"Tipo de cambio no soportado: {s.Tipo}/{s.Accion}.");
        }
    }

    private async Task<List<SolicitudCambioDto>> ListarDtoAsync(int? estado)
    {
        var lista = await _repo.ListarAsync(estado);
        return lista.Select(s => new SolicitudCambioDto
        {
            Id = s.Id,
            Tipo = s.Tipo,
            EntidadId = s.EntidadId,
            Accion = s.Accion,
            Motivo = s.Motivo,
            Solicitante = s.Solicitante,
            // La BD guarda GETUTCDATE(): se marca como UTC para que el navegador la muestre en hora local.
            FechaSolicitud = s.FechaSolicitud.ToString("o") + "Z",
            Estado = s.Estado,
            Resolvio = s.Resolvio,
            FechaResolucion = s.FechaResolucion?.ToString("o") + "Z",
            EntidadDesc = s.EntidadDesc,
            ClienteNombre = s.ClienteNombre,
            PayloadJson = s.PayloadJson
        }).ToList();
    }
}
