using System.Text;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Application.Services;
using AmrProdSeg.API.Infrastructure.Data;
using AmrProdSeg.API.Infrastructure.Excel;
using AmrProdSeg.API.Infrastructure.Interfaces;
using AmrProdSeg.API.Infrastructure.Jobs;
using AmrProdSeg.API.Infrastructure.Notifications;
using AmrProdSeg.API.Infrastructure.PDF;
using AmrProdSeg.API.Infrastructure.Repositories;
using AmrProdSeg.API.Security;
using AmrProdSeg.API.Security.Filters;
using AmrProdSeg.API.Security.Helpers;
using AmrProdSeg.API.Security.Middlewares;
using AspNetCoreRateLimit;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.IdentityModel.Tokens;
using Quartz;
using QuestPDF.Infrastructure;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Licencia QuestPDF (Community)
QuestPDF.Settings.License = LicenseType.Community;

// Fuentes propias para los PDFs (comprobante/ticket). Se cargan los .ttf de
// wwwroot/fonts para que local y producción (Linux) rendericen igual.
var fontsDir = Path.Combine(builder.Environment.WebRootPath ?? "wwwroot", "fonts");
if (Directory.Exists(fontsDir))
    foreach (var ttf in Directory.GetFiles(fontsDir, "*.ttf"))
        using (var fs = File.OpenRead(ttf))
            QuestPDF.Drawing.FontManager.RegisterFont(fs);

// Logging estructurado con Serilog (consola + archivo rotativo diario)
builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration)
        .WriteTo.Console()
        .WriteTo.File("logs/amrprodseg-.log", rollingInterval: RollingInterval.Day));

// ---------------- Infraestructura ----------------
builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();

// Repositorios (DAL)
builder.Services.AddScoped<IPolizaRepository,   PolizaRepository>();
builder.Services.AddScoped<ICobroRepository,    CobroRepository>();
builder.Services.AddScoped<IClienteRepository,  ClienteRepository>();
builder.Services.AddScoped<IVehiculoRepository, VehiculoRepository>();
builder.Services.AddScoped<ICompaniaRepository, CompaniaRepository>();
builder.Services.AddScoped<IAuthRepository,     AuthRepository>();
builder.Services.AddScoped<IReporteRepository,  ReporteRepository>();
builder.Services.AddScoped<IMetodoPagoRepository, MetodoPagoRepository>();
builder.Services.AddScoped<IUsuarioRepository,   UsuarioRepository>();
builder.Services.AddScoped<IAuditoriaRepository, AuditoriaRepository>();
builder.Services.AddScoped<IAltaRepository,       AltaRepository>();
builder.Services.AddScoped<IEndosoRepository,     EndosoRepository>();
builder.Services.AddScoped<INotificacionRepository, NotificacionRepository>();
builder.Services.AddScoped<IResetRepository,      ResetRepository>();
builder.Services.AddScoped<IRamoRepository,       RamoRepository>();
builder.Services.AddScoped<ICoberturaRepository,  CoberturaRepository>();
builder.Services.AddScoped<IOficinaRepository,    OficinaRepository>();
builder.Services.AddScoped<IBajaRepository,       BajaRepository>();
builder.Services.AddScoped<IAnulacionRepository,  AnulacionRepository>();
builder.Services.AddScoped<IEliminacionRepository, EliminacionRepository>();
builder.Services.AddScoped<IMovimientoRepository, MovimientoRepository>();
builder.Services.AddScoped<IConfiguracionRepository, ConfiguracionRepository>();

// Notificaciones (recordatorios de vencimiento)
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));
builder.Services.Configure<EvolutionOptions>(builder.Configuration.GetSection("Evolution"));
builder.Services.Configure<NotificacionOptions>(builder.Configuration.GetSection("Notificaciones"));
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddHttpClient<IWhatsAppSender, EvolutionApiWhatsAppSender>();

// Bloqueo geográfico (solo Argentina) — usa ipquery.io, cacheado y fail-open.
builder.Services.Configure<GeoBlockingOptions>(builder.Configuration.GetSection("GeoBlocking"));
builder.Services.AddHttpClient("geo");

// Servicios (BLL)
builder.Services.AddScoped<IPolizaService,   PolizaService>();
builder.Services.AddScoped<ICobroService,    CobroService>();
builder.Services.AddScoped<IClienteService,  ClienteService>();
builder.Services.AddScoped<IVehiculoService, VehiculoService>();
builder.Services.AddScoped<ICompaniaService, CompaniaService>();
builder.Services.AddScoped<IAuthService,     AuthService>();
builder.Services.AddScoped<IReporteService,  ReporteService>();
builder.Services.AddScoped<IMetodoPagoService, MetodoPagoService>();
builder.Services.AddScoped<IRamoService,       RamoService>();
builder.Services.AddScoped<ICoberturaService,  CoberturaService>();
builder.Services.AddScoped<IOficinaService,    OficinaService>();
builder.Services.AddScoped<IBajaService,       BajaService>();
builder.Services.AddScoped<IUsuarioService,   UsuarioService>();
builder.Services.AddScoped<IAuditoriaService, AuditoriaService>();
builder.Services.AddScoped<IVerificacionService, VerificacionService>();
builder.Services.AddScoped<IAltaService,      AltaService>();
builder.Services.AddScoped<IEndosoService,    EndosoService>();
builder.Services.AddScoped<IAnulacionService, AnulacionService>();
builder.Services.AddScoped<IEliminacionService, EliminacionService>();
builder.Services.AddScoped<IMovimientoService, MovimientoService>();
builder.Services.AddScoped<IConfiguracionService, ConfiguracionService>();

