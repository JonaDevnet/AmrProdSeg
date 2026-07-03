using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class AnulacionRepository : IAnulacionRepository
{
    private readonly IDbConnectionFactory _factory;
    public AnulacionRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> AnularPagoDirectoAsync(int cobroId)
        => await EscalarAsync("sp_Cobro_AnularPago", ("@CobroId", cobroId));

    public async Task<int> SolicitarAsync(int cobroId, int usuarioId, string? motivo)
        => await EscalarAsync("sp_Anulacion_Solicitar",
            ("@CobroId", cobroId), ("@UsuarioId", usuarioId), ("@Motivo", (object?)motivo ?? DBNull.Value));

    public async Task<int> AprobarAsync(int id, int adminId)
        => await EscalarAsync("sp_Anulacion_Aprobar", ("@Id", id), ("@AdminId", adminId));

    public async Task<int> RechazarAsync(int id, int adminId)
        => await EscalarAsync("sp_Anulacion_Rechazar", ("@Id", id), ("@AdminId", adminId));

    public async Task<List<AnulacionCobro>> GetPendientesAsync()
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Anulacion_GetPendientes", conn) { CommandType = CommandType.StoredProcedure };
        var lista = new List<AnulacionCobro>();
        using var r = await cmd.ExecuteReaderAsync();
        while (await r.ReadAsync())
        {
            lista.Add(new AnulacionCobro
            {
                Id             = r.GetInt32(r.GetOrdinal("Id")),
                CobroId        = r.GetInt32(r.GetOrdinal("CobroId")),
                Motivo         = r.IsDBNull(r.GetOrdinal("Motivo")) ? null : r.GetString(r.GetOrdinal("Motivo")),
                FechaSolicitud = r.GetDateTime(r.GetOrdinal("FechaSolicitud")),
                NumeroCuota    = r.GetInt32(r.GetOrdinal("NumeroCuota")),
                Monto          = r.GetDecimal(r.GetOrdinal("Monto")),
                NroPoliza      = r.IsDBNull(r.GetOrdinal("NroPoliza")) ? null : r.GetString(r.GetOrdinal("NroPoliza")),
                ClienteNombre  = r.IsDBNull(r.GetOrdinal("ClienteNombre")) ? null : r.GetString(r.GetOrdinal("ClienteNombre")),
                Solicitante    = r.IsDBNull(r.GetOrdinal("Solicitante")) ? null : r.GetString(r.GetOrdinal("Solicitante")),
            });
        }
        return lista;
    }

    private async Task<int> EscalarAsync(string sp, params (string, object)[] ps)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand(sp, conn) { CommandType = CommandType.StoredProcedure };
        foreach (var (n, v) in ps) cmd.Parameters.AddWithValue(n, v);
        var result = await cmd.ExecuteScalarAsync();
        return result is null or DBNull ? 0 : Convert.ToInt32(result);
    }
}
