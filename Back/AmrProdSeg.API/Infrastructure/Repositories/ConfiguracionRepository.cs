using System.Data;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class ConfiguracionRepository : IConfiguracionRepository
{
    private readonly IDbConnectionFactory _factory;
    public ConfiguracionRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<Dictionary<string, string?>> GetAllAsync()
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Config_GetAll", conn) { CommandType = CommandType.StoredProcedure };
        var dict = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            var clave = r.GetString(r.GetOrdinal("Clave"));
            dict[clave] = r.IsDBNull(r.GetOrdinal("Valor")) ? null : r.GetString(r.GetOrdinal("Valor"));
        }
        return dict;
    }

    public async Task SetAsync(string clave, string? valor)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Config_Set", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Clave", clave);
        cmd.Parameters.AddWithValue("@Valor", (object?)valor ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }
}