// PDF / Excel
builder.Services.AddSingleton<IPdfService, PdfService>();
builder.Services.AddSingleton<IExcelExportService, ExcelExportService>();

// Seguridad
builder.Services.AddSingleton<JwtHelper>();

// ---------------- Jobs (Quartz.NET) ----------------
builder.Services.AddQuartz(q =>
{
    var jobKey = new JobKey("MarcarCobrosVencidosJob");
    q.AddJob<MarcarCobrosVencidosJob>(jobKey);
    q.AddTrigger(t => t
        .ForJob(jobKey)
        .WithIdentity("MarcarCobrosVencidosTrigger")
        .WithCronSchedule("0 0 1 * * ?")); // todos los días a la 01:00

    // Recordatorios de vencimiento (Email + WhatsApp) — diario
    var notifKey = new JobKey("NotificacionVencimientosJob");
    q.AddJob<NotificacionVencimientosJob>(notifKey);
    q.AddTrigger(t => t
        .ForJob(notifKey)
        .WithIdentity("NotificacionVencimientosTrigger")
        .WithCronSchedule(builder.Configuration["Notificaciones:CronDiario"] ?? "0 0 9 * * ?"));
});
builder.Services.AddQuartzHostedService(opt => opt.WaitForJobsToComplete = true);

// ---------------- Validación de secretos (fail-fast) ----------------
// Los secretos NO se versionan: en dev vienen de appsettings.Development.json,
// en producción de variables de entorno (Jwt__Key, ConnectionStrings__AmrProdSeg).
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
{
    if (builder.Environment.IsDevelopment())
        throw new InvalidOperationException(
            "Falta 'Jwt:Key' (mín. 32 caracteres). Definila en appsettings.Development.json.");
    throw new InvalidOperationException(
        "Falta 'Jwt:Key' o es demasiado corta (mín. 32 caracteres). " +
        "Definí la variable de entorno 'Jwt__Key' en el servidor con una clave aleatoria larga.");
}
if (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("AmrProdSeg")))
{
    throw new InvalidOperationException(
        "Falta la cadena de conexión 'ConnectionStrings:AmrProdSeg'. " +
        "En producción definí 'ConnectionStrings__AmrProdSeg' por variable de entorno.");
}

// ---------------- Auth JWT ----------------
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnChallenge = ctx =>
            {
                ctx.HandleResponse();
                ctx.Response.StatusCode  = 401;
                ctx.Response.ContentType = "application/json";
                return ctx.Response.WriteAsync("{\"error\":\"Token inválido o expirado.\"}");
            }
        };
    });

builder.Services.AddAuthorization();

// ---------------- Forwarded headers (detrás de Traefik/nginx) ----------------
// Permite conocer la IP y el esquema (https) reales del cliente aunque la app
// reciba tráfico HTTP interno del proxy. Necesario para el rate limiting por IP.
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownIPNetworks.Clear(); // confiamos en el proxy dentro de la red Docker
    o.KnownProxies.Clear();
});

// ---------------- Rate limiting ----------------
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
builder.Services.AddInMemoryRateLimiting();

// ---------------- CORS ----------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AmrProdSegPolicy", policy =>
    {
        policy
            .WithOrigins(builder.Configuration["AllowedOrigin"] ?? "http://localhost:5173")
            .AllowAnyHeader()
            .WithMethods("GET", "POST", "PUT", "DELETE")
            .AllowCredentials();
    });
});

// ---------------- Validación (FluentValidation) ----------------
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ---------------- Health checks ----------------
builder.Services.AddHealthChecks()
    .AddCheck<DbHealthCheck>("sql-server");

// ---------------- MVC + filtros ----------------
// Nota: la protección contra SQL Injection ya está garantizada por los Stored
// Procedures parametrizados; se quitó SanitizationFilter para evitar falsos
// positivos (p. ej. apellidos con apóstrofo como "O'Brien").
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>();
});
builder.Services.AddOpenApi();

var app = builder.Build();

// ---------------- Pipeline (el orden importa) ----------------
app.UseForwardedHeaders();            // 0. IP/esquema reales detrás de Traefik/nginx
app.UseExceptionHandlingMiddleware(); // captura excepciones de toda la cadena
app.UseIpRateLimiting();              // 1. Rate limiting (usa la IP real del cliente)
app.UseGeoBlocking();                 // 1b. Bloqueo geográfico (solo Argentina)
// El HTTPS lo termina Traefik en el borde; dentro del contenedor el tráfico es HTTP.
// Se puede desactivar la redirección con UseHttpsRedirection=false (ver docker-compose).
if (!app.Environment.IsDevelopment() && builder.Configuration.GetValue("UseHttpsRedirection", true))
    app.UseHttpsRedirection();        // 2. Forzar HTTPS (sólo si no hay proxy TLS delante)
app.UseSecurityHeaders();            // 3. Headers de seguridad
app.UseStaticFiles();                // sirve /comprobantes (PDFs generados)
app.UseCors("AmrProdSegPolicy");
app.UseAuthentication();             // 4. Autenticación JWT
app.UseAuthorization();              // 5. Autorización por roles

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.MapHealthChecks("/health").AllowAnonymous();
app.MapControllers();

app.Run();
