using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class EliminacionRepository : IEliminacionRepository
{
    private readonly IDbConnectionFactory _factory;
    public EliminacionRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<(int Id, bool YaExistia)> SolicitarAsync(int polizaId, int usuarioId, string? motivo)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_EliminacionPoliza_Solicitar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@PolizaId", polizaId);
        cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
        cmd.Parameters.AddWithValue("@Motivo", (object?)motivo ?? DBNull.Value);
        using var r = await cmd.ExecuteReaderAsync();
        if (!await r.ReadAsync()) return (0, false);
        return (r.GetInt32(r.GetOrdinal("Id")), r.GetBoolean(r.GetOrdinal("YaExistia")));
    }

    public Task<int> AprobarAsync(int id, int adminId)
        => EscalarAsync("sp_EliminacionPoliza_Aprobar", ("@Id", id), ("@AdminId", adminId));

    public Task<int> RechazarAsync(int id, int adminId)
        => EscalarAsync("sp_EliminacionPoliza_Rechazar", ("@Id", id), ("@AdminId", adminId));

    public Task<List<EliminacionPoliza>> GetPendientesAsync() => LeerAsync("sp_EliminacionPoliza_GetPendientes");
    public Task<List<EliminacionPoliza>> GetHistorialAsync() => LeerAsync("sp_EliminacionPoliza_GetHistorial");
    public Task<List<EliminacionPoliza>> GetPapeleraAsync() => LeerAsync("sp_EliminacionPoliza_GetPapelera");

    public Task<int> RestaurarAsync(int polizaId, int adminId)
        => EscalarAsync("sp_EliminacionPoliza_Restaurar", ("@PolizaId", polizaId), ("@AdminId", adminId));

    public Task<int> BorrarDefinitivoAsync(int polizaId, int adminId)
        => EscalarAsync("sp_EliminacionPoliza_BorrarDefinitivo", ("@PolizaId", polizaId), ("@AdminId", adminId));

    private async Task<List<EliminacionPoliza>> LeerAsync(string sp)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand(sp, conn) { CommandType = CommandType.StoredProcedure };
        var lista = new List<EliminacionPoliza>();
        using var r = await cmd.ExecuteReaderAsync();

        bool Tiene(string col) { for (int i = 0; i < r.FieldCount; i++) if (string.Equals(r.GetName(i), col, StringComparison.OrdinalIgnoreCase)) return true; return false; }
        string? Str(string c) => Tiene(c) && !r.IsDBNull(r.GetOrdinal(c)) ? r.GetString(r.GetOrdinal(c)) : null;
        DateTime? Fecha(string c) => Tiene(c) && !r.IsDBNull(r.GetOrdinal(c)) ? r.GetDateTime(r.GetOrdinal(c)) : null;
        int Int(string c) => Tiene(c) && !r.IsDBNull(r.GetOrdinal(c)) ? r.GetInt32(r.GetOrdinal(c)) : 0;

        while (await r.ReadAsync())
        {
            lista.Add(new EliminacionPoliza
            {
                Id              = Int("Id"),   // la papelera trae PolizaId, no Id
                PolizaId        = Int("PolizaId"),
                PolizaNumero    = Str("PolizaNumero"),
                ClienteNombre   = Str("ClienteNombre"),
                Patente         = Str("Patente"),
                CantidadCuotas  = Int("CantidadCuotas"),
                CuotasPagadas   = Int("CuotasPagadas"),
                Estado          = Int("Estado"),
                Motivo          = Str("Motivo"),
                FechaSolicitud  = r.GetDateTime(r.GetOrdinal("FechaSolicitud")),
                FechaResolucion = Fecha("FechaResolucion"),
                FechaEliminacion = Fecha("FechaEliminacion"),
                Solicitante     = Str("Solicitante"),
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
