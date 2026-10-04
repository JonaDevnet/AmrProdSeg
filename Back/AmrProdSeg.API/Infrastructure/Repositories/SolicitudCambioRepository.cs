using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class SolicitudCambioRepository : ISolicitudCambioRepository
{
    private readonly IDbConnectionFactory _factory;

    public SolicitudCambioRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> SolicitarAsync(string tipo, int entidadId, string accion, string? payloadJson, string? motivo, int solicitanteId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_SolicitudCambio_Solicitar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Tipo",          tipo);
        cmd.Parameters.AddWithValue("@EntidadId",     entidadId);
        cmd.Parameters.AddWithValue("@Accion",        accion);
        cmd.Parameters.AddWithValue("@PayloadJson",   (object?)payloadJson ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Motivo",        (object?)motivo ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@SolicitanteId", solicitanteId);
        var result = await cmd.ExecuteScalarAsync();
        return result is null or DBNull ? 0 : Convert.ToInt32(result);
    }

    public async Task<SolicitudCambio?> GetByIdAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_SolicitudCambio_GetById", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        using var r = await cmd.ExecuteReaderAsync();
        if (!await r.ReadAsync()) return null;
        return new SolicitudCambio
        {
            Id              = r.GetInt32(r.GetOrdinal("Id")),
            Tipo            = r.GetString(r.GetOrdinal("Tipo")),
            EntidadId       = r.GetInt32(r.GetOrdinal("EntidadId")),
            Accion          = r.GetString(r.GetOrdinal("Accion")),
            PayloadJson     = r.IsDBNull(r.GetOrdinal("PayloadJson")) ? null : r.GetString(r.GetOrdinal("PayloadJson")),
            Motivo          = r.IsDBNull(r.GetOrdinal("Motivo"))      ? null : r.GetString(r.GetOrdinal("Motivo")),
            SolicitanteId   = r.GetInt32(r.GetOrdinal("SolicitanteId")),
            FechaSolicitud  = r.GetDateTime(r.GetOrdinal("FechaSolicitud")),
            Estado          = r.GetInt32(r.GetOrdinal("Estado")),
            Resolvio        = null,
            FechaResolucion = r.IsDBNull(r.GetOrdinal("FechaResolucion")) ? null : r.GetDateTime(r.GetOrdinal("FechaResolucion"))
        };
    }

    public async Task<int> AprobarAsync(int id, int resolutorId)
        => await EscalarAsync("sp_SolicitudCambio_Aprobar", ("@Id", id), ("@ResolutorId", resolutorId));

    public async Task<int> RechazarAsync(int id, int resolutorId)
        => await EscalarAsync("sp_SolicitudCambio_Rechazar", ("@Id", id), ("@ResolutorId", resolutorId));

    public async Task<List<SolicitudCambio>> ListarAsync(int? estado)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_SolicitudCambio_Listar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Estado", (object?)estado ?? DBNull.Value);
        var lista = new List<SolicitudCambio>();
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            lista.Add(new SolicitudCambio
            {
                Id              = r.GetInt32(r.GetOrdinal("Id")),
                Tipo            = r.GetString(r.GetOrdinal("Tipo")),
                EntidadId       = r.GetInt32(r.GetOrdinal("EntidadId")),
                Accion          = r.GetString(r.GetOrdinal("Accion")),
                Motivo          = r.IsDBNull(r.GetOrdinal("Motivo")) ? null : r.GetString(r.GetOrdinal("Motivo")),
                Solicitante     = r.IsDBNull(r.GetOrdinal("Solicitante")) ? null : r.GetString(r.GetOrdinal("Solicitante")),
                FechaSolicitud  = r.GetDateTime(r.GetOrdinal("FechaSolicitud")),
                Estado          = r.GetInt32(r.GetOrdinal("Estado")),
                Resolvio        = r.IsDBNull(r.GetOrdinal("Resolvio")) ? null : r.GetString(r.GetOrdinal("Resolvio")),
                FechaResolucion = r.IsDBNull(r.GetOrdinal("FechaResolucion")) ? null : r.GetDateTime(r.GetOrdinal("FechaResolucion")),
                EntidadDesc     = r.IsDBNull(r.GetOrdinal("EntidadDesc")) ? null : r.GetString(r.GetOrdinal("EntidadDesc")),
                ClienteNombre   = r.IsDBNull(r.GetOrdinal("ClienteNombre")) ? null : r.GetString(r.GetOrdinal("ClienteNombre"))
            });
        }
        return lista;
    }

    private async Task<int> EscalarAsync(string sp, params (string, object)[] ps)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand(sp, conn) { CommandType = CommandType.StoredProcedure };
        foreach (var (n, v) in ps) cmd.Parameters.AddWithValue(n, v);
        var result = await cmd.ExecuteScalarAsync();
        return result is null or DBNull ? 0 : Convert.ToInt32(result);
    }
}
