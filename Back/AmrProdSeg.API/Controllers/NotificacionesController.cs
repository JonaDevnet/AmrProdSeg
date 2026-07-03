using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Quartz;

namespace AmrProdSeg.API.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public class NotificacionesController : ControllerBase
{
    private readonly ISchedulerFactory _schedulerFactory;

    public NotificacionesController(ISchedulerFactory schedulerFactory)
        => _schedulerFactory = schedulerFactory;

    /// <summary>
    /// Dispara el job de recordatorios de vencimiento a demanda (sólo Admin).
    /// Útil para probar la activación de Email/WhatsApp sin esperar al cron diario.
    /// Los envíos reales sólo ocurren si Smtp/Evolution están Habilitado=true;
    /// si no, quedan registrados en el log como "DESACTIVADO".
    /// </summary>
    [HttpPost("ejecutar")]
    public async Task<IActionResult> Ejecutar()
    {
        var scheduler = await _schedulerFactory.GetScheduler();
        await scheduler.TriggerJob(new JobKey("NotificacionVencimientosJob"));
        return Accepted(new
        {
            mensaje = "Job de notificaciones disparado. Revisá los logs o la tabla NotificacionesVencimiento."
        });
    }
}
