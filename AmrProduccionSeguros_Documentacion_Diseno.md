# AmrProdSeg — Documentación de Diseño
**Sistema de Gestión de Pólizas de Seguros**
Versión 1.4 | Sección: Diseño

---

## 1. Resumen del Proyecto

AmrProdSeg es una plataforma web orientada a productores de seguros independientes. Permite registrar clientes, asociarlos a compañías aseguradoras y vehículos, gestionar el ciclo completo de una póliza (alta, cobros periódicos, renovación), y generar comprobantes en PDF. El nombre proviene de **AMR Producción Seguros**; la plataforma automatiza la operatoria para que el productor dedique su tiempo a vender y no a tareas administrativas.

---

## 2. Stack Tecnológico

### 2.1 Frontend — React + TypeScript

| Tecnología | Rol | Justificación |
|---|---|---|
| React 18 + TypeScript | UI principal | Tipado estático, ecosistema maduro, componentes reutilizables |
| Vite | Bundler | Arranque rápido, HMR nativo para TS |
| React Router v6 | Navegación SPA | Rutas declarativas, layouts anidados |
| React Query (TanStack Query) | Fetching y caché | Sincronización automática con el backend |
| React Hook Form + Zod | Formularios y validación | Validación tipada, integración nativa con TS |
| Tailwind CSS | Estilos | Utilidades rápidas, responsive por defecto |
| shadcn/ui | Componentes base | Accesibles, personalizables, sin dependencia pesada |
| date-fns | Manejo de fechas | Períodos, vencimientos, cálculo de cuotas |

### 2.2 Backend — ASP.NET Core + ADO.NET (programación en capas)

| Tecnología | Rol | Justificación |
|---|---|---|
| ASP.NET Core 8 Web API | API REST — capa de presentación | Rendimiento, soporte LTS, routing declarativo |
| ADO.NET | Acceso a datos — sin ORM | Control total del SQL, sin overhead de mapeo automático |
| SQL Server | Base de datos relacional | Integridad referencial, Stored Procedures nativos |
| Stored Procedures | Lógica de consultas | Centraliza las queries en la BD, facilita auditoría |
| FluentValidation | Validación en capa de negocio | Reglas de negocio separadas del controlador |
| Quartz.NET | Scheduled jobs | Generación automática de cobros mensuales |
| QuestPDF | Generación de PDFs | Fluent API, moderno, reemplaza iTextSharp |
| ClosedXML | Exportación Excel | Sin dependencia de Office, generación en servidor |
| JWT Bearer Auth | Autenticación | Stateless, compatible con SPAs |
| ASP.NET Identity (tabla propia) | Gestión de usuarios | Roles: Productor, Admin |
| Serilog | Logging estructurado | Auditoría de operaciones críticas |
| AspNetCoreRateLimit | Rate limiting | Protección contra DDoS y abuso de endpoints |

---

## 3. Arquitectura en Capas

El backend sigue el patrón de **programación en 3 capas** estrictas, sin ORM. Cada capa solo conoce a la inmediatamente inferior.

```
┌─────────────────────────────────────────────────────┐
│          Capa de Presentación (API Layer)           │
│   Controllers ASP.NET Core · DTOs · Middlewares    │
└────────────────────────┬────────────────────────────┘
                         │  IService (interfaz)
┌────────────────────────▼────────────────────────────┐
│         Capa de Negocio (Business Logic Layer)      │
│   Services · Validaciones · Reglas de dominio       │
└────────────────────────┬────────────────────────────┘
                         │  IRepository (interfaz)
┌────────────────────────▼────────────────────────────┐
│       Capa de Acceso a Datos (Data Access Layer)    │
│   Repositorios · ADO.NET · SqlCommand · SP          │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                    SQL Server                       │
│         Tablas · Stored Procedures · Índices        │
└─────────────────────────────────────────────────────┘
```

### 3.1 Capa de Presentación — Controllers

Responsabilidad exclusiva: recibir HTTP, mapear DTOs, devolver respuestas. No contiene lógica de negocio.

```csharp
[ApiController]
[Route("api/[controller]")]
public class PolizasController : ControllerBase
{
    private readonly IPolizaService _service;

    public PolizasController(IPolizaService service)
        => _service = service;

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearPolizaDto dto)
    {
        var resultado = await _service.CrearAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = resultado.Id }, resultado);
    }

    [HttpPost("{id}/renovar")]
    public async Task<IActionResult> Renovar(int id, [FromBody] RenovarPolizaDto dto)
    {
        var resultado = await _service.RenovarAsync(id, dto);
        return Ok(resultado);
    }
}
```

### 3.2 Capa de Negocio — Services

Responsabilidad: reglas de negocio, validaciones, coordinación entre repositorios. No toca ADO.NET directamente.

```csharp
public class PolizaService : IPolizaService
{
    private readonly IPolizaRepository _polizaRepo;
    private readonly ICobroRepository  _cobroRepo;
    private readonly IPdfService       _pdfService;

    public PolizaService(
        IPolizaRepository polizaRepo,
        ICobroRepository  cobroRepo,
        IPdfService       pdfService)
    {
        _polizaRepo = polizaRepo;
        _cobroRepo  = cobroRepo;
        _pdfService = pdfService;
    }

    public async Task<PolizaDto> CrearAsync(CrearPolizaDto dto)
    {
        var polizaActiva = await _polizaRepo.GetActivaPorVehiculoAsync(dto.VehiculoId);
        if (polizaActiva != null)
            throw new BusinessException("El vehículo ya tiene una póliza activa.");

        var poliza = new Poliza
        {
            ClienteId      = dto.ClienteId,
            VehiculoId     = dto.VehiculoId,
            CompaniaId     = dto.CompaniaId,
            FechaInicio    = dto.FechaInicio,
            FechaFin       = dto.FechaFin,
            PrecioTotal    = dto.PrecioTotal,
            CantidadCuotas = dto.CantidadCuotas,
            Estado         = EstadoPoliza.Activa,
            FechaEmision   = DateTime.UtcNow
        };

        var id = await _polizaRepo.InsertarAsync(poliza);
        poliza.Id = id;

        await GenerarCuotasAsync(poliza);

        return poliza.ToDto();
    }

    public async Task<RenovacionResultDto> RenovarAsync(int polizaOrigenId, RenovarPolizaDto dto)
    {
        var origen = await _polizaRepo.GetByIdAsync(polizaOrigenId)
            ?? throw new NotFoundException("Póliza no encontrada.");

        var nueva = new Poliza
        {
            ClienteId      = origen.ClienteId,
            VehiculoId     = origen.VehiculoId,
            CompaniaId     = dto.CompaniaId ?? origen.CompaniaId,
            FechaInicio    = dto.FechaInicio,
            FechaFin       = dto.FechaFin,
            PrecioTotal    = dto.PrecioTotal,
            CantidadCuotas = dto.CantidadCuotas,
            Estado         = EstadoPoliza.Activa,
            PolizaOrigenId = polizaOrigenId,
            FechaEmision   = DateTime.UtcNow
        };

        var nuevoId = await _polizaRepo.InsertarAsync(nueva);
        nueva.Id = nuevoId;

        await _polizaRepo.CambiarEstadoAsync(polizaOrigenId, EstadoPoliza.Renovada);
        await GenerarCuotasAsync(nueva);

        var pdfUrl = await _pdfService.GenerarComprobantePdfAsync(nueva);

        return new RenovacionResultDto { NuevaPolizaId = nuevoId, PdfUrl = pdfUrl };
    }

    private async Task GenerarCuotasAsync(Poliza poliza)
    {
        var montoCuota = Math.Round(poliza.PrecioTotal / poliza.CantidadCuotas, 2);
        var cobros = new List<Cobro>();

        for (int i = 1; i <= poliza.CantidadCuotas; i++)
        {
            cobros.Add(new Cobro
            {
                PolizaId         = poliza.Id,
                NumeroCuota      = i,
                FechaVencimiento = poliza.FechaInicio.AddMonths(i - 1),
                Monto            = montoCuota,
                Estado           = EstadoCobro.Pendiente
            });
        }

        await _cobroRepo.InsertarLoteAsync(cobros);
    }
}
```

