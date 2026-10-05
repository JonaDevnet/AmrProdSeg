using AmrProdSeg.API.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace AmrProdSeg.API.Security.RealTime;

/// <summary>
/// Implementación de <see cref="INotificacionPusher"/> sobre SignalR.
/// No-fatal: si el push falla no debe tumbar la operación de negocio ya confirmada.
/// </summary>
public class SignalRNotificacionPusher : INotificacionPusher
{
    private readonly IHubContext<NotificacionesHub> _hub;
    private readonly ILogger<SignalRNotificacionPusher> _logger;

    public SignalRNotificacionPusher(IHubContext<NotificacionesHub> hub, ILogger<SignalRNotificacionPusher> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public async Task NotificarAsync(string tipo)
    {
        try
        {
            await _hub.Clients.All.SendAsync("notificaciones", tipo);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo emitir la notificación en tiempo real ({Tipo}).", tipo);
        }
    }
}
