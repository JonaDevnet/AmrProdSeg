using System.Data;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

/// <summary>
/// Repositorio genérico de reportes: ejecuta un SP y devuelve las filas como
/// diccionarios columna→valor, listas para serializar a JSON o exportar.
/// </summary>
public class ReporteRepository : IReporteRepository
{
    private readonly IDbConnectionFactory _factory;

    public ReporteRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<Dictionary<string, object?>>> EjecutarAsync(
        string storedProcedure, params (string Nombre, object? Valor)[] parametros)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand(storedProcedure, conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        foreach (var (nombre, valor) in parametros)
            cmd.Parameters.AddWithValue(nombre, valor ?? DBNull.Value);

        var filas = new List<Dictionary<string, object?>>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            filas.Add(LeerFila(reader));
        return filas;
    }

    public async Task<(List<Dictionary<string, object?>> Detalle, Dictionary<string, object?>? Totales)> EjecutarDetalleTotalesAsync(
        string storedProcedure, params (string Nombre, object? Valor)[] parametros)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand(storedProcedure, conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        foreach (var (nombre, valor) in parametros)
            cmd.Parameters.AddWithValue(nombre, valor ?? DBNull.Value);

        var detalle = new List<Dictionary<string, object?>>();
        Dictionary<string, object?>? totales = null;

        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            detalle.Add(LeerFila(reader));

        // Segundo result set: totales (una fila)
        if (await reader.NextResultAsync() && await reader.ReadAsync())
            totales = LeerFila(reader);

        return (detalle, totales);
    }

    private static Dictionary<string, object?> LeerFila(SqlDataReader reader)
    {
        var fila = new Dictionary<string, object?>(reader.FieldCount);
        for (int i = 0; i < reader.FieldCount; i++)
            fila[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
        return fila;
    }
}