### 3.3 Capa de Acceso a Datos — Repositorios con ADO.NET

Responsabilidad exclusiva: ejecutar SQL contra la base de datos. Sin lógica de negocio. Usa `SqlConnection`, `SqlCommand`, `SqlDataReader`.

#### Patrón base con helper de conexión

```csharp
public class DbConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(IConfiguration config)
        => _connectionString = config.GetConnectionString("AmrProdSeg")!;

    public SqlConnection Create() => new SqlConnection(_connectionString);
}
```

#### Repositorio de Pólizas

```csharp
public class PolizaRepository : IPolizaRepository
{
    private readonly IDbConnectionFactory _factory;

    public PolizaRepository(IDbConnectionFactory factory)
        => _factory = factory;

    public async Task<Poliza?> GetByIdAsync(int id)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Poliza_GetById", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id", id);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;

        return MapPoliza(reader);
    }

    public async Task<int> InsertarAsync(Poliza p)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Poliza_Insertar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@ClienteId",      p.ClienteId);
        cmd.Parameters.AddWithValue("@VehiculoId",     p.VehiculoId);
        cmd.Parameters.AddWithValue("@CompaniaId",     p.CompaniaId);
        cmd.Parameters.AddWithValue("@FechaInicio",    p.FechaInicio);
        cmd.Parameters.AddWithValue("@FechaFin",       p.FechaFin);
        cmd.Parameters.AddWithValue("@PrecioTotal",    p.PrecioTotal);
        cmd.Parameters.AddWithValue("@CantidadCuotas", p.CantidadCuotas);
        cmd.Parameters.AddWithValue("@Estado",         (int)p.Estado);
        cmd.Parameters.AddWithValue("@PolizaOrigenId", (object?)p.PolizaOrigenId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("@FechaEmision",   p.FechaEmision);

        var result = await cmd.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }

    public async Task<Poliza?> GetActivaPorVehiculoAsync(int vehiculoId)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Poliza_GetActivaPorVehiculo", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@VehiculoId", vehiculoId);

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync()) return null;
        return MapPoliza(reader);
    }

    public async Task CambiarEstadoAsync(int id, EstadoPoliza estado)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Poliza_CambiarEstado", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id",     id);
        cmd.Parameters.AddWithValue("@Estado", (int)estado);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<Poliza>> BuscarAsync(string termino, int page, int pageSize)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Poliza_Buscar", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Termino",  termino);
        cmd.Parameters.AddWithValue("@Offset",   (page - 1) * pageSize);
        cmd.Parameters.AddWithValue("@PageSize", pageSize);

        var lista = new List<Poliza>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
            lista.Add(MapPoliza(reader));

        return lista;
    }

    private static Poliza MapPoliza(SqlDataReader r) => new()
    {
        Id             = r.GetInt32(r.GetOrdinal("Id")),
        ClienteId      = r.GetInt32(r.GetOrdinal("ClienteId")),
        VehiculoId     = r.GetInt32(r.GetOrdinal("VehiculoId")),
        CompaniaId     = r.GetInt32(r.GetOrdinal("CompaniaId")),
        Numero         = r.GetString(r.GetOrdinal("Numero")),
        FechaInicio    = r.GetDateTime(r.GetOrdinal("FechaInicio")),
        FechaFin       = r.GetDateTime(r.GetOrdinal("FechaFin")),
        PrecioTotal    = r.GetDecimal(r.GetOrdinal("PrecioTotal")),
        CantidadCuotas = r.GetInt32(r.GetOrdinal("CantidadCuotas")),
        Estado         = (EstadoPoliza)r.GetInt32(r.GetOrdinal("Estado")),
        FechaEmision   = r.GetDateTime(r.GetOrdinal("FechaEmision")),
        PolizaOrigenId = r.IsDBNull(r.GetOrdinal("PolizaOrigenId"))
                         ? null
                         : r.GetInt32(r.GetOrdinal("PolizaOrigenId"))
    };
}
```

#### Repositorio de Cobros — inserción en lote

