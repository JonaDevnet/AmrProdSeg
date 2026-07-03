using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly IDbConnectionFactory _factory;

    public UsuarioRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> InsertarAsync(string nombre, string email, string passwordHash, string rol)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Usuario_Insertar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Nombre",       nombre);
        cmd.Parameters.AddWithValue("@Email",        email);
        cmd.Parameters.AddWithValue("@PasswordHash", passwordHash);
        cmd.Parameters.AddWithValue("@Rol",          rol);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task CambiarPasswordAsync(int id, string passwordHash)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Usuario_CambiarPassword", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id",           id);
        cmd.Parameters.AddWithValue("@PasswordHash", passwordHash);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<Usuario>> GetAllAsync()
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Usuario_GetAll", conn)
        {
            CommandType = CommandType.StoredProcedure
        };

        var lista = new List<Usuario>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new Usuario
            {
                Id        = reader.GetInt32(reader.GetOrdinal("Id")),
                Nombre    = reader.GetString(reader.GetOrdinal("Nombre")),
                Email     = reader.GetString(reader.GetOrdinal("Email")),
                Rol       = reader.GetString(reader.GetOrdinal("Rol")),
                Activo    = reader.GetBoolean(reader.GetOrdinal("Activo")),
                FechaAlta = reader.GetDateTime(reader.GetOrdinal("FechaAlta")),
                OficinaId = Tiene(reader, "OficinaId") && !reader.IsDBNull(reader.GetOrdinal("OficinaId")) ? reader.GetInt32(reader.GetOrdinal("OficinaId")) : null,
                OficinaNombre = Tiene(reader, "OficinaNombre") && !reader.IsDBNull(reader.GetOrdinal("OficinaNombre")) ? reader.GetString(reader.GetOrdinal("OficinaNombre")) : null,
            });
        }
        return lista;
    }

    public async Task AsignarOficinaAsync(int usuarioId, int? oficinaId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Usuario_AsignarOficina", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        cmd.Parameters.AddWithValue("@OficinaId", (object?)oficinaId ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<int?> GetOficinaIdAsync(int usuarioId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("SELECT OficinaId FROM Usuarios WHERE Id = @Id", conn);
        cmd.Parameters.AddWithValue("@Id", usuarioId);
        var r = await cmd.ExecuteScalarAsync();
        return r is null or DBNull ? null : Convert.ToInt32(r);
    }

    public async Task<int> EliminarAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Usuario_Eliminar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }

    private static bool Tiene(SqlDataReader r, string col)
    {
        for (int i = 0; i < r.FieldCount; i++)
            if (string.Equals(r.GetName(i), col, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }
}
