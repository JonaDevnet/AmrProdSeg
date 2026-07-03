using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class AuthRepository : IAuthRepository
{
    private readonly IDbConnectionFactory _factory;

    public AuthRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<Usuario?> GetUsuarioByEmailAsync(string email)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Usuario_GetByEmail", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Email", email);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return MapUsuario(reader);
    }

    public async Task<Usuario?> GetUsuarioByIdAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Usuario_GetById", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id", id);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return MapUsuario(reader);
    }

    public async Task GuardarRefreshTokenAsync(int usuarioId, string token, DateTime expiracion)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_RefreshToken_Guardar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@UsuarioId",  usuarioId);
        cmd.Parameters.AddWithValue("@Token",      token);
        cmd.Parameters.AddWithValue("@Expiracion", expiracion);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_RefreshToken_Get", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Token", token);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return new RefreshToken
        {
            Id          = reader.GetInt32(reader.GetOrdinal("Id")),
            UsuarioId   = reader.GetInt32(reader.GetOrdinal("UsuarioId")),
            Token       = reader.GetString(reader.GetOrdinal("Token")),
            Expiracion  = reader.GetDateTime(reader.GetOrdinal("Expiracion")),
            Revocado    = reader.GetBoolean(reader.GetOrdinal("Revocado")),
            FechaCreado = reader.GetDateTime(reader.GetOrdinal("FechaCreado"))
        };
    }

    public async Task RevocarRefreshTokenAsync(string token)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_RefreshToken_Revocar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Token", token);
        await cmd.ExecuteNonQueryAsync();
    }

    private static Usuario MapUsuario(SqlDataReader r) => new()
    {
        Id           = r.GetInt32(r.GetOrdinal("Id")),
        Nombre       = r.GetString(r.GetOrdinal("Nombre")),
        Email        = r.GetString(r.GetOrdinal("Email")),
        PasswordHash = r.GetString(r.GetOrdinal("PasswordHash")),
        Rol          = r.GetString(r.GetOrdinal("Rol")),
        Activo       = r.GetBoolean(r.GetOrdinal("Activo")),
        FechaAlta    = r.GetDateTime(r.GetOrdinal("FechaAlta"))
    };
}
