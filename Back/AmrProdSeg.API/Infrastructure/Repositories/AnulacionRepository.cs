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

    public Task<List<AnulacionCobro>> GetPendientesAsync() => LeerAsync("sp_Anulacion_GetPendientes");
    public Task<List<AnulacionCobro>> GetHistorialAsync() => LeerAsync("sp_Anulacion_GetHistorial");

    private async Task<List<AnulacionCobro>> LeerAsync(string sp)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand(sp, conn) { CommandType = CommandType.StoredProcedure };
        var lista = new List<AnulacionCobro>();
        using var r = await cmd.ExecuteReaderAsync();

        bool Tiene(string col) { for (int i = 0; i < r.FieldCount; i++) if (string.Equals(r.GetName(i), col, StringComparison.OrdinalIgnoreCase)) return true; return false; }
        string? Str(string c) => Tiene(c) && !r.IsDBNull(r.GetOrdinal(c)) ? r.GetString(r.GetOrdinal(c)) : null;

        while (await r.ReadAsync())
        {
            lista.Add(new AnulacionCobro
            {
                Id              = r.GetInt32(r.GetOrdinal("Id")),
                CobroId         = r.GetInt32(r.GetOrdinal("CobroId")),
                Motivo          = Str("Motivo"),
                FechaSolicitud  = r.GetDateTime(r.GetOrdinal("FechaSolicitud")),
                NumeroCuota     = r.GetInt32(r.GetOrdinal("NumeroCuota")),
                Monto           = r.GetDecimal(r.GetOrdinal("Monto")),
                NroPoliza       = Str("NroPoliza"),
                ClienteNombre   = Str("ClienteNombre"),
                Solicitante     = Str("Solicitante"),
                Estado          = Tiene("Estado") ? r.GetInt32(r.GetOrdinal("Estado")) : 0,
                FechaResolucion = Tiene("FechaResolucion") && !r.IsDBNull(r.GetOrdinal("FechaResolucion")) ? r.GetDateTime(r.GetOrdinal("FechaResolucion")) : null,
                Resolvio        = Str("Resolvio"),
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
