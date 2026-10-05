using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace AmrProdSeg.API.Security.RealTime;

/// <summary>
/// Hub de notificaciones en tiempo real. El servidor emite el evento "notificaciones"
/// (con un tipo liviano) y el frontend refresca sus consultas de la campanita.
/// </summary>
[Authorize]
public class NotificacionesHub : Hub
{
}
