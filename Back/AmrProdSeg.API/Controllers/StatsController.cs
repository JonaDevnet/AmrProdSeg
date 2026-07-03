using System.Data;
using AmrProdSeg.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Route("api/stats")]
public class StatsController : ControllerBase
{
    private readonly IDbConnectionFactory _factory;

    public StatsController(IDbConnectionFactory factory) => _factory = factory;

    /// <summary>
    /// Conteos para el panel de bienvenida del login. Público (sin auth).
    /// </summary>
    [HttpGet("publicas")]
    [AllowAnonymous]
    public async Task<IActionResult> Publicas()
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var cmd = new SqlCommand("sp_Stats_Publicas", conn) { CommandType = CommandType.StoredProcedure };
        using var r = await cmd.ExecuteReaderAsync();
        if (!await r.ReadAsync())
            return Ok(new { polizasActivas = 0, clientes = 0, companias = 0 });
        return Ok(new
        {
            polizasActivas = r.GetInt32(0),
            clientes = r.GetInt32(1),
            companias = r.GetInt32(2),
        });
    }
}
