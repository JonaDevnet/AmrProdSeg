using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace AmrProdSeg.API.Infrastructure.Data;

/// <summary>Healthcheck que verifica conectividad con SQL Server.</summary>
public class DbHealthCheck : IHealthCheck
{
    private readonly IDbConnectionFactory _factory;

    public DbHealthCheck(IDbConnectionFactory factory) => _factory = factory;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            using var conn = _factory.Create();
            await conn.OpenAsync(cancellationToken);
            using var cmd = new SqlCommand("SELECT 1", conn);
            await cmd.ExecuteScalarAsync(cancellationToken);
            return HealthCheckResult.Healthy("Base de datos accesible.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("No se pudo conectar a la base de datos.", ex);
        }
    }
}