```csharp
public class CobroRepository : ICobroRepository
{
    private readonly IDbConnectionFactory _factory;

    public CobroRepository(IDbConnectionFactory factory)
        => _factory = factory;

    public async Task InsertarLoteAsync(IEnumerable<Cobro> cobros)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();
        using var tran = conn.BeginTransaction();

        try
        {
            foreach (var c in cobros)
            {
                using var cmd = new SqlCommand("sp_Cobro_Insertar", conn, tran)
                {
                    CommandType = CommandType.StoredProcedure
                };
                cmd.Parameters.AddWithValue("@PolizaId",         c.PolizaId);
                cmd.Parameters.AddWithValue("@NumeroCuota",      c.NumeroCuota);
                cmd.Parameters.AddWithValue("@FechaVencimiento", c.FechaVencimiento);
                cmd.Parameters.AddWithValue("@Monto",            c.Monto);
                cmd.Parameters.AddWithValue("@Estado",           (int)c.Estado);
                await cmd.ExecuteNonQueryAsync();
            }

            tran.Commit();
        }
        catch
        {
            tran.Rollback();
            throw;
        }
    }

    public async Task MarcarPagadoAsync(int id, DateTime fechaPago)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cobro_MarcarPagado", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Id",        id);
        cmd.Parameters.AddWithValue("@FechaPago", fechaPago);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task<List<Cobro>> GetPendientesMesAsync(int mes, int anio)
    {
        using var conn = _factory.Create();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("sp_Cobro_GetPendientesMes", conn)
        {
            CommandType = CommandType.StoredProcedure
        };
        cmd.Parameters.AddWithValue("@Mes",  mes);
        cmd.Parameters.AddWithValue("@Anio", anio);

        var lista = new List<Cobro>();
        using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            lista.Add(new Cobro
            {
                Id               = reader.GetInt32(reader.GetOrdinal("Id")),
                PolizaId         = reader.GetInt32(reader.GetOrdinal("PolizaId")),
                NumeroCuota      = reader.GetInt32(reader.GetOrdinal("NumeroCuota")),
                FechaVencimiento = reader.GetDateTime(reader.GetOrdinal("FechaVencimiento")),
                Monto            = reader.GetDecimal(reader.GetOrdinal("Monto")),
                Estado           = (EstadoCobro)reader.GetInt32(reader.GetOrdinal("Estado"))
            });
        }
        return lista;
    }
}
```

---

## 4. Stored Procedures — SQL Server

Cada operación de datos tiene su propio SP. Los controladores y servicios nunca escriben SQL inline.

```sql
-- sp_Poliza_Insertar
CREATE PROCEDURE sp_Poliza_Insertar
    @ClienteId      INT,
    @VehiculoId     INT,
    @CompaniaId     INT,
    @FechaInicio    DATE,
    @FechaFin       DATE,
    @PrecioTotal    DECIMAL(18,2),
    @CantidadCuotas INT,
    @Estado         INT,
    @PolizaOrigenId INT = NULL,
    @FechaEmision   DATETIME
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Numero VARCHAR(20)
    SET @Numero = 'POL-' + FORMAT(GETDATE(), 'yyyyMM') + '-' +
                  RIGHT('0000' + CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR), 4)

    INSERT INTO Polizas (
        Numero, ClienteId, VehiculoId, CompaniaId,
        FechaInicio, FechaFin, PrecioTotal, CantidadCuotas,
        Estado, PolizaOrigenId, FechaEmision
    )
    VALUES (
        @Numero, @ClienteId, @VehiculoId, @CompaniaId,
        @FechaInicio, @FechaFin, @PrecioTotal, @CantidadCuotas,
        @Estado, @PolizaOrigenId, @FechaEmision
    )

    SELECT SCOPE_IDENTITY() AS NuevoId
END

-- sp_Poliza_Buscar (búsqueda global paginada)
CREATE PROCEDURE sp_Poliza_Buscar
    @Termino  NVARCHAR(100),
    @Offset   INT,
    @PageSize INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.Id, p.Numero, p.FechaInicio, p.FechaFin,
        p.PrecioTotal, p.CantidadCuotas, p.Estado,
        c.Nombre AS ClienteNombre, v.Patente
    FROM Polizas p
    INNER JOIN Clientes  c ON c.Id = p.ClienteId
    INNER JOIN Vehiculos v ON v.Id = p.VehiculoId
    WHERE
        c.Nombre    LIKE '%' + @Termino + '%' OR
        c.Documento LIKE '%' + @Termino + '%' OR
        v.Patente   LIKE '%' + @Termino + '%' OR
        p.Numero    LIKE '%' + @Termino + '%'
    ORDER BY p.FechaEmision DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
END

-- sp_Cobro_MarcarVencidos (ejecutado por Quartz.NET diariamente)
CREATE PROCEDURE sp_Cobro_MarcarVencidos
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Cobros
    SET Estado = 2  -- Vencido
    WHERE Estado = 0  -- Pendiente
      AND FechaVencimiento < CAST(GETDATE() AS DATE)
END
```

---

## 5. Inyección de Dependencias — Program.cs

```csharp
var builder = WebApplication.CreateBuilder(args);

// Infraestructura
builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();

// Repositorios (DAL)
builder.Services.AddScoped<IPolizaRepository,   PolizaRepository>();
builder.Services.AddScoped<ICobroRepository,    CobroRepository>();
builder.Services.AddScoped<IClienteRepository,  ClienteRepository>();
builder.Services.AddScoped<IVehiculoRepository, VehiculoRepository>();

// Servicios (BLL)
builder.Services.AddScoped<IPolizaService,  PolizaService>();
builder.Services.AddScoped<ICobroService,   CobroService>();
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IPdfService,     PdfService>();

// Jobs
builder.Services.AddQuartz(q =>
{
    q.AddJobAndTrigger<MarcarCobrosVencidosJob>(builder.Configuration);
});
builder.Services.AddQuartzHostedService(opt => opt.WaitForJobsToComplete = true);

// Auth JWT
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* ver sección 12.1 */ });

// Rate limiting (ver sección 12.2)
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
builder.Services.AddInMemoryRateLimiting();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Pipeline de middlewares — el orden importa
app.UseIpRateLimiting();           // 1. Rate limiting primero
app.UseHttpsRedirection();         // 2. Forzar HTTPS
app.UseSecurityHeaders();          // 3. Headers de seguridad (ver sección 12.5)
app.UseAuthentication();           // 4. Autenticación JWT
app.UseAuthorization();            // 5. Autorización por roles
app.MapControllers();

app.Run();
```

---

## 6. Estructura de Carpetas del Proyecto

### Backend (ASP.NET Core + ADO.NET)

