using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class ResetRepository : IResetRepository
{
    private readonly IDbConnectionFactory _factory;

    public ResetRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task SolicitarAsync(int usuarioId, string email)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Reset_Solicitar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        cmd.Parameters.AddWithValue("@Email", email);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<SolicitudReset>> GetPendientesAsync()
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Reset_GetPendientes", conn) { CommandType = CommandType.StoredProcedure };

        var lista = new List<SolicitudReset>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new SolicitudReset
            {
                Id             = reader.GetInt32(reader.GetOrdinal("Id")),
                UsuarioId      = reader.GetInt32(reader.GetOrdinal("UsuarioId")),
                Email          = reader.GetString(reader.GetOrdinal("Email")),
                Estado         = reader.GetInt32(reader.GetOrdinal("Estado")),
                FechaSolicitud = reader.GetDateTime(reader.GetOrdinal("FechaSolicitud")),
                UsuarioNombre  = reader.GetString(reader.GetOrdinal("UsuarioNombre")),
                Rol            = reader.GetString(reader.GetOrdinal("Rol"))
            });
        }
        return lista;
    }

    public async Task<bool> AutorizarAsync(int id, int adminId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Reset_Autorizar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@AdminId", adminId);
        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result) > 0;
    }

    public async Task<SolicitudReset?> GetAutorizadaPorEmailAsync(string email)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Reset_GetAutorizadaPorEmail", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Email", email);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return new SolicitudReset
        {
            Id        = reader.GetInt32(reader.GetOrdinal("Id")),
            UsuarioId = reader.GetInt32(reader.GetOrdinal("UsuarioId")),
            Email     = reader.GetString(reader.GetOrdinal("Email")),
            Estado    = reader.GetInt32(reader.GetOrdinal("Estado"))
        };
    }

    public async Task CompletarAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Reset_Completar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        await cmd.ExecuteNonQueryAsync();
    }
}
