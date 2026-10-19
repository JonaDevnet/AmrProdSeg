using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class NotaRepository : INotaRepository
{
    private readonly IDbConnectionFactory _factory;

    public NotaRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> InsertarAsync(int usuarioId, string texto)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Nota_Insertar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        cmd.Parameters.AddWithValue("@Texto", texto);
        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<List<Nota>> GetPorUsuarioAsync(int usuarioId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Nota_GetPorUsuario", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);

        var lista = new List<Nota>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new Nota
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                UsuarioId = usuarioId,
                Texto = reader.GetString(reader.GetOrdinal("Texto")),
                FechaCreacion = reader.GetDateTime(reader.GetOrdinal("FechaCreacion")),
            });
        }
        return lista;
    }

    public async Task<int> EliminarAsync(int id, int usuarioId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Nota_Eliminar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }
}