```
AmrProdSeg.API/
├── Controllers/
│   ├── PolizasController.cs
│   ├── ClientesController.cs
│   ├── CobrosController.cs
│   ├── VehiculosController.cs
│   ├── ReportesController.cs
│   └── AuthController.cs
│
├── Application/                      ← Capa de negocio (BLL)
│   ├── Services/
│   │   ├── PolizaService.cs
│   │   ├── CobroService.cs
│   │   ├── ClienteService.cs
│   │   └── ReporteService.cs
│   ├── Interfaces/
│   │   ├── IPolizaService.cs
│   │   └── ICobroService.cs
│   ├── DTOs/
│   │   ├── CrearPolizaDto.cs
│   │   ├── RenovarPolizaDto.cs
│   │   └── PolizaDto.cs
│   └── Exceptions/
│       ├── BusinessException.cs
│       └── NotFoundException.cs
│
├── Domain/                            ← Entidades puras
│   ├── Poliza.cs
│   ├── Cobro.cs
│   ├── Cliente.cs
│   ├── Vehiculo.cs
│   └── Enums/
│       ├── EstadoPoliza.cs
│       └── EstadoCobro.cs
│
├── Infrastructure/                    ← Capa de datos (DAL)
│   ├── Data/
│   │   └── DbConnectionFactory.cs
│   ├── Repositories/
│   │   ├── PolizaRepository.cs
│   │   ├── CobroRepository.cs
│   │   ├── ClienteRepository.cs
│   │   └── VehiculoRepository.cs
│   ├── Interfaces/
│   │   ├── IPolizaRepository.cs
│   │   └── ICobroRepository.cs
│   ├── Jobs/
│   │   └── MarcarCobrosVencidosJob.cs
│   ├── PDF/
│   │   └── PdfService.cs
│   └── Excel/
│       └── ExcelExportService.cs
│
├── Security/                          ← NUEVO — capa de seguridad transversal
│   ├── Middlewares/
│   │   ├── SecurityHeadersMiddleware.cs
│   │   └── ExceptionHandlingMiddleware.cs
│   ├── Filters/
│   │   └── SanitizationFilter.cs
│   └── Helpers/
│       └── JwtHelper.cs
│
└── Program.cs
```

### Frontend (React + TypeScript)

```
src/
├── api/                   # Wrappers de fetch por módulo
├── components/
│   ├── ui/                # shadcn/ui base
│   ├── polizas/
│   ├── cobros/
│   └── layout/
├── hooks/
├── pages/
│   ├── Dashboard.tsx
│   ├── Clientes.tsx
│   ├── Polizas.tsx
│   ├── Cobros.tsx
│   └── Renovacion.tsx
├── types/                 # Interfaces TypeScript (espejo de los DTOs)
├── security/              # NUEVO
│   └── axiosInstance.ts   # Interceptor con JWT y manejo de 401/429
└── utils/
```

---

## 7. Modelo de Datos SQL Server

```sql
CREATE SEQUENCE seq_Poliza START WITH 1 INCREMENT BY 1

CREATE TABLE Clientes (
    Id          INT PRIMARY KEY IDENTITY,
    Nombre      NVARCHAR(150) NOT NULL,
    Documento   VARCHAR(20)   NOT NULL UNIQUE,
    Email       VARCHAR(100),
    Telefono    VARCHAR(30),
    Direccion   NVARCHAR(200),
    FechaAlta   DATE          NOT NULL DEFAULT GETDATE(),
    Activo      BIT           NOT NULL DEFAULT 1
)

CREATE TABLE Vehiculos (
    Id            INT PRIMARY KEY IDENTITY,
    ClienteId     INT           NOT NULL REFERENCES Clientes(Id),
    Marca         VARCHAR(60)   NOT NULL,
    Modelo        VARCHAR(60)   NOT NULL,
    Anio          SMALLINT      NOT NULL,
    Patente       VARCHAR(10)   NOT NULL UNIQUE,
    Chasis        VARCHAR(50),
    Motor         VARCHAR(50),
    TipoCobertura VARCHAR(40)
)

CREATE TABLE Companias (
    Id       INT PRIMARY KEY IDENTITY,
    Nombre   NVARCHAR(100) NOT NULL,
    CUIT     VARCHAR(15),
    Telefono VARCHAR(30),
    LogoUrl  VARCHAR(300),
    Activo   BIT NOT NULL DEFAULT 1
)

CREATE TABLE Polizas (
    Id             INT PRIMARY KEY IDENTITY,
    Numero         VARCHAR(20)    NOT NULL UNIQUE,
    ClienteId      INT            NOT NULL REFERENCES Clientes(Id),
    VehiculoId     INT            NOT NULL REFERENCES Vehiculos(Id),
    CompaniaId     INT            NOT NULL REFERENCES Companias(Id),
    FechaInicio    DATE           NOT NULL,
    FechaFin       DATE           NOT NULL,
    PrecioTotal    DECIMAL(18,2)  NOT NULL,
    CantidadCuotas INT            NOT NULL,
    Estado         INT            NOT NULL DEFAULT 0,
    -- 0=Activa 1=Vencida 2=Cancelada 3=Renovada
    PolizaOrigenId INT            REFERENCES Polizas(Id),
    FechaEmision   DATETIME       NOT NULL DEFAULT GETDATE()
)

CREATE TABLE Cobros (
    Id               INT PRIMARY KEY IDENTITY,
    PolizaId         INT           NOT NULL REFERENCES Polizas(Id),
    NumeroCuota      INT           NOT NULL,
    FechaVencimiento DATE          NOT NULL,
    Monto            DECIMAL(18,2) NOT NULL,
    Estado           INT           NOT NULL DEFAULT 0,
    -- 0=Pendiente 1=Pagado 2=Vencido
    FechaPago        DATETIME      NULL
)
```

### 7.1 Tabla de Auditoría

```sql
CREATE TABLE AuditoriaCambios (
    Id              INT PRIMARY KEY IDENTITY,
    Tabla           VARCHAR(50)   NOT NULL,
    RegistroId      INT           NOT NULL,
    Campo           VARCHAR(50)   NOT NULL,
    ValorAnterior   NVARCHAR(200),
    ValorNuevo      NVARCHAR(200),
    UsuarioId       INT           NOT NULL,
    Fecha           DATETIME      NOT NULL DEFAULT GETDATE()
)
```

Operaciones: `sp_Auditoria_Insertar`, `sp_Cliente_ActualizarDocumento` (solo Admin), `sp_Auditoria_GetPorRegistro`.

### 7.2 Índices de Soporte

```sql
-- FKs
CREATE INDEX IX_Vehiculos_ClienteId    ON Vehiculos(ClienteId)
CREATE INDEX IX_Polizas_ClienteId      ON Polizas(ClienteId)
CREATE INDEX IX_Polizas_VehiculoId     ON Polizas(VehiculoId)
CREATE INDEX IX_Polizas_CompaniaId     ON Polizas(CompaniaId)
CREATE INDEX IX_Polizas_PolizaOrigenId ON Polizas(PolizaOrigenId)
CREATE INDEX IX_Cobros_PolizaId        ON Cobros(PolizaId)

-- Compuestos para reportes y jobs
CREATE INDEX IX_Cobros_Estado_Vencimiento ON Cobros(Estado, FechaVencimiento)
CREATE INDEX IX_Polizas_Estado_FechaFin   ON Polizas(Estado, FechaFin)
CREATE INDEX IX_Polizas_FechaEmision      ON Polizas(FechaEmision)

-- Auditoría
CREATE INDEX IX_AuditoriaCambios_Tabla_Registro ON AuditoriaCambios(Tabla, RegistroId)
```

