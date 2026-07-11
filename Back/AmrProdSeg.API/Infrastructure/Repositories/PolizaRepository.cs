using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class PolizaRepository : IPolizaRepository
{
    private readonly IDbConnectionFactory _factory;

    public PolizaRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<Poliza?> GetByIdAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Poliza_GetById", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id", id);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        var poliza = MapPoliza(reader);
        if (Tiene(reader, "RamoNombre") && !reader.IsDBNull(reader.GetOrdinal("RamoNombre")))
            poliza.RamoNombre = reader.GetString(reader.GetOrdinal("RamoNombre"));
        return poliza;
    }

    public async Task<Poliza?> GetByTokenAsync(Guid token)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Poliza_GetByToken", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Token", token);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        var poliza = MapPoliza(reader);
        if (Tiene(reader, "RamoNombre") && !reader.IsDBNull(reader.GetOrdinal("RamoNombre")))
            poliza.RamoNombre = reader.GetString(reader.GetOrdinal("RamoNombre"));
        return poliza;
    }

    public async Task<int> InsertarAsync(Poliza p)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Poliza_Insertar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@ClienteId",      p.ClienteId);
        cmd.Parameters.AddWithValue("@VehiculoId",     (object?)p.VehiculoId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@CompaniaId",     p.CompaniaId);
        cmd.Parameters.AddWithValue("@FechaInicio",    p.FechaInicio);
        cmd.Parameters.AddWithValue("@FechaFin",       p.FechaFin);
        cmd.Parameters.AddWithValue("@PrecioTotal",    p.PrecioTotal);
        cmd.Parameters.AddWithValue("@CantidadCuotas", p.CantidadCuotas);
        cmd.Parameters.AddWithValue("@Estado",         (int)p.Estado);
        cmd.Parameters.AddWithValue("@PolizaOrigenId", (object?)p.PolizaOrigenId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@FechaEmision",   p.FechaEmision);
        cmd.Parameters.AddWithValue("@RamoId",         (object?)p.RamoId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@FormaPago",      (object?)p.FormaPago ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@PrimaOG",        (object?)p.PrimaOG ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@EnTramite",      false);  // renovaciones/otros: número POL- normal
        cmd.Parameters.AddWithValue("@VendedorId",     (object?)p.VendedorId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Cobertura",      (object?)p.Cobertura ?? DBNull.Value);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<Poliza?> GetActivaPorVehiculoAsync(int vehiculoId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Poliza_GetActivaPorVehiculo", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@VehiculoId", vehiculoId);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return MapPoliza(reader);
    }

    public async Task ActualizarAsync(Poliza p)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Poliza_Actualizar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id",            p.Id);
        cmd.Parameters.AddWithValue("@CompaniaId",    p.CompaniaId);
        cmd.Parameters.AddWithValue("@RamoId",        (object?)p.RamoId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@FechaInicio",   p.FechaInicio);
        cmd.Parameters.AddWithValue("@FechaFin",      p.FechaFin);
        cmd.Parameters.AddWithValue("@PrecioTotal",   p.PrecioTotal);
        cmd.Parameters.AddWithValue("@CantidadCuotas", p.CantidadCuotas);
        cmd.Parameters.AddWithValue("@FormaPago",     (object?)p.FormaPago ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@PrimaOG",       (object?)p.PrimaOG ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Cobertura",     (object?)p.Cobertura ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<int> AsignarNumeroAsync(int id, string numero)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Poliza_AsignarNumero", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Id", id);
        cmd.Parameters.AddWithValue("@Numero", numero);
        return Convert.ToInt32(await cmd.ExecuteScalarAsync());
    }

    public async Task CambiarEstadoAsync(int id, EstadoPoliza estado)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Poliza_CambiarEstado", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id",     id);
        cmd.Parameters.AddWithValue("@Estado", (int)estado);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<Poliza>> BuscarAsync(string termino, int page, int pageSize)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Poliza_Buscar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Termino",  termino);
        cmd.Parameters.AddWithValue("@Offset",   (page - 1) * pageSize);
        cmd.Parameters.AddWithValue("@PageSize", pageSize);

        var lista = new List<Poliza>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            lista.Add(MapPoliza(reader));
        return lista;
    }

    public async Task<(List<Poliza> Items, int Total)> ListarAsync(int? clienteId, int? estado, int page, int pageSize, int? usuarioId = null, bool esAdmin = false)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Poliza_Listar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@ClienteId", (object?)clienteId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Estado",    (object?)estado ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Offset",    (page - 1) * pageSize);
        cmd.Parameters.AddWithValue("@PageSize",  pageSize);
        cmd.Parameters.AddWithValue("@UsuarioId", (object?)usuarioId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@EsAdmin",   esAdmin);

        var lista = new List<Poliza>();
        int total = 0;
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var poliza = MapPoliza(reader);
            poliza.ClienteNombre = reader.GetString(reader.GetOrdinal("ClienteNombre"));
            poliza.Patente = reader.IsDBNull(reader.GetOrdinal("Patente")) ? null : reader.GetString(reader.GetOrdinal("Patente"));
            if (Tiene(reader, "VehiculoMarca"))  poliza.Marca  = reader.IsDBNull(reader.GetOrdinal("VehiculoMarca"))  ? null : reader.GetString(reader.GetOrdinal("VehiculoMarca"));
            if (Tiene(reader, "VehiculoModelo")) poliza.Modelo = reader.IsDBNull(reader.GetOrdinal("VehiculoModelo")) ? null : reader.GetString(reader.GetOrdinal("VehiculoModelo"));
            poliza.RamoNombre = reader.IsDBNull(reader.GetOrdinal("RamoNombre")) ? null : reader.GetString(reader.GetOrdinal("RamoNombre"));
            if (Tiene(reader, "CuotasTotal"))    poliza.CuotasTotal    = reader.GetInt32(reader.GetOrdinal("CuotasTotal"));
            if (Tiene(reader, "CuotasPagadas"))  poliza.CuotasPagadas  = reader.GetInt32(reader.GetOrdinal("CuotasPagadas"));
            if (Tiene(reader, "CuotasVencidas")) poliza.CuotasVencidas = reader.GetInt32(reader.GetOrdinal("CuotasVencidas"));
            lista.Add(poliza);
            total = reader.GetInt32(reader.GetOrdinal("Total"));
        }
        return (lista, total);
    }

    // Mapeo completo (sp_Poliza_GetById / GetActivaPorVehiculo / Listar / Buscar)
    private static Poliza MapPoliza(SqlDataReader r) => new()
    {
        Id             = r.GetInt32(r.GetOrdinal("Id")),
        Numero         = r.GetString(r.GetOrdinal("Numero")),
        ClienteId      = r.GetInt32(r.GetOrdinal("ClienteId")),
        VehiculoId     = r.IsDBNull(r.GetOrdinal("VehiculoId")) ? null : r.GetInt32(r.GetOrdinal("VehiculoId")),
        CompaniaId     = r.GetInt32(r.GetOrdinal("CompaniaId")),
        FechaInicio    = r.GetDateTime(r.GetOrdinal("FechaInicio")),
        FechaFin       = r.GetDateTime(r.GetOrdinal("FechaFin")),
        PrecioTotal    = r.GetDecimal(r.GetOrdinal("PrecioTotal")),
        CantidadCuotas = r.GetInt32(r.GetOrdinal("CantidadCuotas")),
        Estado         = (EstadoPoliza)r.GetInt32(r.GetOrdinal("Estado")),
        FechaEmision   = r.GetDateTime(r.GetOrdinal("FechaEmision")),
        PolizaOrigenId = r.IsDBNull(r.GetOrdinal("PolizaOrigenId"))
                         ? null
                         : r.GetInt32(r.GetOrdinal("PolizaOrigenId")),
        RamoId         = Tiene(r, "RamoId") && !r.IsDBNull(r.GetOrdinal("RamoId"))
                         ? r.GetInt32(r.GetOrdinal("RamoId"))
                         : null,
        FormaPago      = Tiene(r, "FormaPago") && !r.IsDBNull(r.GetOrdinal("FormaPago"))
                         ? r.GetString(r.GetOrdinal("FormaPago"))
                         : null,
        PrimaOG        = Tiene(r, "PrimaOG") && !r.IsDBNull(r.GetOrdinal("PrimaOG"))
                         ? r.GetDecimal(r.GetOrdinal("PrimaOG"))
                         : null,
        Cobertura      = Tiene(r, "Cobertura") && !r.IsDBNull(r.GetOrdinal("Cobertura"))
                         ? r.GetString(r.GetOrdinal("Cobertura"))
                         : null,
        TokenPublico   = Tiene(r, "TokenPublico") && !r.IsDBNull(r.GetOrdinal("TokenPublico"))
                         ? r.GetGuid(r.GetOrdinal("TokenPublico"))
                         : Guid.Empty,
        VendedorNombre = Tiene(r, "VendedorNombre") && !r.IsDBNull(r.GetOrdinal("VendedorNombre"))
                         ? r.GetString(r.GetOrdinal("VendedorNombre"))
                         : null,
        ClienteVendedorNombre = Tiene(r, "ClienteVendedorNombre") && !r.IsDBNull(r.GetOrdinal("ClienteVendedorNombre"))
                         ? r.GetString(r.GetOrdinal("ClienteVendedorNombre"))
                         : null
    };

    private static bool Tiene(SqlDataReader r, string col)
    {
        for (int i = 0; i < r.FieldCount; i++)
            if (string.Equals(r.GetName(i), col, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }
}
