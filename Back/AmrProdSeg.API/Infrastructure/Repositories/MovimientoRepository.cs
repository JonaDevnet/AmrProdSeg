using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class MovimientoRepository : IMovimientoRepository
{
    private readonly IDbConnectionFactory _factory;
    public MovimientoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> InsertarAsync(Movimiento m)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Movimiento_Insertar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@UsuarioId", m.UsuarioId);
        cmd.Parameters.AddWithValue("@Tipo", m.Tipo);
        cmd.Parameters.AddWithValue("@Monto", m.Monto);
        cmd.Parameters.AddWithValue("@Categoria", (object?)m.Categoria ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Descripcion", (object?)m.Descripcion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Fecha", m.Fecha);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }

    public async Task<List<Movimiento>> GetPorUsuarioAsync(int usuarioId, DateTime? desde, DateTime? hasta)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Movimiento_GetPorUsuario", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        cmd.Parameters.AddWithValue("@Desde", (object?)desde ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Hasta", (object?)hasta ?? DBNull.Value);

        var lista = new List<Movimiento>();
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            lista.Add(new Movimiento
            {
                Id          = r.GetInt32(r.GetOrdinal("Id")),
                UsuarioId   = r.GetInt32(r.GetOrdinal("UsuarioId")),
                Tipo        = r.GetString(r.GetOrdinal("Tipo")),
                Monto       = r.GetDecimal(r.GetOrdinal("Monto")),
                Categoria   = r.IsDBNull(r.GetOrdinal("Categoria")) ? null : r.GetString(r.GetOrdinal("Categoria")),
                Descripcion = r.IsDBNull(r.GetOrdinal("Descripcion")) ? null : r.GetString(r.GetOrdinal("Descripcion")),
                Fecha       = r.GetDateTime(r.GetOrdinal("Fecha")),
            });
        }
        return lista;
    }

    public async Task<int> EliminarAsync(int id, int usuarioId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Movimiento_Eliminar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }
}
