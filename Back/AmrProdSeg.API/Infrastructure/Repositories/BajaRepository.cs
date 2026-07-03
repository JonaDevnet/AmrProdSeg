using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class BajaRepository : IBajaRepository
{
    private readonly IDbConnectionFactory _factory;

    public BajaRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> SolicitarAsync(int polizaId, string motivo, string? observaciones, int usuarioId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Baja_Solicitar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@PolizaId", polizaId);
        cmd.Parameters.AddWithValue("@Motivo", motivo);
        cmd.Parameters.AddWithValue("@Observaciones", (object?)observaciones ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<List<Baja>> GetAllAsync(int? estado)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Baja_GetAll", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Estado", (object?)estado ?? DBNull.Value);

        var lista = new List<Baja>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new Baja
            {
                Id             = reader.GetInt32(reader.GetOrdinal("Id")),
                PolizaId       = reader.GetInt32(reader.GetOrdinal("PolizaId")),
                NroPoliza      = reader.GetString(reader.GetOrdinal("NroPoliza")),
                ClienteNombre  = reader.GetString(reader.GetOrdinal("ClienteNombre")),
                Motivo         = reader.GetString(reader.GetOrdinal("Motivo")),
                Observaciones  = reader.IsDBNull(reader.GetOrdinal("Observaciones")) ? null : reader.GetString(reader.GetOrdinal("Observaciones")),
                Estado         = reader.GetInt32(reader.GetOrdinal("Estado")),
                FechaSolicitud = reader.GetDateTime(reader.GetOrdinal("FechaSolicitud")),
                Solicitante    = reader.IsDBNull(reader.GetOrdinal("Solicitante")) ? null : reader.GetString(reader.GetOrdinal("Solicitante")),
            });
        }
        return lista;
    }

    public Task<bool> AprobarAsync(int id, int adminId) => EjecutarResolucionAsync("sp_Baja_Aprobar", id, adminId);
    public Task<bool> RechazarAsync(int id, int adminId) => EjecutarResolucionAsync("sp_Baja_Rechazar", id, adminId);

    private async Task<bool> EjecutarResolucionAsync(string sp, int id, int adminId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand(sp, conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@AdminId", adminId);
        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result) > 0;
    }
}
