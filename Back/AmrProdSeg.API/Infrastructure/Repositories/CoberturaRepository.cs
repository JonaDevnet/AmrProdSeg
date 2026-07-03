using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class CoberturaRepository : ICoberturaRepository
{
    private readonly IDbConnectionFactory _factory;
    public CoberturaRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> InsertarAsync(string nombre)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Cobertura_Insertar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Nombre", nombre);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }

    public async Task<List<Cobertura>> GetAllAsync()
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Cobertura_GetAll", conn) { CommandType = CommandType.StoredProcedure };
        var lista = new List<Cobertura>();
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
            lista.Add(new Cobertura
            {
                Id = r.GetInt32(r.GetOrdinal("Id")),
                Nombre = r.GetString(r.GetOrdinal("Nombre")),
                Activo = r.GetBoolean(r.GetOrdinal("Activo")),
            });
        return lista;
    }

    public async Task<int> EliminarAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Cobertura_Eliminar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }
}
