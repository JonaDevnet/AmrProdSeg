using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class CobroRepository : ICobroRepository
{
    private readonly IDbConnectionFactory _factory;

    public CobroRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task InsertarLoteAsync(IEnumerable<Cobro> cobros)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var tran = (SqlTransaction)await conn.BeginTransactionAsync();

        try
        {
            foreach (var c in cobros)
            {
                using var cmd = new SqlCommand("sp_Cobro_Insertar", conn, tran)
                {
                    CommandType = CommandType.StoredProcedure
                };
                cmd.Parameters.AddWithValue("@PolizaId",         c.PolizaId);
                cmd.Parameters.AddWithValue("@NumeroCuota",      c.NumeroCuota);
                cmd.Parameters.AddWithValue("@FechaVencimiento", c.FechaVencimiento);
                cmd.Parameters.AddWithValue("@Monto",            c.Monto);
                cmd.Parameters.AddWithValue("@Estado",           (int)c.Estado);
                await cmd.ExecuteNonQueryAsync();
            }

            await tran.CommitAsync();
        }
        catch
        {
            await tran.RollbackAsync();
            throw;
        }
    }

    public async Task MarcarPagadoAsync(int id, DateTime fechaPago, int? metodoPagoId, int? registradoPor = null, int? metodoPago2Id = null, decimal? metodoPago2Monto = null)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cobro_MarcarPagado", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id",           id);
        cmd.Parameters.AddWithValue("@FechaPago",    fechaPago);
        cmd.Parameters.AddWithValue("@MetodoPagoId", (object?)metodoPagoId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@RegistradoPor", (object?)registradoPor ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@MetodoPago2Id", (object?)metodoPago2Id ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@MetodoPago2Monto", (object?)metodoPago2Monto ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<Cobro>> GetPendientesMesAsync(int mes, int anio)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cobro_GetPendientesMes", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Mes",  mes);
        cmd.Parameters.AddWithValue("@Anio", anio);

        var lista = new List<Cobro>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var cobro = MapCobro(reader);
            cobro.NroPoliza     = reader.GetString(reader.GetOrdinal("NroPoliza"));
            cobro.ClienteNombre = reader.GetString(reader.GetOrdinal("ClienteNombre"));
            lista.Add(cobro);
        }
        return lista;
    }

    public async Task<List<Cobro>> GetPorPolizaAsync(int polizaId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cobro_GetPorPoliza", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@PolizaId", polizaId);

        return await LeerCobrosAsync(cmd);
    }

    public async Task<Cobro?> GetByIdAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cobro_GetById", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id", id);

        var lista = await LeerCobrosAsync(cmd);
        return lista.FirstOrDefault();
    }

    public async Task MarcarVencidosAsync()
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cobro_MarcarVencidos", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task RegenerarPendientesAsync(int polizaId, decimal precioTotal, int cantidadCuotas, DateTime fechaInicio)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cobro_RegenerarPendientes", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@PolizaId",       polizaId);
        cmd.Parameters.AddWithValue("@PrecioTotal",    precioTotal);
        cmd.Parameters.AddWithValue("@CantidadCuotas", cantidadCuotas);
        cmd.Parameters.AddWithValue("@FechaInicio",    fechaInicio.Date);
        await cmd.ExecuteNonQueryAsync();
    }

    private static async Task<List<Cobro>> LeerCobrosAsync(SqlCommand cmd)
    {
        var lista = new List<Cobro>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            lista.Add(MapCobro(reader));
        return lista;
    }

    private static bool TieneCol(SqlDataReader r, string col)
    {
        for (int i = 0; i < r.FieldCount; i++)
            if (string.Equals(r.GetName(i), col, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }

    private static Cobro MapCobro(SqlDataReader reader) => new()
    {
        Id               = reader.GetInt32(reader.GetOrdinal("Id")),
        PolizaId         = reader.GetInt32(reader.GetOrdinal("PolizaId")),
        NumeroCuota      = reader.GetInt32(reader.GetOrdinal("NumeroCuota")),
        FechaVencimiento = reader.GetDateTime(reader.GetOrdinal("FechaVencimiento")),
        Monto            = reader.GetDecimal(reader.GetOrdinal("Monto")),
        Estado           = (EstadoCobro)reader.GetInt32(reader.GetOrdinal("Estado")),
        FechaPago        = reader.IsDBNull(reader.GetOrdinal("FechaPago"))
                           ? null
                           : reader.GetDateTime(reader.GetOrdinal("FechaPago")),
        MetodoPagoId     = reader.IsDBNull(reader.GetOrdinal("MetodoPagoId"))
                           ? null
                           : reader.GetInt32(reader.GetOrdinal("MetodoPagoId")),
        MetodoPago2Id    = TieneCol(reader, "MetodoPago2Id") && !reader.IsDBNull(reader.GetOrdinal("MetodoPago2Id"))
                           ? reader.GetInt32(reader.GetOrdinal("MetodoPago2Id"))
                           : null,
        MetodoPago2Monto = TieneCol(reader, "MetodoPago2Monto") && !reader.IsDBNull(reader.GetOrdinal("MetodoPago2Monto"))
                           ? reader.GetDecimal(reader.GetOrdinal("MetodoPago2Monto"))
                           : null,
        CobradorNombre   = TieneCol(reader, "CobradorNombre") && !reader.IsDBNull(reader.GetOrdinal("CobradorNombre"))
                           ? reader.GetString(reader.GetOrdinal("CobradorNombre"))
                           : null
    };
}
