using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class AuditoriaMovimientoRepository : IAuditoriaMovimientoRepository
{
    private readonly IDbConnectionFactory _factory;

    public AuditoriaMovimientoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task RegistrarAsync(int usuarioId, string entidad, int registroId, string accion, string? detalle, DateTime fecha)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_AuditoriaMovimiento_Insertar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@UsuarioId",  usuarioId);
        cmd.Parameters.AddWithValue("@Fecha",      fecha);
        cmd.Parameters.AddWithValue("@Entidad",    entidad);
        cmd.Parameters.AddWithValue("@RegistroId", registroId);
        cmd.Parameters.AddWithValue("@Accion",     accion);
        cmd.Parameters.AddWithValue("@Detalle",    (object?)detalle ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<AuditoriaMovimiento>> ListarAsync(int? usuarioId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_AuditoriaMovimiento_Listar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@UsuarioId", (object?)usuarioId ?? DBNull.Value);

        var lista = new List<AuditoriaMovimiento>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new AuditoriaMovimiento
            {
                Id            = reader.GetInt32(reader.GetOrdinal("Id")),
                UsuarioId     = reader.GetInt32(reader.GetOrdinal("UsuarioId")),
                UsuarioNombre = reader.IsDBNull(reader.GetOrdinal("UsuarioNombre")) ? null : reader.GetString(reader.GetOrdinal("UsuarioNombre")),
                Fecha         = reader.GetDateTime(reader.GetOrdinal("Fecha")),
                Entidad       = reader.GetString(reader.GetOrdinal("Entidad")),
                RegistroId    = reader.GetInt32(reader.GetOrdinal("RegistroId")),
                Accion        = reader.GetString(reader.GetOrdinal("Accion")),
                Detalle       = reader.IsDBNull(reader.GetOrdinal("Detalle")) ? null : reader.GetString(reader.GetOrdinal("Detalle"))
            });
        }
        return lista;
    }
}
