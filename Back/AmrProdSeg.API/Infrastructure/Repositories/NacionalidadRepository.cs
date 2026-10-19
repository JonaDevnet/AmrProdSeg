using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class NacionalidadRepository : INacionalidadRepository
{
    private readonly IDbConnectionFactory _factory;

    public NacionalidadRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> InsertarAsync(string nombre)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Nacionalidad_Insertar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Nombre", nombre);
        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<List<Nacionalidad>> GetAllAsync()
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Nacionalidad_GetAll", conn) { CommandType = CommandType.StoredProcedure };

        var lista = new List<Nacionalidad>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new Nacionalidad
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                Activo = reader.GetBoolean(reader.GetOrdinal("Activo")),
            });
        }
        return lista;
    }

    public async Task<Nacionalidad?> GetByIdAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand(
            "SELECT Id, Nombre, Activo FROM Nacionalidades WHERE Id = @Id AND Activo = 1", conn);
        cmd.Parameters.AddWithValue("@Id", id);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return new Nacionalidad
        {
            Id = reader.GetInt32(reader.GetOrdinal("Id")),
            Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
            Activo = reader.GetBoolean(reader.GetOrdinal("Activo")),
        };
    }

    public async Task<int> EliminarAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Nacionalidad_Eliminar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }
}
