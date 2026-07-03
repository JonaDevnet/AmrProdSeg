using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Infrastructure.Data;

public class DbConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(IConfiguration config)
        => _connectionString = config.GetConnectionString("AmrProdSeg")!;

    public SqlConnection Create() => new SqlConnection(_connectionString);
}
