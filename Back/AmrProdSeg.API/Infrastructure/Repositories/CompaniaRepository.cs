using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class CompaniaRepository : ICompaniaRepository
{
    private readonly IDbConnectionFactory _factory;

    public CompaniaRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> InsertarAsync(Compania c)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Compania_Insertar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Nombre",   c.Nombre);
        cmd.Parameters.AddWithValue("@CUIT",     (object?)c.CUIT ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Telefono", (object?)c.Telefono ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@LogoUrl",  (object?)c.LogoUrl ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Color",    (object?)c.Color ?? DBNull.Value);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<List<Compania>> GetAllAsync()
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Compania_GetAll", conn)
        {
            CommandType = CommandType.StoredProcedure
        };

        var lista = new List<Compania>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            lista.Add(MapCompania(reader));
        return lista;
    }

    public async Task<Compania?> GetByIdAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Compania_GetById", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id", id);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return MapCompania(reader);
    }

    public async Task<int> EliminarAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Compania_Eliminar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }

    private static Compania MapCompania(SqlDataReader reader) => new()
    {
        Id       = reader.GetInt32(reader.GetOrdinal("Id")),
        Nombre   = reader.GetString(reader.GetOrdinal("Nombre")),
        CUIT     = reader.IsDBNull(reader.GetOrdinal("CUIT"))     ? null : reader.GetString(reader.GetOrdinal("CUIT")),
        Telefono = reader.IsDBNull(reader.GetOrdinal("Telefono")) ? null : reader.GetString(reader.GetOrdinal("Telefono")),
        LogoUrl  = reader.IsDBNull(reader.GetOrdinal("LogoUrl"))  ? null : reader.GetString(reader.GetOrdinal("LogoUrl")),
        Color    = HasCol(reader, "Color") && !reader.IsDBNull(reader.GetOrdinal("Color")) ? reader.GetString(reader.GetOrdinal("Color")) : null,
        Activo   = reader.GetBoolean(reader.GetOrdinal("Activo"))
    };

    private static bool HasCol(SqlDataReader r, string col)
    {
        for (int i = 0; i < r.FieldCount; i++)
            if (string.Equals(r.GetName(i), col, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }
}
