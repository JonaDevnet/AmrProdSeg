using AmrProdSeg.API.Infrastructure.Interfaces;
using Quartz;

namespace AmrProdSeg.API.Infrastructure.Jobs;

/// <summary>
/// Job diario (Quartz.NET) que marca como Vencidas las cuotas Pendientes
/// cuya fecha de vencimiento ya pasó. Ejecuta sp_Cobro_MarcarVencidos.
/// </summary>
[DisallowConcurrentExecution]
public class MarcarCobrosVencidosJob : IJob
{
    private readonly ICobroRepository _cobroRepo;
    private readonly ILogger<MarcarCobrosVencidosJob> _logger;

    public MarcarCobrosVencidosJob(
        ICobroRepository cobroRepo,
        ILogger<MarcarCobrosVencidosJob> logger)
    {
        _cobroRepo = cobroRepo;
        _logger    = logger;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        _logger.LogInformation("Ejecutando MarcarCobrosVencidosJob a las {Hora}", DateTime.UtcNow);
        await _cobroRepo.MarcarVencidosAsync();
    }
}
