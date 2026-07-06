using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class EndosoRepository : IEndosoRepository
{
    private readonly IDbConnectionFactory _factory;

    public EndosoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> EndosarTitularAsync(
        int polizaId, int titularAnteriorId, Cliente clienteNuevo,
        int? vehiculoId, int? usuarioId, string? motivo)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var tran = (SqlTransaction)await conn.BeginTransactionAsync();

        try
        {
            // Cliente nuevo: si viene con Id > 0 se reutiliza; si no, se crea.
            var nuevoClienteId = clienteNuevo.Id > 0
                ? clienteNuevo.Id
                : await EscalarAsync(conn, tran, "sp_Cliente_Insertar",
                    ("@Nombre", clienteNuevo.Nombre),
                    ("@Documento", clienteNuevo.Documento),
                    ("@Email", (object?)clienteNuevo.Email ?? DBNull.Value),
                    ("@Telefono", (object?)clienteNuevo.Telefono ?? DBNull.Value),
                    ("@Direccion", (object?)clienteNuevo.Direccion ?? DBNull.Value),
                    ("@TipoDocumento", (object?)clienteNuevo.TipoDocumento ?? DBNull.Value));

            // Registro del endoso (guarda el titular anterior)
            await EjecutarAsync(conn, tran, "sp_Endoso_Insertar",
                ("@PolizaId", polizaId),
                ("@ClienteAnteriorId", titularAnteriorId),
                ("@ClienteNuevoId", nuevoClienteId),
                ("@UsuarioId", (object?)usuarioId ?? DBNull.Value),
                ("@Motivo", (object?)motivo ?? DBNull.Value));

            // La póliza cambia sólo el titular
            await EjecutarAsync(conn, tran, "sp_Poliza_CambiarTitular",
                ("@PolizaId", polizaId), ("@ClienteId", nuevoClienteId));

            // El vehículo asegurado se mueve al nuevo titular
            if (vehiculoId.HasValue)
                await EjecutarAsync(conn, tran, "sp_Vehiculo_CambiarCliente",
                    ("@VehiculoId", vehiculoId.Value), ("@ClienteId", nuevoClienteId));

            await tran.CommitAsync();
            return nuevoClienteId;
        }
        catch
        {
            await tran.RollbackAsync();
            throw;
        }
    }

    public async Task<List<EndosoTitular>> GetPorPolizaAsync(int polizaId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Endoso_GetPorPoliza", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@PolizaId", polizaId);

        var lista = new List<EndosoTitular>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new EndosoTitular
            {
                Id                       = reader.GetInt32(reader.GetOrdinal("Id")),
                PolizaId                 = reader.GetInt32(reader.GetOrdinal("PolizaId")),
                FechaEndoso              = reader.GetDateTime(reader.GetOrdinal("FechaEndoso")),
                ClienteAnteriorId        = reader.GetInt32(reader.GetOrdinal("ClienteAnteriorId")),
                ClienteAnteriorNombre    = reader.GetString(reader.GetOrdinal("ClienteAnteriorNombre")),
                ClienteAnteriorDocumento = reader.IsDBNull(reader.GetOrdinal("ClienteAnteriorDocumento")) ? null : reader.GetString(reader.GetOrdinal("ClienteAnteriorDocumento")),
                ClienteNuevoId           = reader.GetInt32(reader.GetOrdinal("ClienteNuevoId")),
                ClienteNuevoNombre       = reader.GetString(reader.GetOrdinal("ClienteNuevoNombre")),
                ClienteNuevoDocumento    = reader.IsDBNull(reader.GetOrdinal("ClienteNuevoDocumento")) ? null : reader.GetString(reader.GetOrdinal("ClienteNuevoDocumento")),
                UsuarioNombre            = reader.IsDBNull(reader.GetOrdinal("UsuarioNombre")) ? null : reader.GetString(reader.GetOrdinal("UsuarioNombre")),
                Motivo                   = reader.IsDBNull(reader.GetOrdinal("Motivo")) ? null : reader.GetString(reader.GetOrdinal("Motivo")),
            });
        }
        return lista;
    }

    private static async Task<int> EscalarAsync(
        SqlConnection conn, SqlTransaction tran, string sp, params (string, object)[] ps)
    {
        using var cmd = Crear(conn, tran, sp, ps);
        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    private static async Task EjecutarAsync(
        SqlConnection conn, SqlTransaction tran, string sp, params (string, object)[] ps)
    {
        using var cmd = Crear(conn, tran, sp, ps);
        await cmd.ExecuteNonQueryAsync();
    }

    private static SqlCommand Crear(
        SqlConnection conn, SqlTransaction tran, string sp, (string Nombre, object Valor)[] ps)
    {
        var cmd = new SqlCommand(sp, conn, tran) { CommandType = CommandType.StoredProcedure };
        foreach (var (nombre, valor) in ps)
            cmd.Parameters.AddWithValue(nombre, valor);
        return cmd;
    }
}
