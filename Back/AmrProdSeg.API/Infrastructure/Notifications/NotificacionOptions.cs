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

public class ResendOptions
{
    public bool Habilitado { get; set; }                       // false: el email queda sin enviarse
    public string ApiKey { get; set; } = string.Empty;         // API key de Resend (secreto, va por env)
    public string From { get; set; } = string.Empty;           // ej. "no-reply@amrprodseg.com" (dominio VERIFICADO en Resend)
    public string FromNombre { get; set; } = "AMR Producción de Seguros";
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
    public int DiasVencida { get; set; } = 3;              // días DESPUÉS del vencimiento para el aviso de cuota vencida
    public string CronDiario { get; set; } = "0 0 9 * * ?"; // 09:00 todos los días — SOLO email (masivo, sin riesgo de baneo)

    // ── WhatsApp "goteo" (anti-baneo): 1 mensaje por disparo, espaciado y en horario humano ──
    // Cron por defecto: cada 5 min, en horas alternadas 9,11,13,15,17,19 (1h sí / 1h no).
    public string WhatsAppCronGoteo { get; set; } = "0 0/5 9,11,13,15,17,19 * * ?";
    public int WhatsAppMaxPorDia { get; set; } = 60;      // tope de seguridad de envíos por día
    public int WhatsAppJitterSegMin { get; set; } = 30;   // demora aleatoria mínima antes de enviar (que no se vea robótico)
    public int WhatsAppJitterSegMax { get; set; } = 60;   // demora aleatoria máxima
}
