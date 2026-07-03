namespace AmrProdSeg.API.Infrastructure.Notifications;

public class SmtpOptions
{
    public bool Habilitado { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UsarSsl { get; set; } = true;
    public string Usuario { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string FromNombre { get; set; } = "AMR Producción Seguros";
}

public class EvolutionOptions
{
    public bool Habilitado { get; set; }            // ← false: la función queda sin correr
    public string BaseUrl { get; set; } = string.Empty;
    public string Instance { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
}

public class NotificacionOptions
{
    public int DiasAnticipacion { get; set; } = 3;
    public string CronDiario { get; set; } = "0 0 9 * * ?"; // 09:00 todos los días
}
