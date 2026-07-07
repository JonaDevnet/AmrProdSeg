using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class ClienteRepository : IClienteRepository
{
    private readonly IDbConnectionFactory _factory;

    public ClienteRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> InsertarAsync(Cliente c)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cliente_Insertar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Nombre",    c.Nombre);
        cmd.Parameters.AddWithValue("@Documento", c.Documento);
        cmd.Parameters.AddWithValue("@Email",     (object?)c.Email ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Telefono",  (object?)c.Telefono ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Direccion", (object?)c.Direccion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@TipoDocumento", (object?)c.TipoDocumento ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@OficinaId", (object?)c.OficinaId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@VendedorId", (object?)c.VendedorId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@FechaNacimiento", (object?)c.FechaNacimiento ?? DBNull.Value);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task ActualizarAsync(Cliente c)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cliente_Actualizar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id",        c.Id);
        cmd.Parameters.AddWithValue("@Nombre",    c.Nombre);
        cmd.Parameters.AddWithValue("@Email",     (object?)c.Email ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Telefono",  (object?)c.Telefono ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Direccion", (object?)c.Direccion ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@TipoDocumento", (object?)c.TipoDocumento ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@FechaNacimiento", (object?)c.FechaNacimiento ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<Cliente?> GetByIdAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cliente_GetById", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id", id);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return MapCliente(reader);
    }

    public async Task<(List<Cliente> Items, int Total)> BuscarAsync(string termino, int page, int pageSize, int? usuarioId = null, bool esAdmin = false)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cliente_Buscar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Termino",  termino);
        cmd.Parameters.AddWithValue("@Offset",   (page - 1) * pageSize);
        cmd.Parameters.AddWithValue("@PageSize", pageSize);
        cmd.Parameters.AddWithValue("@UsuarioId", (object?)usuarioId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@EsAdmin",   esAdmin);

        var lista = new List<Cliente>();
        int total = 0;
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(MapCliente(reader));
            total = reader.GetInt32(reader.GetOrdinal("Total"));
        }
        return (lista, total);
    }

    public async Task ActualizarDocumentoAsync(int id, string nuevoDocumento, int usuarioId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cliente_ActualizarDocumento", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id",        id);
        cmd.Parameters.AddWithValue("@NuevoDoc",  nuevoDocumento);
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<Cliente?> VerificarDocumentoAsync(string documento)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cliente_VerificarDocumento", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Documento", documento);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return new Cliente
        {
            Id        = reader.GetInt32(reader.GetOrdinal("Id")),
            Nombre    = reader.GetString(reader.GetOrdinal("Nombre")),
            Documento = reader.GetString(reader.GetOrdinal("Documento"))
        };
    }

    private static Cliente MapCliente(SqlDataReader r) => new()
    {
        Id        = r.GetInt32(r.GetOrdinal("Id")),
        Nombre    = r.GetString(r.GetOrdinal("Nombre")),
        Documento = r.GetString(r.GetOrdinal("Documento")),
        Email     = r.IsDBNull(r.GetOrdinal("Email"))     ? null : r.GetString(r.GetOrdinal("Email")),
        Telefono  = r.IsDBNull(r.GetOrdinal("Telefono"))  ? null : r.GetString(r.GetOrdinal("Telefono")),
        Direccion = r.IsDBNull(r.GetOrdinal("Direccion")) ? null : r.GetString(r.GetOrdinal("Direccion")),
        TipoDocumento = r.IsDBNull(r.GetOrdinal("TipoDocumento")) ? null : r.GetString(r.GetOrdinal("TipoDocumento")),
        FechaNacimiento = TieneCol(r, "FechaNacimiento") && !r.IsDBNull(r.GetOrdinal("FechaNacimiento")) ? r.GetDateTime(r.GetOrdinal("FechaNacimiento")) : null,
        OficinaId = TieneCol(r, "OficinaId") && !r.IsDBNull(r.GetOrdinal("OficinaId")) ? r.GetInt32(r.GetOrdinal("OficinaId")) : null,
        FechaAlta = r.GetDateTime(r.GetOrdinal("FechaAlta")),
        Activo    = r.GetBoolean(r.GetOrdinal("Activo"))
    };

    private static bool TieneCol(SqlDataReader r, string col)
    {
        for (int i = 0; i < r.FieldCount; i++)
            if (string.Equals(r.GetName(i), col, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }
}
