using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class AnuncioRepository : IAnuncioRepository
{
    private readonly IDbConnectionFactory _factory;

    public AnuncioRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<(List<Anuncio> Items, int Total)> GetAllAsync(int page, int pageSize)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Anuncio_GetAll", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Page", page);
        cmd.Parameters.AddWithValue("@PageSize", pageSize);

        var lista = new List<Anuncio>();
        var total = 0;
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            total = reader.GetInt32(reader.GetOrdinal("Total"));
            lista.Add(MapAnuncio(reader));
        }
        return (lista, total);
    }

    public async Task<(List<Anuncio> Items, int Total)> GetNuevosAsync(int usuarioId, int top = 5)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Anuncio_GetNuevos", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        cmd.Parameters.AddWithValue("@Top", top);

        var lista = new List<Anuncio>();
        var total = 0;
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            total = reader.GetInt32(reader.GetOrdinal("Total"));
            lista.Add(new Anuncio
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                Titulo = reader.GetString(reader.GetOrdinal("Titulo")),
                Subtitulo = reader.IsDBNull(reader.GetOrdinal("Subtitulo")) ? null : reader.GetString(reader.GetOrdinal("Subtitulo")),
                FechaPublicacion = reader.GetDateTime(reader.GetOrdinal("FechaPublicacion")),
            });
        }
        return (lista, total);
    }

    public async Task<int> InsertarAsync(string titulo, string? subtitulo, string texto, int publicadoPor)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Anuncio_Insertar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Titulo", titulo);
        cmd.Parameters.AddWithValue("@Subtitulo", (object?)subtitulo ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Texto", texto);
        cmd.Parameters.AddWithValue("@PublicadoPor", publicadoPor);
        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<int> MarcarVistosAsync(int usuarioId, int hastaId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Anuncio_MarcarVistos", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        cmd.Parameters.AddWithValue("@HastaId", hastaId);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }

    public async Task<int> EliminarAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Anuncio_Eliminar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }

    private static Anuncio MapAnuncio(SqlDataReader reader) => new()
    {
        Id = reader.GetInt32(reader.GetOrdinal("Id")),
        Titulo = reader.GetString(reader.GetOrdinal("Titulo")),
        Subtitulo = reader.IsDBNull(reader.GetOrdinal("Subtitulo")) ? null : reader.GetString(reader.GetOrdinal("Subtitulo")),
        Texto = reader.GetString(reader.GetOrdinal("Texto")),
        PublicadoPor = reader.GetInt32(reader.GetOrdinal("PublicadoPor")),
        UsuarioNombre = reader.IsDBNull(reader.GetOrdinal("UsuarioNombre")) ? null : reader.GetString(reader.GetOrdinal("UsuarioNombre")),
        UsuarioEmail = reader.IsDBNull(reader.GetOrdinal("UsuarioEmail")) ? null : reader.GetString(reader.GetOrdinal("UsuarioEmail")),
        FechaPublicacion = reader.GetDateTime(reader.GetOrdinal("FechaPublicacion")),
    };
}