Script completo ejecutable disponible en `AmrProdSeg_Schema.sql`.

---

## 8. Endpoints API

```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/clientes?q={busqueda}&page={n}
GET    /api/clientes/{id}
POST   /api/clientes
PUT    /api/clientes/{id}

GET    /api/vehiculos?clienteId={id}
POST   /api/vehiculos
PUT    /api/vehiculos/{id}

GET    /api/polizas?clienteId={id}&estado={estado}&page={n}
GET    /api/polizas/{id}
POST   /api/polizas
PUT    /api/polizas/{id}/cancelar
POST   /api/polizas/{id}/renovar
GET    /api/polizas/{id}/pdf

GET    /api/cobros?polizaId={id}
GET    /api/cobros/pendientes?mes={mm}&anio={yyyy}
PUT    /api/cobros/{id}/pagar

GET    /api/search?q={texto}
GET    /api/companias
POST   /api/companias

GET    /api/reportes/cobros-periodo?mes={mm}&anio={yyyy}
GET    /api/reportes/cobros-periodo/pdf
GET    /api/reportes/cobros-periodo/excel
GET    /api/reportes/estado-cuenta/{clienteId}
GET    /api/reportes/deuda-acumulada
GET    /api/reportes/polizas-por-vencer?dias={n}
GET    /api/reportes/vencidas-sin-renovar
GET    /api/reportes/cartera-por-compania
GET    /api/reportes/produccion-mensual?mes={mm}&anio={yyyy}
GET    /api/reportes/ingresos-proyectados?meses={n}
```

Todos los endpoints excepto `/api/auth/login` requieren `Authorization: Bearer {token}`.

---

## 9. Ventajas de esta Arquitectura

| Aspecto | ORM (EF Core) | ADO.NET en capas |
|---|---|---|
| Control del SQL | Limitado (genera queries automáticas) | Total — queries y SPs escritos a mano |
| Rendimiento | Queries subóptimas en casos complejos | Optimizable query a query |
| Depuración | Difícil rastrear SQL generado | El SP es exactamente lo que se ejecuta |
| Curva de aprendizaje | Alta (LINQ, migrations, DbContext) | Baja — SQL conocido + ADO.NET simple |
| Cambios de esquema | Migrations automáticas | Migrations manuales (control total) |
| Stored Procedures | Soporte limitado | Ciudadanos de primera clase |
| SQL Injection | Parcialmente mitigado por EF | Eliminado por diseño: solo SPs con parámetros |

---

## 10. Flujos de Usuario — Pasos Detallados

### 10.1 Alta de Asegurado (Wizard 3 pasos)

El productor registra un cliente nuevo con su vehículo y genera la primera póliza desde una única pantalla en forma de wizard.

**Paso 1 — Datos del cliente**

| Campo | Tipo | Validación |
|---|---|---|
| Nombre / Razón Social `*` | Texto | Mín. 3 caracteres |
| Tipo de documento `*` | Selector (DNI / CUIT) | Requerido |
| Número de documento `*` | Numérico | Único en la base de datos |
| Teléfono | Texto | Opcional |
| Email | Email | Formato válido si se ingresa |
| Dirección | Texto | Opcional |

Al hacer click en "Siguiente", el frontend valida con Zod y el backend ejecuta `sp_Cliente_VerificarDocumento`. Si el documento ya existe, se muestra un mensaje de error con un enlace al asegurado existente.

**Paso 2 — Datos del vehículo**

| Campo | Tipo | Validación |
|---|---|---|
| Patente `*` | Texto | Única en la base de datos |
| Marca `*` | Texto | Requerido |
| Modelo `*` | Texto | Requerido |
| Año `*` | Número | Entre 1950 y año actual + 1 |
| Tipo de cobertura `*` | Selector | Terceros / Todo riesgo / Terceros completo |
| Número de chasis | Texto | Opcional |
| Número de motor | Texto | Opcional |

**Paso 3 — Datos de la póliza**

| Campo | Tipo | Validación |
|---|---|---|
| Compañía aseguradora `*` | Selector | Requerido |
| Número de póliza | Texto | Auto-generado, editable |
| Fecha de inicio `*` | Fecha | No puede ser anterior a hoy |
| Fecha de fin `*` | Fecha | Posterior a fecha de inicio |
| Precio total `*` | Decimal | Mayor a 0 |
| Cantidad de cuotas `*` | Número | Entre 1 y 24 |

Al confirmar, una única transacción inserta cliente, vehículo, póliza y cuotas. Si cualquier paso falla, se hace rollback completo. Se genera y descarga el PDF del comprobante.

---

### 10.2 Edición de Asegurado o Vehículo

- Se puede modificar: nombre, teléfono, email, dirección
- No se puede modificar: tipo ni número de documento directamente
- La corrección del `Documento` requiere rol Admin y queda registrada en `AuditoriaCambios`

---

### 10.3 Búsqueda Global

Disponible desde el header. Soporta: nombre parcial, DNI/CUIT, número de póliza, patente. El SP `sp_Busqueda_Global` usa `UNION ALL` sobre las tres tablas principales.

---

### 10.4 Registro de Pago de una Cuota

```
Ver cobros → Seleccionar cuota pendiente → Click "Registrar pago"
→ Modal: confirmar fecha → PUT /api/cobros/{id}/pagar
→ sp_Cobro_MarcarPagado → Estado: Pagado
```

---

### 10.5 Renovación de Póliza

```
Buscar póliza → Click "Renovar" → Formulario pre-cargado
→ Modificar precio, cuotas, fechas, compañía
→ sp_Poliza_Insertar (nueva) + sp_Poliza_CambiarEstado (origen → Renovada)
→ Nuevas cuotas generadas + PDF descargado
```

---

## 11. Módulo de Reportes

### 11.1 Tecnología

| Componente | Tecnología |
|---|---|
| Exportación PDF | QuestPDF |
| Exportación Excel | ClosedXML |
| Visualización en pantalla | React + Recharts |
| Filtros | React Hook Form + query params |

### 11.2 Reporte 1 — Cobros del Período

Cuotas pagadas, pendientes y vencidas en un rango. Filtros: mes/año, estado, compañía. SP: `sp_Reporte_CobrosPeriodo`.

### 11.3 Reporte 2 — Estado de Cuenta por Asegurado

Historial de cobros de un cliente, con totales de abonado y adeudado. SP: `sp_Reporte_EstadoCuenta`.

