using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class AuditoriaRepository : IAuditoriaRepository
{
    private readonly IDbConnectionFactory _factory;

    public AuditoriaRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<AuditoriaCambio>> GetPorRegistroAsync(string tabla, int registroId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Auditoria_GetPorRegistro", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Tabla",      tabla);
        cmd.Parameters.AddWithValue("@RegistroId", registroId);

        var lista = new List<AuditoriaCambio>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new AuditoriaCambio
            {
                Id            = reader.GetInt32(reader.GetOrdinal("Id")),
                Tabla         = reader.GetString(reader.GetOrdinal("Tabla")),
                RegistroId    = reader.GetInt32(reader.GetOrdinal("RegistroId")),
                Campo         = reader.GetString(reader.GetOrdinal("Campo")),
                ValorAnterior = reader.IsDBNull(reader.GetOrdinal("ValorAnterior")) ? null : reader.GetString(reader.GetOrdinal("ValorAnterior")),
                ValorNuevo    = reader.IsDBNull(reader.GetOrdinal("ValorNuevo"))    ? null : reader.GetString(reader.GetOrdinal("ValorNuevo")),
                UsuarioId     = reader.GetInt32(reader.GetOrdinal("UsuarioId")),
                Fecha         = reader.GetDateTime(reader.GetOrdinal("Fecha"))
            });
        }
        return lista;
    }
}
