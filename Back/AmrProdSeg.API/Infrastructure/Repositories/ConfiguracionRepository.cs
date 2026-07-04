using System.Data;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class ConfiguracionRepository : IConfiguracionRepository
{
    private readonly IDbConnectionFactory _factory;
    public ConfiguracionRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<Dictionary<string, string?>> GetByUsuarioAsync(int usuarioId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Config_GetByUsuario", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        var dict = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            var clave = r.GetString(r.GetOrdinal("Clave"));
            dict[clave] = r.IsDBNull(r.GetOrdinal("Valor")) ? null : r.GetString(r.GetOrdinal("Valor"));
        }
        return dict;
    }

    public async Task SetAsync(int usuarioId, string clave, string? valor)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Config_Set", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        cmd.Parameters.AddWithValue("@Clave", clave);
        cmd.Parameters.AddWithValue("@Valor", (object?)valor ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<int> GetAdminIdAsync()
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Config_GetAdminId", conn) { CommandType = CommandType.StoredProcedure };
        var result = await cmd.ExecuteScalarAsync();
        return result is null or DBNull ? 0 : Convert.ToInt32(result);
    }
}