### 11.4 Reporte 3 — Deuda Acumulada

Ranking de asegurados con cuotas impagas ordenados por monto. SP: `sp_Reporte_DeudaAcumulada`.

### 11.5 Reporte 4 — Pólizas Próximas a Vencer

Pólizas activas que vencen en los próximos 30/60/90 días. SP: `sp_Reporte_PolizasPorVencer`.

```sql
CREATE PROCEDURE sp_Reporte_PolizasPorVencer
    @DiasHorizonte INT = 30,
    @CompaniaId    INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.Nombre, c.Telefono, v.Patente,
        cp.Nombre AS Compania, p.Numero AS NroPoliza,
        p.FechaFin,
        DATEDIFF(DAY, GETDATE(), p.FechaFin) AS DiasRestantes
    FROM Polizas p
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Vehiculos v  ON v.Id  = p.VehiculoId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    WHERE p.Estado = 0
      AND p.FechaFin BETWEEN CAST(GETDATE() AS DATE)
                         AND DATEADD(DAY, @DiasHorizonte, GETDATE())
      AND (@CompaniaId IS NULL OR p.CompaniaId = @CompaniaId)
    ORDER BY p.FechaFin ASC
END
```

### 11.6 Reporte 5 — Pólizas Vencidas sin Renovar

Pólizas con `Estado = 1` (Vencida, nunca renovada). Muestra asegurado, patente, compañía, fecha de vencimiento, días vencida, precio original. Disponible en Excel. SP: `sp_Reporte_VencidasSinRenovar`.

### 11.7 Reporte 6 — Cartera por Compañía

Pólizas activas agrupadas por aseguradora: cantidad, clientes únicos, prima total. SP: `sp_Reporte_CarteraPorCompania`.

### 11.8 Reporte 7 — Producción Mensual

Pólizas nuevas, renovadas y prima emitida en el período. SP: `sp_Reporte_ProduccionMensual`.

### 11.9 Reporte 8 — Ingresos Proyectados

Cuotas futuras pendientes agrupadas por mes. Se visualiza como gráfico de barras (Recharts) y exportable a Excel. SP: `sp_Reporte_IngresosProyectados`.

### 11.10 Resumen de Reportes y Endpoints

| Reporte | Pantalla | PDF | Excel | SP |
|---|---|---|---|---|
| Cobros del período | ✓ | ✓ | ✓ | `sp_Reporte_CobrosPeriodo` |
| Estado de cuenta | ✓ | ✓ | — | `sp_Reporte_EstadoCuenta` |
| Deuda acumulada | ✓ | — | ✓ | `sp_Reporte_DeudaAcumulada` |
| Pólizas por vencer | ✓ | ✓ | ✓ | `sp_Reporte_PolizasPorVencer` |
| Vencidas sin renovar | ✓ | — | ✓ | `sp_Reporte_VencidasSinRenovar` |
| Cartera por compañía | ✓ | ✓ | — | `sp_Reporte_CarteraPorCompania` |
| Producción mensual | ✓ | ✓ | — | `sp_Reporte_ProduccionMensual` |
| Ingresos proyectados | ✓ (gráfico) | — | ✓ | `sp_Reporte_IngresosProyectados` |

---

## 12. Seguridad

Esta sección cubre todas las capas de protección del sistema: autenticación, autorización, protección contra ataques comunes y buenas prácticas de configuración.

---

### 12.1 Autenticación JWT

#### Configuración del token

```csharp
// appsettings.json
"Jwt": {
  "Key":              "clave-secreta-minimo-32-caracteres-aqui",
  "Issuer":           "AmrProdSeg.API",
  "Audience":         "AmrProdSeg.Client",
  "ExpirationHours":  8,
  "RefreshDays":      7
}
```

```csharp
// Program.cs — configuración completa del middleware JWT
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
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ClockSkew = TimeSpan.Zero   // Sin margen de gracia — el token expira exacto
        };

        // Devolver 401 con cuerpo JSON, no página HTML
        options.Events = new JwtBearerEvents
        {
            OnChallenge = ctx =>
            {
                ctx.HandleResponse();
                ctx.Response.StatusCode  = 401;
                ctx.Response.ContentType = "application/json";
                return ctx.Response.WriteAsync(
                    "{\"error\":\"Token inválido o expirado.\"}");
            }
        };
    });
```

#### Generación del token

