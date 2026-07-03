using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class OficinaRepository : IOficinaRepository
{
    private readonly IDbConnectionFactory _factory;
    public OficinaRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> InsertarAsync(string nombre)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Oficina_Insertar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Nombre", nombre);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }

    public async Task<List<Oficina>> GetAllAsync() => await LeerOficinas("sp_Oficina_GetAll");

    public async Task<int> EliminarAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Oficina_Eliminar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }

    public async Task CompartirClienteAsync(int clienteId, int oficinaId)
        => await Ejecutar("sp_Cliente_Compartir", ("@ClienteId", clienteId), ("@OficinaId", oficinaId));

    public async Task DescompartirClienteAsync(int clienteId, int oficinaId)
        => await Ejecutar("sp_Cliente_Descompartir", ("@ClienteId", clienteId), ("@OficinaId", oficinaId));

    public async Task<List<Oficina>> GetOficinasDeClienteAsync(int clienteId)
        => await LeerOficinas("sp_Cliente_GetOficinasCompartidas", ("@ClienteId", clienteId));

    private async Task<List<Oficina>> LeerOficinas(string sp, params (string, object)[] ps)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand(sp, conn) { CommandType = CommandType.StoredProcedure };
        foreach (var (n, v) in ps) cmd.Parameters.AddWithValue(n, v);
        var lista = new List<Oficina>();
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            var iActivo = -1;
            for (int i = 0; i < r.FieldCount; i++) if (r.GetName(i) == "Activo") iActivo = i;
            lista.Add(new Oficina
            {
                Id = r.GetInt32(r.GetOrdinal("Id")),
                Nombre = r.GetString(r.GetOrdinal("Nombre")),
                Activo = iActivo < 0 || r.GetBoolean(iActivo),
            });
        }
        return lista;
    }

    private async Task Ejecutar(string sp, params (string, object)[] ps)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand(sp, conn) { CommandType = CommandType.StoredProcedure };
        foreach (var (n, v) in ps) cmd.Parameters.AddWithValue(n, v);
        await cmd.ExecuteNonQueryAsync();
    }
}
