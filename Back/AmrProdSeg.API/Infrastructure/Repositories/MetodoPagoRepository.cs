using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class MetodoPagoRepository : IMetodoPagoRepository
{
    private readonly IDbConnectionFactory _factory;

    public MetodoPagoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> InsertarAsync(string nombre)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_MetodoPago_Insertar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Nombre", nombre);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<List<MetodoPago>> GetAllAsync()
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_MetodoPago_GetAll", conn)
        {
            CommandType = CommandType.StoredProcedure
        };

        var lista = new List<MetodoPago>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new MetodoPago
            {
                Id     = reader.GetInt32(reader.GetOrdinal("Id")),
                Nombre = reader.GetString(reader.GetOrdinal("Nombre")),
                Activo = reader.GetBoolean(reader.GetOrdinal("Activo"))
            });
        }
        return lista;
    }

    public async Task<int> EliminarAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_MetodoPago_Eliminar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }
}