```csharp
public class JwtHelper
{
    private readonly IConfiguration _config;

    public JwtHelper(IConfiguration config) => _config = config;

    public string GenerarToken(int usuarioId, string email, string rol)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   usuarioId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Role,               rol),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString())
            // Jti = JWT ID único por token, permite invalidar tokens individuales
        };

        var token = new JwtSecurityToken(
            issuer:             _config["Jwt:Issuer"],
            audience:           _config["Jwt:Audience"],
            claims:             claims,
            expires:            DateTime.UtcNow.AddHours(
                                    int.Parse(_config["Jwt:ExpirationHours"]!)),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

#### Refresh Token

El refresh token es un GUID almacenado en base de datos con fecha de expiración. Permite renovar el JWT sin que el usuario tenga que loguearse nuevamente.

```sql
CREATE TABLE RefreshTokens (
    Id          INT PRIMARY KEY IDENTITY,
    UsuarioId   INT           NOT NULL,
    Token       VARCHAR(100)  NOT NULL UNIQUE,
    Expiracion  DATETIME      NOT NULL,
    Revocado    BIT           NOT NULL DEFAULT 0,
    FechaCreado DATETIME      NOT NULL DEFAULT GETDATE()
)
```

```csharp
// AuthController — flujo de refresh
[HttpPost("refresh")]
[AllowAnonymous]
public async Task<IActionResult> Refresh([FromBody] RefreshRequestDto dto)
{
    var refresh = await _authRepo.GetRefreshTokenAsync(dto.RefreshToken);

    if (refresh == null || refresh.Revocado || refresh.Expiracion < DateTime.UtcNow)
        return Unauthorized(new { error = "Refresh token inválido o expirado." });

    // Revocar el token usado (rotación: cada refresh emite uno nuevo)
    await _authRepo.RevocarRefreshTokenAsync(dto.RefreshToken);

    var usuario    = await _usuarioRepo.GetByIdAsync(refresh.UsuarioId);
    var nuevoJwt   = _jwtHelper.GenerarToken(usuario.Id, usuario.Email, usuario.Rol);
    var nuevoRefresh = Guid.NewGuid().ToString();

    await _authRepo.GuardarRefreshTokenAsync(usuario.Id, nuevoRefresh,
        DateTime.UtcNow.AddDays(int.Parse(_config["Jwt:RefreshDays"]!)));

    return Ok(new { accessToken = nuevoJwt, refreshToken = nuevoRefresh });
}
```

#### Autorización por roles en controllers

```csharp
[Authorize]                            // Cualquier usuario autenticado
[Authorize(Roles = "Admin")]           // Solo Admin
[Authorize(Roles = "Admin,Productor")] // Admin o Productor
```

---

### 12.2 Rate Limiting (protección contra DDoS y abuso)

Se usa el paquete `AspNetCoreRateLimit`. La configuración se define en `appsettings.json` y se aplica globalmente.

#### Instalación

```bash
dotnet add package AspNetCoreRateLimit
```

#### Configuración en appsettings.json

```json
"IpRateLimiting": {
  "EnableEndpointRateLimiting": true,
  "StackBlockedRequests": false,
  "HttpStatusCode": 429,
  "GeneralRules": [
    {
      "Endpoint": "*",
      "Period":   "1s",
      "Limit":    20
    },
    {
      "Endpoint": "*",
      "Period":   "1m",
      "Limit":    200
    },
    {
      "Endpoint": "*",
      "Period":   "1h",
      "Limit":    2000
    }
  ],
  "EndpointRules": [
    {
      "Endpoint": "POST:/api/auth/login",
      "Period":   "1m",
      "Limit":    5
    },
    {
      "Endpoint": "POST:/api/auth/refresh",
      "Period":   "1m",
      "Limit":    10
    },
    {
      "Endpoint": "GET:/api/reportes/*",
      "Period":   "1m",
      "Limit":    30
    }
  ]
}
```

Las reglas generales limitan la IP a 20 req/s, 200 req/min y 2000 req/h. Las reglas específicas son más restrictivas sobre los endpoints sensibles: el login permite solo 5 intentos por minuto por IP, lo que bloquea ataques de fuerza bruta de credenciales. Cuando se supera el límite, la API devuelve `HTTP 429 Too Many Requests` con el header `Retry-After`.

#### Respuesta 429 personalizada

```csharp
// En Program.cs — personalizar la respuesta de rate limit
builder.Services.Configure<IpRateLimitOptions>(options =>
{
    options.QuotaExceededResponse = new QuotaExceededResponse
    {
        StatusCode  = 429,
        ContentType = "application/json",
        Content     = "{\"error\":\"Demasiadas solicitudes. Intentá nuevamente en {0} segundos.\"}"
    };
});
```

---

### 12.3 Protección contra SQL Injection

AmrProdSeg está protegido contra SQL Injection **por arquitectura**, no solo por validación. Hay tres capas de defensa:

**Primera línea — Stored Procedures con parámetros tipados**

Toda consulta a la base de datos pasa por un SP invocado con `SqlCommand` y parámetros `AddWithValue`. Nunca hay concatenación de strings con datos del usuario.

```csharp
// CORRECTO — parámetro tipado, imposible de inyectar
cmd.Parameters.AddWithValue("@Termino", terminoBusqueda);

// INCORRECTO — nunca hacer esto en el proyecto
var sql = $"SELECT * FROM Clientes WHERE Nombre = '{input}'"; // PROHIBIDO
```

**Segunda línea — Validación de entrada en la BLL con FluentValidation**

```csharp
public class CrearClienteValidator : AbstractValidator<CrearClienteDto>
{
    public CrearClienteValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty()
            .MaximumLength(150)
            .Matches(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-\.]+$")
            .WithMessage("El nombre solo puede contener letras, espacios y guiones.");

        RuleFor(x => x.Documento)
            .NotEmpty()
            .MaximumLength(20)
            .Matches(@"^\d{7,11}$")
            .WithMessage("El documento debe contener solo dígitos (7 a 11).");

        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrEmpty(x.Email));
    }
}
```

**Tercera línea — Filtro de sanitización global**

```csharp
// Security/Filters/SanitizationFilter.cs
public class SanitizationFilter : IActionFilter
{
    private static readonly char[] CaracteresProhibidos =
        { '\'', '"', ';', '-', '-', '/', '*', '=', '<', '>', '\\' };

    public void OnActionExecuting(ActionExecutingContext context)
    {
        foreach (var param in context.ActionArguments.Values)
        {
            if (param is string str && ContieneSql(str))
            {
                context.Result = new BadRequestObjectResult(
                    new { error = "La entrada contiene caracteres no permitidos." });
                return;
            }
        }
    }

    public void OnActionExecuted(ActionExecutedContext context) { }

    private static bool ContieneSql(string input) =>
        CaracteresProhibidos.Any(c => input.Contains(c));
}
```

Registro del filtro:

```csharp
builder.Services.AddControllers(options =>
{
    options.Filters.Add<SanitizationFilter>();
});
```

---

### 12.4 Protección contra XSS (Cross-Site Scripting)

**Backend — Content Security Policy (CSP)**

Los headers CSP van en el middleware `SecurityHeadersMiddleware` (ver sección 12.5) e impiden la ejecución de scripts inyectados.

**Frontend — React escapa por defecto**

React escapa automáticamente el contenido renderizado en JSX. El único punto de riesgo es `dangerouslySetInnerHTML`, que está completamente prohibido en el proyecto.

**Sanitización de salidas en el backend**

Cuando el backend devuelve texto que proviene de la base de datos y va a ser renderizado (por ejemplo en PDFs), se sanitiza:

```csharp
// Remover tags HTML antes de incluir en documentos
public static string SanitizarTexto(string input) =>
    System.Text.RegularExpressions.Regex.Replace(input, "<.*?>", string.Empty).Trim();
