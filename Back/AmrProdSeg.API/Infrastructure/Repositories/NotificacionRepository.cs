using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class NotificacionRepository : INotificacionRepository
{
    private readonly IDbConnectionFactory _factory;

    public NotificacionRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<PolizaVencimiento>> GetPolizasPorVencerAsync(int dias)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Notif_PolizasPorVencer", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Dias", dias);

        var lista = new List<PolizaVencimiento>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new PolizaVencimiento
            {
                PolizaId      = reader.GetInt32(reader.GetOrdinal("PolizaId")),
                Numero        = reader.GetString(reader.GetOrdinal("Numero")),
                FechaFin      = reader.GetDateTime(reader.GetOrdinal("FechaFin")),
                ClienteNombre = reader.GetString(reader.GetOrdinal("ClienteNombre")),
                Email         = reader.IsDBNull(reader.GetOrdinal("Email"))    ? null : reader.GetString(reader.GetOrdinal("Email")),
                Telefono      = reader.IsDBNull(reader.GetOrdinal("Telefono")) ? null : reader.GetString(reader.GetOrdinal("Telefono")),
                Patente       = reader.GetString(reader.GetOrdinal("Patente")),
                Compania      = reader.GetString(reader.GetOrdinal("Compania"))
            });
        }
        return lista;
    }

    public async Task<List<CuotaVencimiento>> GetCuotasPorVencerAsync(int dias)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Notif_CuotasPorVencer", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Dias", dias);

        var lista = new List<CuotaVencimiento>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new CuotaVencimiento
            {
                CobroId          = reader.GetInt32(reader.GetOrdinal("CobroId")),
                NumeroCuota      = reader.GetInt32(reader.GetOrdinal("NumeroCuota")),
                Monto            = reader.GetDecimal(reader.GetOrdinal("Monto")),
                FechaVencimiento = reader.GetDateTime(reader.GetOrdinal("FechaVencimiento")),
                NroPoliza        = reader.GetString(reader.GetOrdinal("NroPoliza")),
                ClienteNombre    = reader.GetString(reader.GetOrdinal("ClienteNombre")),
                Email            = reader.IsDBNull(reader.GetOrdinal("Email"))    ? null : reader.GetString(reader.GetOrdinal("Email")),
                Telefono         = reader.IsDBNull(reader.GetOrdinal("Telefono")) ? null : reader.GetString(reader.GetOrdinal("Telefono"))
            });
        }
        return lista;
    }

    public async Task<bool> YaEnviadaAsync(string tipo, int referenciaId, string canal)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Notif_YaEnviada", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Tipo",         tipo);
        cmd.Parameters.AddWithValue("@ReferenciaId", referenciaId);
        cmd.Parameters.AddWithValue("@Canal",        canal);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result) > 0;
    }

    public async Task RegistrarAsync(string tipo, int referenciaId, string canal, string? destino)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Notif_Registrar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Tipo",         tipo);
        cmd.Parameters.AddWithValue("@ReferenciaId", referenciaId);
        cmd.Parameters.AddWithValue("@Canal",        canal);
        cmd.Parameters.AddWithValue("@Destino",      (object?)destino ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }
}
