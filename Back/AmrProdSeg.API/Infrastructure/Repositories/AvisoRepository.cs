using System.Data;
using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class AvisoRepository : IAvisoRepository
{
    private readonly IDbConnectionFactory _factory;
    public AvisoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task InsertarExportacionAsync(int? usuarioId, int? polizaId, string? polizaNumero, string? clienteNombre)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_AvisoExportacion_Insertar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@UsuarioId", (object?)usuarioId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@UsuarioNombre", DBNull.Value);
        cmd.Parameters.AddWithValue("@PolizaId", (object?)polizaId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@PolizaNumero", (object?)polizaNumero ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@ClienteNombre", (object?)clienteNombre ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<AvisoExportacionDto>> ListarExportacionesAsync(int top)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_AvisoExportacion_Listar", conn) { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@Top", top);
        var lista = new List<AvisoExportacionDto>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new AvisoExportacionDto
            {
                Id = reader.GetInt32(reader.GetOrdinal("Id")),
                UsuarioId = reader.IsDBNull(reader.GetOrdinal("UsuarioId")) ? null : reader.GetInt32(reader.GetOrdinal("UsuarioId")),
                UsuarioNombre = reader.IsDBNull(reader.GetOrdinal("UsuarioNombre")) ? null : reader.GetString(reader.GetOrdinal("UsuarioNombre")),
                PolizaId = reader.IsDBNull(reader.GetOrdinal("PolizaId")) ? null : reader.GetInt32(reader.GetOrdinal("PolizaId")),
                PolizaNumero = reader.IsDBNull(reader.GetOrdinal("PolizaNumero")) ? null : reader.GetString(reader.GetOrdinal("PolizaNumero")),
                ClienteNombre = reader.IsDBNull(reader.GetOrdinal("ClienteNombre")) ? null : reader.GetString(reader.GetOrdinal("ClienteNombre")),
                Fecha = reader.GetDateTime(reader.GetOrdinal("Fecha")),
            });
        }
        return lista;
    }
}