```

---

### 12.5 Headers de Seguridad HTTP

Un middleware propio agrega los headers de seguridad a todas las respuestas.

```csharp
// Security/Middlewares/SecurityHeadersMiddleware.cs
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        // Impide que el navegador cargue el sitio dentro de un iframe (clickjacking)
        headers["X-Frame-Options"] = "DENY";

        // Fuerza HTTPS por 1 año e incluye subdominios
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";

        // Impide que el navegador adivine el Content-Type (MIME sniffing)
        headers["X-Content-Type-Options"] = "nosniff";

        // Controla qué información envía en el header Referer
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Deshabilita funciones del navegador que no se usan
        headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";

        // Content Security Policy — solo permite scripts y estilos del propio origen
        headers["Content-Security-Policy"] =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob:; " +
            "font-src 'self'; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none';";

        // Elimina el header que revela que se usa ASP.NET
        headers.Remove("Server");
        headers.Remove("X-Powered-By");

        await _next(context);
    }
}
```

Registro en Program.cs:

```csharp
// Extensión para registrar el middleware limpiamente
public static class SecurityHeadersExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
        => app.UseMiddleware<SecurityHeadersMiddleware>();
}
```

---

### 12.6 Protección contra CSRF

Las SPAs con JWT en header `Authorization` no son vulnerables al CSRF clásico (que afecta a cookies). Sin embargo, si en el futuro se usa cookie para guardar el token, hay que activar el antiforgery de ASP.NET Core:

```csharp
// Solo si se migra a cookie-based auth
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
});
```

Por ahora el token JWT viaja únicamente en el header `Authorization: Bearer {token}`, lo que ya protege contra CSRF por diseño.

---

### 12.7 Protección del Token JWT en el Frontend

```typescript
// src/security/axiosInstance.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor de request — adjunta el token en cada petición
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response — maneja 401 y 429
api.interceptors.response.use(
  res => res,
  async error => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expirado — intentar renovar con refresh token
      const refreshToken = sessionStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          sessionStorage.setItem('access_token',  data.accessToken);
          sessionStorage.setItem('refresh_token', data.refreshToken);
          // Reintentar la petición original con el nuevo token
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(error.config);
        } catch {
          // Refresh falló — limpiar sesión y redirigir al login
          sessionStorage.clear();
          window.location.href = '/login';
        }
      } else {
        sessionStorage.clear();
        window.location.href = '/login';
      }
    }

    if (status === 429) {
      // Rate limit alcanzado — notificar al usuario
      console.warn('Demasiadas solicitudes. Esperá un momento.');
    }

    return Promise.reject(error);
  }
);

export default api;
```

**Dónde guardar el token — decisión deliberada:**

| Lugar | Riesgo XSS | Riesgo CSRF | Decisión |
|---|---|---|---|
| `localStorage` | Alto (persiste entre sesiones) | Ninguno | No usar |
| `sessionStorage` | Medio (dura solo la pestaña) | Ninguno | **Usar — opción elegida** |
| Cookie `HttpOnly` | Ninguno | Alto (requiere CSRF token) | Alternativa futura |

Se usa `sessionStorage` porque al cerrar el navegador el token desaparece automáticamente, reduciendo el riesgo en equipos compartidos.

---

### 12.8 Manejo Seguro de Excepciones

En producción nunca se devuelven stack traces al cliente. El middleware de manejo de excepciones captura todo y devuelve respuestas genéricas.

```csharp
// Security/Middlewares/ExceptionHandlingMiddleware.cs
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (BusinessException ex)
        {
            // Error de negocio conocido — devolver al cliente
            context.Response.StatusCode  = 400;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { error = ex.Message });
        }
        catch (NotFoundException ex)
        {
            context.Response.StatusCode  = 404;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { error = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            context.Response.StatusCode  = 403;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(
                new { error = "No tenés permisos para realizar esta acción." });
        }
        catch (Exception ex)
        {
            // Error inesperado — loguear con detalle, devolver mensaje genérico
            _logger.LogError(ex, "Error no controlado en {Path}", context.Request.Path);

            context.Response.StatusCode  = 500;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(
                new { error = "Ocurrió un error interno. Intentá nuevamente." });
            // El stack trace NUNCA llega al cliente
        }
    }
}
```

---

### 12.9 Configuración de CORS

Solo el origen del frontend tiene permiso para llamar a la API.

```csharp
// Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AmrProdSegPolicy", policy =>
    {
        policy
            .WithOrigins(builder.Configuration["AllowedOrigin"]!)
            // Ejemplo: "https://amrprodseg.vercel.app"
            .AllowAnyHeader()
            .WithMethods("GET", "POST", "PUT", "DELETE")
            .AllowCredentials();
    });
});

// En el pipeline (antes de MapControllers)
app.UseCors("AmrProdSegPolicy");
```

En desarrollo se puede usar `http://localhost:5173` como `AllowedOrigin`. En producción se configura mediante variable de entorno, no hardcodeado en el código.

---

### 12.10 Protección de la Cadena de Conexión

La connection string nunca va en el código fuente ni en `appsettings.json` en texto plano en producción.

```json
// appsettings.Development.json (solo en entorno local, nunca en repo)
{
  "ConnectionStrings": {
    "AmrProdSeg": "Server=localhost;Database=AmrProdSeg;Trusted_Connection=true;"
  }
}
```

En producción se usa una variable de entorno del servidor (Azure App Service, Railway, etc.):

```
CONNECTIONSTRINGS__AMRPRODSEG=Server=...;Database=...;User=...;Password=...
```

ASP.NET Core mapea automáticamente `CONNECTIONSTRINGS__AMRPRODSEG` a `ConnectionStrings:AmrProdSeg` en `IConfiguration`.

La clave JWT también va como variable de entorno:

```
JWT__KEY=clave-muy-larga-y-aleatoria-de-al-menos-32-caracteres
```

---

### 12.11 Resumen de Amenazas y Mitigaciones

| Amenaza | Mitigación implementada |
|---|---|
| SQL Injection | Stored Procedures + parámetros tipados ADO.NET + SanitizationFilter |
| XSS | React escapa por defecto + CSP header + sanitización de texto en PDFs |
| CSRF | JWT en header Authorization (inmune por diseño) |
| Clickjacking | Header `X-Frame-Options: DENY` |
| MIME sniffing | Header `X-Content-Type-Options: nosniff` |
| Fuerza bruta / credenciales | Rate limit: 5 intentos/min en `/api/auth/login` |
| DDoS / abuso de API | Rate limit global: 20 req/s, 200 req/min por IP |
| Exposición de errores internos | ExceptionHandlingMiddleware — stack trace nunca al cliente |
| Token robado por XSS | `sessionStorage` (no `localStorage`) + expiración corta (8 h) |
| Exposición de connection string | Variables de entorno del servidor, nunca en código fuente |
| Información del servidor expuesta | Headers `Server` y `X-Powered-By` eliminados |
| Conexión HTTP sin cifrado | `UseHttpsRedirection` + HSTS header |
| Tokens JWT sin expiración | `ClockSkew = Zero` + expiración estricta de 8 horas |
| Refresh tokens robados | Rotación en cada uso + revocación en BD |

---

*Documento generado para el proyecto AmrProdSeg — Productor de Seguros*
*Stack: React 18 + TypeScript · ASP.NET Core 8 · ADO.NET · SQL Server · Stored Procedures · QuestPDF · ClosedXML · Quartz.NET · AspNetCoreRateLimit*
*Versión 1.4 — incluye módulos de seguridad completos*
