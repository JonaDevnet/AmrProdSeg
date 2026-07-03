using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class AltaRepository : IAltaRepository
{
    private readonly IDbConnectionFactory _factory;

    public AltaRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<(int ClienteId, int? VehiculoId, int PolizaId)> AltaCompletaAsync(
        Cliente cliente, Vehiculo? vehiculo, Poliza poliza,
        Func<int, IEnumerable<Cobro>> cuotasFactory)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var tran = (SqlTransaction)await conn.BeginTransactionAsync();

        try
        {
            // Cliente existente (Id > 0): se reutiliza. Si no, se crea.
            var clienteId = cliente.Id > 0
                ? cliente.Id
                : await EscalarAsync(conn, tran, "sp_Cliente_Insertar",
                    ("@Nombre", cliente.Nombre),
                    ("@Documento", cliente.Documento),
                    ("@Email", (object?)cliente.Email ?? DBNull.Value),
                    ("@Telefono", (object?)cliente.Telefono ?? DBNull.Value),
                    ("@Direccion", (object?)cliente.Direccion ?? DBNull.Value),
                    ("@TipoDocumento", (object?)cliente.TipoDocumento ?? DBNull.Value));

            int? vehiculoId = null;
            if (vehiculo != null)
            {
                vehiculoId = await EscalarAsync(conn, tran, "sp_Vehiculo_Insertar",
                    ("@ClienteId", clienteId),
                    ("@Marca", vehiculo.Marca),
                    ("@Modelo", vehiculo.Modelo),
                    ("@Anio", vehiculo.Anio),
                    ("@Patente", vehiculo.Patente),
                    ("@Chasis", (object?)vehiculo.Chasis ?? DBNull.Value),
                    ("@Motor", (object?)vehiculo.Motor ?? DBNull.Value),
                    ("@TipoCobertura", (object?)vehiculo.TipoCobertura ?? DBNull.Value),
                    ("@Combustion", (object?)vehiculo.Combustion ?? DBNull.Value));
            }

            var polizaId = await EscalarAsync(conn, tran, "sp_Poliza_Insertar",
                ("@ClienteId", clienteId),
                ("@VehiculoId", (object?)vehiculoId ?? DBNull.Value),
                ("@CompaniaId", poliza.CompaniaId),
                ("@FechaInicio", poliza.FechaInicio),
                ("@FechaFin", poliza.FechaFin),
                ("@PrecioTotal", poliza.PrecioTotal),
                ("@CantidadCuotas", poliza.CantidadCuotas),
                ("@Estado", (int)poliza.Estado),
                ("@PolizaOrigenId", (object?)poliza.PolizaOrigenId ?? DBNull.Value),
                ("@FechaEmision", poliza.FechaEmision),
                ("@RamoId", (object?)poliza.RamoId ?? DBNull.Value),
                ("@FormaPago", (object?)poliza.FormaPago ?? DBNull.Value),
                ("@PrimaOG", (object?)poliza.PrimaOG ?? DBNull.Value),
                ("@EnTramite", true),   // las altas salen "en trámite" (E/T) hasta asignar Nº definitivo
                ("@VendedorId", (object?)poliza.VendedorId ?? DBNull.Value),
                ("@Cobertura", (object?)poliza.Cobertura ?? DBNull.Value));

            foreach (var c in cuotasFactory(polizaId))
            {
                await EjecutarAsync(conn, tran, "sp_Cobro_Insertar",
                    ("@PolizaId", c.PolizaId),
                    ("@NumeroCuota", c.NumeroCuota),
                    ("@FechaVencimiento", c.FechaVencimiento),
                    ("@Monto", c.Monto),
                    ("@Estado", (int)c.Estado));
            }

            await tran.CommitAsync();
            return (clienteId, vehiculoId, polizaId);
        }
        catch
        {
            await tran.RollbackAsync();
            throw;
        }
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
