using System.Data;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Repositories;

public class VehiculoRepository : IVehiculoRepository
{
    private readonly IDbConnectionFactory _factory;

    public VehiculoRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<int> InsertarAsync(Vehiculo v)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Vehiculo_Insertar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@ClienteId",     v.ClienteId);
        cmd.Parameters.AddWithValue("@Marca",         v.Marca);
        cmd.Parameters.AddWithValue("@Modelo",        v.Modelo);
        cmd.Parameters.AddWithValue("@Anio",          v.Anio);
        cmd.Parameters.AddWithValue("@Patente",       v.Patente);
        cmd.Parameters.AddWithValue("@Chasis",        (object?)v.Chasis ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Motor",         (object?)v.Motor ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@TipoCobertura", (object?)v.TipoCobertura ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Combustion",    (object?)v.Combustion ?? DBNull.Value);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task ActualizarAsync(Vehiculo v)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Vehiculo_Actualizar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id",            v.Id);
        cmd.Parameters.AddWithValue("@Marca",         v.Marca);
        cmd.Parameters.AddWithValue("@Modelo",        v.Modelo);
        cmd.Parameters.AddWithValue("@Anio",          v.Anio);
        cmd.Parameters.AddWithValue("@Chasis",        (object?)v.Chasis ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Motor",         (object?)v.Motor ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@TipoCobertura", (object?)v.TipoCobertura ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@Combustion",    (object?)v.Combustion ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<Vehiculo?> GetByPatenteAsync(string patente)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Vehiculo_GetByPatente", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Patente", patente);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return new Vehiculo
        {
            Id            = reader.GetInt32(reader.GetOrdinal("Id")),
            ClienteId     = reader.GetInt32(reader.GetOrdinal("ClienteId")),
            Marca         = reader.GetString(reader.GetOrdinal("Marca")),
            Modelo        = reader.GetString(reader.GetOrdinal("Modelo")),
            Anio          = reader.GetInt16(reader.GetOrdinal("Anio")),
            Patente       = reader.GetString(reader.GetOrdinal("Patente")),
            Chasis        = reader.IsDBNull(reader.GetOrdinal("Chasis"))        ? null : reader.GetString(reader.GetOrdinal("Chasis")),
            Motor         = reader.IsDBNull(reader.GetOrdinal("Motor"))         ? null : reader.GetString(reader.GetOrdinal("Motor")),
            TipoCobertura = reader.IsDBNull(reader.GetOrdinal("TipoCobertura")) ? null : reader.GetString(reader.GetOrdinal("TipoCobertura")),
            Combustion    = reader.IsDBNull(reader.GetOrdinal("Combustion"))    ? null : reader.GetString(reader.GetOrdinal("Combustion"))
        };
    }

    public async Task<List<Vehiculo>> GetPorClienteAsync(int clienteId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Vehiculo_GetPorCliente", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@ClienteId", clienteId);

        var lista = new List<Vehiculo>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new Vehiculo
            {
                Id            = reader.GetInt32(reader.GetOrdinal("Id")),
                ClienteId     = reader.GetInt32(reader.GetOrdinal("ClienteId")),
                Marca         = reader.GetString(reader.GetOrdinal("Marca")),
                Modelo        = reader.GetString(reader.GetOrdinal("Modelo")),
                Anio          = reader.GetInt16(reader.GetOrdinal("Anio")),
                Patente       = reader.GetString(reader.GetOrdinal("Patente")),
                Chasis        = reader.IsDBNull(reader.GetOrdinal("Chasis"))        ? null : reader.GetString(reader.GetOrdinal("Chasis")),
                Motor         = reader.IsDBNull(reader.GetOrdinal("Motor"))         ? null : reader.GetString(reader.GetOrdinal("Motor")),
                TipoCobertura = reader.IsDBNull(reader.GetOrdinal("TipoCobertura")) ? null : reader.GetString(reader.GetOrdinal("TipoCobertura")),
                Combustion    = reader.IsDBNull(reader.GetOrdinal("Combustion"))    ? null : reader.GetString(reader.GetOrdinal("Combustion"))
            });
        }
        return lista;
    }
}
