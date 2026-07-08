/* =============================================================================
   AmrProdSeg_Schema.sql
   Sistema de Gestión de Pólizas de Seguros — AMR Producción Seguros (AmrProdSeg)
   Motor: SQL Server 2016+ (usa CREATE OR ALTER y OFFSET/FETCH)
   Contenido: Base de datos, secuencia, tablas, índices y Stored Procedures.
   Script idempotente: puede re-ejecutarse sin error.
   ============================================================================= */

SET NOCOUNT ON;
GO

/* -----------------------------------------------------------------------------
   0. Base de datos
   ----------------------------------------------------------------------------- */
IF DB_ID('AmrProdSeg') IS NULL
BEGIN
    CREATE DATABASE AmrProdSeg;
END
GO

USE AmrProdSeg;
GO

/* =============================================================================
   1. SECUENCIA
   ============================================================================= */
IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'seq_Poliza')
BEGIN
    CREATE SEQUENCE seq_Poliza START WITH 1 INCREMENT BY 1;
END
GO

/* =============================================================================
   2. TABLAS
   ============================================================================= */

/* --- Clientes --- */
IF OBJECT_ID('dbo.Clientes', 'U') IS NULL
BEGIN
    CREATE TABLE Clientes (
        Id          INT PRIMARY KEY IDENTITY,
        Nombre      NVARCHAR(150) NOT NULL,
        Documento   VARCHAR(20)   NOT NULL UNIQUE,
        Email       VARCHAR(100),
        Telefono    VARCHAR(30),
        Direccion   NVARCHAR(200),
        FechaAlta   DATE          NOT NULL DEFAULT GETUTCDATE(),
        Activo      BIT           NOT NULL DEFAULT 1
    );
END
GO

/* --- Vehiculos --- */
IF OBJECT_ID('dbo.Vehiculos', 'U') IS NULL
BEGIN
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
    );
END
GO

/* --- Companias --- */
IF OBJECT_ID('dbo.Companias', 'U') IS NULL
BEGIN
    CREATE TABLE Companias (
        Id       INT PRIMARY KEY IDENTITY,
        Nombre   NVARCHAR(100) NOT NULL,
        CUIT     VARCHAR(15),
        Telefono VARCHAR(30),
        LogoUrl  VARCHAR(300),
        Activo   BIT NOT NULL DEFAULT 1
    );
END
GO

/* --- Polizas --- */
IF OBJECT_ID('dbo.Polizas', 'U') IS NULL
BEGIN
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
        FechaEmision   DATETIME       NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

/* --- Cobros --- */
IF OBJECT_ID('dbo.Cobros', 'U') IS NULL
BEGIN
    CREATE TABLE Cobros (
        Id               INT PRIMARY KEY IDENTITY,
        PolizaId         INT           NOT NULL REFERENCES Polizas(Id),
        NumeroCuota      INT           NOT NULL,
        FechaVencimiento DATE          NOT NULL,
        Monto            DECIMAL(18,2) NOT NULL,
        Estado           INT           NOT NULL DEFAULT 0,
        -- 0=Pendiente 1=Pagado 2=Vencido
        FechaPago        DATETIME      NULL
    );
END
GO

/* --- Usuarios (ASP.NET Identity con tabla propia) --- */
IF OBJECT_ID('dbo.Usuarios', 'U') IS NULL
BEGIN
    CREATE TABLE Usuarios (
        Id           INT PRIMARY KEY IDENTITY,
        Nombre       NVARCHAR(150) NOT NULL,
        Email        VARCHAR(100)  NOT NULL UNIQUE,
        PasswordHash VARCHAR(255)  NOT NULL,
        Rol          VARCHAR(20)   NOT NULL DEFAULT 'Productor',  -- Productor | Admin
        Activo       BIT           NOT NULL DEFAULT 1,
        FechaAlta    DATETIME      NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

/* --- RefreshTokens --- */
IF OBJECT_ID('dbo.RefreshTokens', 'U') IS NULL
BEGIN
    CREATE TABLE RefreshTokens (
        Id          INT PRIMARY KEY IDENTITY,
        UsuarioId   INT           NOT NULL REFERENCES Usuarios(Id),
        Token       VARCHAR(100)  NOT NULL UNIQUE,
        Expiracion  DATETIME      NOT NULL,
        Revocado    BIT           NOT NULL DEFAULT 0,
        FechaCreado DATETIME      NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

/* --- AuditoriaCambios --- */
IF OBJECT_ID('dbo.AuditoriaCambios', 'U') IS NULL
BEGIN
    CREATE TABLE AuditoriaCambios (
        Id              INT PRIMARY KEY IDENTITY,
        Tabla           VARCHAR(50)   NOT NULL,
        RegistroId      INT           NOT NULL,
        Campo           VARCHAR(50)   NOT NULL,
        ValorAnterior   NVARCHAR(200),
        ValorNuevo      NVARCHAR(200),
        UsuarioId       INT           NOT NULL,
        Fecha           DATETIME      NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

/* --- MetodosPago (catálogo compartido — alta solo Admin) --- */
IF OBJECT_ID('dbo.MetodosPago', 'U') IS NULL
BEGIN
    CREATE TABLE MetodosPago (
        Id     INT PRIMARY KEY IDENTITY,
        Nombre NVARCHAR(60) NOT NULL UNIQUE,
        Activo BIT NOT NULL DEFAULT 1
    );
END
GO

/* --- Cobros: referencia opcional al método de pago usado --- */
IF COL_LENGTH('dbo.Cobros', 'MetodoPagoId') IS NULL
BEGIN
    ALTER TABLE Cobros ADD MetodoPagoId INT NULL REFERENCES MetodosPago(Id);
END
GO

/* =============================================================================
   3. ÍNDICES
   ============================================================================= */

-- FKs
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Vehiculos_ClienteId')
    CREATE INDEX IX_Vehiculos_ClienteId    ON Vehiculos(ClienteId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Polizas_ClienteId')
    CREATE INDEX IX_Polizas_ClienteId      ON Polizas(ClienteId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Polizas_VehiculoId')
    CREATE INDEX IX_Polizas_VehiculoId     ON Polizas(VehiculoId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Polizas_CompaniaId')
    CREATE INDEX IX_Polizas_CompaniaId     ON Polizas(CompaniaId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Polizas_PolizaOrigenId')
    CREATE INDEX IX_Polizas_PolizaOrigenId ON Polizas(PolizaOrigenId);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Cobros_PolizaId')
    CREATE INDEX IX_Cobros_PolizaId        ON Cobros(PolizaId);
GO

-- Compuestos para reportes y jobs
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Cobros_Estado_Vencimiento')
    CREATE INDEX IX_Cobros_Estado_Vencimiento ON Cobros(Estado, FechaVencimiento);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Polizas_Estado_FechaFin')
    CREATE INDEX IX_Polizas_Estado_FechaFin   ON Polizas(Estado, FechaFin);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Polizas_FechaEmision')
    CREATE INDEX IX_Polizas_FechaEmision      ON Polizas(FechaEmision);
GO

-- Auditoría
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AuditoriaCambios_Tabla_Registro')
    CREATE INDEX IX_AuditoriaCambios_Tabla_Registro ON AuditoriaCambios(Tabla, RegistroId);
GO

-- Soporte de autenticación
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RefreshTokens_UsuarioId')
    CREATE INDEX IX_RefreshTokens_UsuarioId ON RefreshTokens(UsuarioId);
GO

/* =============================================================================
   4. STORED PROCEDURES — CLIENTES
   ============================================================================= */

CREATE OR ALTER PROCEDURE sp_Cliente_Insertar
    @Nombre    NVARCHAR(150),
    @Documento VARCHAR(20),
    @Email     VARCHAR(100) = NULL,
    @Telefono  VARCHAR(30)  = NULL,
    @Direccion NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Clientes (Nombre, Documento, Email, Telefono, Direccion)
    VALUES (@Nombre, @Documento, @Email, @Telefono, @Direccion);

    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Cliente_Actualizar
    @Id        INT,
    @Nombre    NVARCHAR(150),
    @Email     VARCHAR(100) = NULL,
    @Telefono  VARCHAR(30)  = NULL,
    @Direccion NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    -- No permite modificar tipo ni número de documento (ver sp_Cliente_ActualizarDocumento)
    UPDATE Clientes
    SET Nombre    = @Nombre,
        Email     = @Email,
        Telefono  = @Telefono,
        Direccion = @Direccion
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Cliente_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Documento, Email, Telefono, Direccion, FechaAlta, Activo
    FROM Clientes
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Cliente_Buscar
    @Termino  NVARCHAR(100),
    @Offset   INT,
    @PageSize INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Documento, Email, Telefono, Direccion, FechaAlta, Activo,
           COUNT(*) OVER() AS Total
    FROM Clientes
    WHERE @Termino = ''
       OR Nombre    LIKE '%' + @Termino + '%'
       OR Documento LIKE '%' + @Termino + '%'
    ORDER BY Nombre ASC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_Cliente_VerificarDocumento
    @Documento VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    -- Devuelve el cliente existente (si lo hay) para enlazar desde el wizard
    SELECT Id, Nombre, Documento
    FROM Clientes
    WHERE Documento = @Documento;
END
GO

-- Corrección de documento: solo Admin. Registra el cambio en AuditoriaCambios.
CREATE OR ALTER PROCEDURE sp_Cliente_ActualizarDocumento
    @Id           INT,
    @NuevoDoc     VARCHAR(20),
    @UsuarioId    INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @DocAnterior VARCHAR(20);
        SELECT @DocAnterior = Documento FROM Clientes WHERE Id = @Id;

        IF @DocAnterior IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            THROW 50001, 'Cliente no encontrado.', 1;
        END

        UPDATE Clientes SET Documento = @NuevoDoc WHERE Id = @Id;

        INSERT INTO AuditoriaCambios (Tabla, RegistroId, Campo, ValorAnterior, ValorNuevo, UsuarioId)
        VALUES ('Clientes', @Id, 'Documento', @DocAnterior, @NuevoDoc, @UsuarioId);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

/* =============================================================================
   5. STORED PROCEDURES — VEHICULOS
   ============================================================================= */

CREATE OR ALTER PROCEDURE sp_Vehiculo_Insertar
    @ClienteId     INT,
    @Marca         VARCHAR(60),
    @Modelo        VARCHAR(60),
    @Anio          SMALLINT,
    @Patente       VARCHAR(10),
    @Chasis        VARCHAR(50) = NULL,
    @Motor         VARCHAR(50) = NULL,
    @TipoCobertura VARCHAR(40) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Vehiculos (ClienteId, Marca, Modelo, Anio, Patente, Chasis, Motor, TipoCobertura)
    VALUES (@ClienteId, @Marca, @Modelo, @Anio, @Patente, @Chasis, @Motor, @TipoCobertura);

    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Vehiculo_Actualizar
    @Id            INT,
    @Marca         VARCHAR(60),
    @Modelo        VARCHAR(60),
    @Anio          SMALLINT,
    @Chasis        VARCHAR(50) = NULL,
    @Motor         VARCHAR(50) = NULL,
    @TipoCobertura VARCHAR(40) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Vehiculos
    SET Marca         = @Marca,
        Modelo        = @Modelo,
        Anio          = @Anio,
        Chasis        = @Chasis,
        Motor         = @Motor,
        TipoCobertura = @TipoCobertura
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Vehiculo_GetPorCliente
    @ClienteId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, ClienteId, Marca, Modelo, Anio, Patente, Chasis, Motor, TipoCobertura
    FROM Vehiculos
    WHERE ClienteId = @ClienteId
    ORDER BY Marca, Modelo;
END
GO

/* =============================================================================
   6. STORED PROCEDURES — COMPANIAS
   ============================================================================= */

CREATE OR ALTER PROCEDURE sp_Compania_Insertar
    @Nombre   NVARCHAR(100),
    @CUIT     VARCHAR(15)  = NULL,
    @Telefono VARCHAR(30)  = NULL,
    @LogoUrl  VARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Companias (Nombre, CUIT, Telefono, LogoUrl)
    VALUES (@Nombre, @CUIT, @Telefono, @LogoUrl);

    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Compania_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, CUIT, Telefono, LogoUrl, Activo
    FROM Companias
    WHERE Activo = 1
    ORDER BY Nombre;
END
GO

CREATE OR ALTER PROCEDURE sp_Compania_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, CUIT, Telefono, LogoUrl, Activo
    FROM Companias
    WHERE Id = @Id;
END
GO

/* =============================================================================
   7. STORED PROCEDURES — POLIZAS
   ============================================================================= */

CREATE OR ALTER PROCEDURE sp_Poliza_Insertar
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

    DECLARE @Numero VARCHAR(20);
    SET @Numero = 'POL-' + FORMAT(GETUTCDATE(), 'yyyyMM') + '-' +
                  RIGHT('0000' + CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR), 4);

    INSERT INTO Polizas (
        Numero, ClienteId, VehiculoId, CompaniaId,
        FechaInicio, FechaFin, PrecioTotal, CantidadCuotas,
        Estado, PolizaOrigenId, FechaEmision
    )
    VALUES (
        @Numero, @ClienteId, @VehiculoId, @CompaniaId,
        @FechaInicio, @FechaFin, @PrecioTotal, @CantidadCuotas,
        @Estado, @PolizaOrigenId, @FechaEmision
    );

    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        Id, Numero, ClienteId, VehiculoId, CompaniaId,
        FechaInicio, FechaFin, PrecioTotal, CantidadCuotas,
        Estado, PolizaOrigenId, FechaEmision
    FROM Polizas
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_GetActivaPorVehiculo
    @VehiculoId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        Id, Numero, ClienteId, VehiculoId, CompaniaId,
        FechaInicio, FechaFin, PrecioTotal, CantidadCuotas,
        Estado, PolizaOrigenId, FechaEmision
    FROM Polizas
    WHERE VehiculoId = @VehiculoId
      AND Estado = 0;  -- Activa
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_CambiarEstado
    @Id     INT,
    @Estado INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Polizas SET Estado = @Estado WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_Buscar
    @Termino  NVARCHAR(100),
    @Offset   INT,
    @PageSize INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId,
        p.FechaInicio, p.FechaFin, p.PrecioTotal, p.CantidadCuotas,
        p.Estado, p.PolizaOrigenId, p.FechaEmision,
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
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

/* =============================================================================
   8. STORED PROCEDURES — COBROS
   ============================================================================= */

CREATE OR ALTER PROCEDURE sp_Cobro_Insertar
    @PolizaId         INT,
    @NumeroCuota      INT,
    @FechaVencimiento DATE,
    @Monto            DECIMAL(18,2),
    @Estado           INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Cobros (PolizaId, NumeroCuota, FechaVencimiento, Monto, Estado)
    VALUES (@PolizaId, @NumeroCuota, @FechaVencimiento, @Monto, @Estado);

    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Cobro_MarcarPagado
    @Id           INT,
    @FechaPago    DATETIME,
    @MetodoPagoId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Cobros
    SET Estado       = 1,   -- Pagado
        FechaPago    = @FechaPago,
        MetodoPagoId = @MetodoPagoId
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Cobro_GetPendientesMes
    @Mes  INT,
    @Anio INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        co.Id, co.PolizaId, co.NumeroCuota, co.FechaVencimiento, co.Monto,
        co.Estado, co.FechaPago, co.MetodoPagoId,
        p.Numero AS NroPoliza, c.Nombre AS ClienteNombre
    FROM Cobros co
    INNER JOIN Polizas  p ON p.Id = co.PolizaId
    INNER JOIN Clientes c ON c.Id = p.ClienteId
    WHERE co.Estado = 0   -- Pendiente
      AND MONTH(co.FechaVencimiento) = @Mes
      AND YEAR(co.FechaVencimiento)  = @Anio
    ORDER BY co.FechaVencimiento;
END
GO

CREATE OR ALTER PROCEDURE sp_Cobro_GetPorPoliza
    @PolizaId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, PolizaId, NumeroCuota, FechaVencimiento, Monto, Estado, FechaPago, MetodoPagoId
    FROM Cobros
    WHERE PolizaId = @PolizaId
    ORDER BY NumeroCuota;
END
GO

-- Ejecutado por Quartz.NET diariamente
CREATE OR ALTER PROCEDURE sp_Cobro_MarcarVencidos
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Cobros
    SET Estado = 2   -- Vencido
    WHERE Estado = 0 -- Pendiente
      AND FechaVencimiento < CAST(GETUTCDATE() AS DATE);
END
GO

/* =============================================================================
   9. STORED PROCEDURES — BÚSQUEDA GLOBAL
   ============================================================================= */

CREATE OR ALTER PROCEDURE sp_Busqueda_Global
    @Termino NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    -- UNION ALL sobre las tres tablas principales.
    -- Referencia = Id al que navegar (el vehículo apunta a su cliente).
    SELECT 'Cliente' AS Tipo, c.Id, c.Nombre AS Titulo, c.Documento AS Subtitulo, c.Id AS Referencia
    FROM Clientes c
    WHERE c.Nombre LIKE '%' + @Termino + '%'
       OR c.Documento LIKE '%' + @Termino + '%'

    UNION ALL

    SELECT 'Vehiculo' AS Tipo, v.Id, (v.Marca + ' ' + v.Modelo) AS Titulo, v.Patente AS Subtitulo, v.ClienteId AS Referencia
    FROM Vehiculos v
    WHERE v.Patente LIKE '%' + @Termino + '%'

    UNION ALL

    SELECT 'Poliza' AS Tipo, p.Id, p.Numero AS Titulo, c.Nombre AS Subtitulo, p.Id AS Referencia
    FROM Polizas p
    INNER JOIN Clientes c ON c.Id = p.ClienteId
    WHERE p.Numero LIKE '%' + @Termino + '%';
END
GO

/* =============================================================================
   9b. STORED PROCEDURES — MÉTODOS DE PAGO (catálogo compartido)
   ============================================================================= */

-- Alta de método de pago (solo Admin lo invoca desde la API)
CREATE OR ALTER PROCEDURE sp_MetodoPago_Insertar
    @Nombre NVARCHAR(60)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO MetodosPago (Nombre) VALUES (@Nombre);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

-- Listado visible para todos los usuarios autenticados
CREATE OR ALTER PROCEDURE sp_MetodoPago_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Activo
    FROM MetodosPago
    WHERE Activo = 1
    ORDER BY Nombre;
END
GO

/* =============================================================================
   10. STORED PROCEDURES — AUTENTICACIÓN
   ============================================================================= */

CREATE OR ALTER PROCEDURE sp_Usuario_GetByEmail
    @Email VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Email, PasswordHash, Rol, Activo, FechaAlta
    FROM Usuarios
    WHERE Email = @Email AND Activo = 1;
END
GO

CREATE OR ALTER PROCEDURE sp_Usuario_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Email, PasswordHash, Rol, Activo, FechaAlta
    FROM Usuarios
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_RefreshToken_Guardar
    @UsuarioId  INT,
    @Token      VARCHAR(100),
    @Expiracion DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO RefreshTokens (UsuarioId, Token, Expiracion)
    VALUES (@UsuarioId, @Token, @Expiracion);
END
GO

CREATE OR ALTER PROCEDURE sp_RefreshToken_Get
    @Token VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, UsuarioId, Token, Expiracion, Revocado, FechaCreado
    FROM RefreshTokens
    WHERE Token = @Token;
END
GO

CREATE OR ALTER PROCEDURE sp_RefreshToken_Revocar
    @Token VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE RefreshTokens SET Revocado = 1 WHERE Token = @Token;
END
GO

/* =============================================================================
   11. STORED PROCEDURES — AUDITORÍA
   ============================================================================= */

CREATE OR ALTER PROCEDURE sp_Auditoria_Insertar
    @Tabla         VARCHAR(50),
    @RegistroId    INT,
    @Campo         VARCHAR(50),
    @ValorAnterior NVARCHAR(200) = NULL,
    @ValorNuevo    NVARCHAR(200) = NULL,
    @UsuarioId     INT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO AuditoriaCambios (Tabla, RegistroId, Campo, ValorAnterior, ValorNuevo, UsuarioId)
    VALUES (@Tabla, @RegistroId, @Campo, @ValorAnterior, @ValorNuevo, @UsuarioId);
END
GO

CREATE OR ALTER PROCEDURE sp_Auditoria_GetPorRegistro
    @Tabla      VARCHAR(50),
    @RegistroId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Tabla, RegistroId, Campo, ValorAnterior, ValorNuevo, UsuarioId, Fecha
    FROM AuditoriaCambios
    WHERE Tabla = @Tabla AND RegistroId = @RegistroId
    ORDER BY Fecha DESC;
END
GO

/* =============================================================================
   12. STORED PROCEDURES — REPORTES
   ============================================================================= */

-- 11.2 — Cobros del Período
CREATE OR ALTER PROCEDURE sp_Reporte_CobrosPeriodo
    @Mes        INT,
    @Anio       INT,
    @Estado     INT = NULL,   -- 0=Pendiente 1=Pagado 2=Vencido ; NULL = todos
    @CompaniaId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        co.Id, co.NumeroCuota, co.FechaVencimiento, co.Monto, co.Estado, co.FechaPago,
        p.Numero AS NroPoliza,
        c.Nombre AS ClienteNombre,
        cp.Nombre AS Compania
    FROM Cobros co
    INNER JOIN Polizas   p  ON p.Id  = co.PolizaId
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    WHERE MONTH(co.FechaVencimiento) = @Mes
      AND YEAR(co.FechaVencimiento)  = @Anio
      AND (@Estado IS NULL OR co.Estado = @Estado)
      AND (@CompaniaId IS NULL OR p.CompaniaId = @CompaniaId)
    ORDER BY co.FechaVencimiento, cp.Nombre;
END
GO

-- 11.3 — Estado de Cuenta por Asegurado
CREATE OR ALTER PROCEDURE sp_Reporte_EstadoCuenta
    @ClienteId INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Detalle de cobros del cliente
    SELECT
        co.Id, p.Numero AS NroPoliza, co.NumeroCuota,
        co.FechaVencimiento, co.Monto, co.Estado, co.FechaPago
    FROM Cobros co
    INNER JOIN Polizas p ON p.Id = co.PolizaId
    WHERE p.ClienteId = @ClienteId
    ORDER BY co.FechaVencimiento;

    -- Totales: abonado vs adeudado
    SELECT
        ISNULL(SUM(CASE WHEN co.Estado = 1 THEN co.Monto END), 0) AS TotalAbonado,
        ISNULL(SUM(CASE WHEN co.Estado IN (0, 2) THEN co.Monto END), 0) AS TotalAdeudado
    FROM Cobros co
    INNER JOIN Polizas p ON p.Id = co.PolizaId
    WHERE p.ClienteId = @ClienteId;
END
GO

-- 11.4 — Deuda Acumulada (ranking de impagos)
CREATE OR ALTER PROCEDURE sp_Reporte_DeudaAcumulada
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.Id AS ClienteId,
        c.Nombre,
        c.Documento,
        c.Telefono,
        COUNT(co.Id)    AS CuotasImpagas,
        SUM(co.Monto)   AS MontoAdeudado
    FROM Cobros co
    INNER JOIN Polizas  p ON p.Id = co.PolizaId
    INNER JOIN Clientes c ON c.Id = p.ClienteId
    WHERE co.Estado = 2   -- Solo Vencido (cuotas efectivamente impagas, no futuras)
    GROUP BY c.Id, c.Nombre, c.Documento, c.Telefono
    ORDER BY MontoAdeudado DESC;
END
GO

-- 11.5 — Pólizas Próximas a Vencer
CREATE OR ALTER PROCEDURE sp_Reporte_PolizasPorVencer
    @DiasHorizonte INT = 30,
    @CompaniaId    INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.Nombre, c.Telefono, v.Patente,
        cp.Nombre AS Compania, p.Numero AS NroPoliza,
        p.FechaFin,
        DATEDIFF(DAY, GETUTCDATE(), p.FechaFin) AS DiasRestantes
    FROM Polizas p
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Vehiculos v  ON v.Id  = p.VehiculoId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    WHERE p.Estado = 0
      AND p.FechaFin BETWEEN CAST(GETUTCDATE() AS DATE)
                         AND DATEADD(DAY, @DiasHorizonte, GETUTCDATE())
      AND (@CompaniaId IS NULL OR p.CompaniaId = @CompaniaId)
    ORDER BY p.FechaFin ASC;
END
GO

-- 11.6 — Pólizas Vencidas sin Renovar
CREATE OR ALTER PROCEDURE sp_Reporte_VencidasSinRenovar
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.Nombre AS ClienteNombre,
        v.Patente,
        cp.Nombre AS Compania,
        p.Numero AS NroPoliza,
        p.FechaFin,
        DATEDIFF(DAY, p.FechaFin, GETUTCDATE()) AS DiasVencida,
        p.PrecioTotal
    FROM Polizas p
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Vehiculos v  ON v.Id  = p.VehiculoId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    WHERE p.Estado = 1   -- Vencida, nunca renovada
    ORDER BY DiasVencida DESC;
END
GO

-- 11.7 — Cartera por Compañía
CREATE OR ALTER PROCEDURE sp_Reporte_CarteraPorCompania
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        cp.Id AS CompaniaId,
        cp.Nombre AS Compania,
        COUNT(p.Id)                  AS CantidadPolizas,
        COUNT(DISTINCT p.ClienteId)  AS ClientesUnicos,
        SUM(p.PrecioTotal)           AS PrimaTotal
    FROM Polizas p
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    WHERE p.Estado = 0   -- Activas
    GROUP BY cp.Id, cp.Nombre
    ORDER BY PrimaTotal DESC;
END
GO

-- 11.8 — Producción Mensual
CREATE OR ALTER PROCEDURE sp_Reporte_ProduccionMensual
    @Mes  INT,
    @Anio INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        SUM(CASE WHEN p.PolizaOrigenId IS NULL THEN 1 ELSE 0 END) AS PolizasNuevas,
        SUM(CASE WHEN p.PolizaOrigenId IS NOT NULL THEN 1 ELSE 0 END) AS PolizasRenovadas,
        COUNT(p.Id)        AS TotalPolizas,
        SUM(p.PrecioTotal) AS PrimaEmitida
    FROM Polizas p
    WHERE MONTH(p.FechaEmision) = @Mes
      AND YEAR(p.FechaEmision)  = @Anio;
END
GO

-- 11.9 — Ingresos Proyectados (cuotas futuras pendientes agrupadas por mes)
CREATE OR ALTER PROCEDURE sp_Reporte_IngresosProyectados
    @Meses INT = 12
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        YEAR(co.FechaVencimiento)  AS Anio,
        MONTH(co.FechaVencimiento) AS Mes,
        SUM(co.Monto)              AS MontoProyectado,
        COUNT(co.Id)               AS CantidadCuotas
    FROM Cobros co
    WHERE co.Estado = 0   -- Pendiente
      AND co.FechaVencimiento >= CAST(GETUTCDATE() AS DATE)
      AND co.FechaVencimiento <  DATEADD(MONTH, @Meses, CAST(GETUTCDATE() AS DATE))
    GROUP BY YEAR(co.FechaVencimiento), MONTH(co.FechaVencimiento)
    ORDER BY Anio, Mes;
END
GO

/* =============================================================================
   13. STORED PROCEDURES — LISTADOS CON FILTROS Y PAGINACIÓN
   ============================================================================= */

-- Listado de pólizas con filtros opcionales + total para paginación
CREATE OR ALTER PROCEDURE sp_Poliza_Listar
    @ClienteId INT = NULL,
    @Estado    INT = NULL,
    @Offset    INT,
    @PageSize  INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId,
        p.FechaInicio, p.FechaFin, p.PrecioTotal, p.CantidadCuotas,
        p.Estado, p.PolizaOrigenId, p.FechaEmision,
        c.Nombre AS ClienteNombre, v.Patente,
        COUNT(*) OVER() AS Total
    FROM Polizas p
    INNER JOIN Clientes  c ON c.Id = p.ClienteId
    INNER JOIN Vehiculos v ON v.Id = p.VehiculoId
    WHERE (@ClienteId IS NULL OR p.ClienteId = @ClienteId)
      AND (@Estado    IS NULL OR p.Estado    = @Estado)
    ORDER BY p.FechaEmision DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

/* =============================================================================
   14. STORED PROCEDURES — USUARIOS (gestión)
   ============================================================================= */

CREATE OR ALTER PROCEDURE sp_Usuario_Insertar
    @Nombre       NVARCHAR(150),
    @Email        VARCHAR(100),
    @PasswordHash VARCHAR(255),
    @Rol          VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Usuarios (Nombre, Email, PasswordHash, Rol)
    VALUES (@Nombre, @Email, @PasswordHash, @Rol);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Usuario_CambiarPassword
    @Id           INT,
    @PasswordHash VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Usuarios SET PasswordHash = @PasswordHash WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Usuario_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Email, Rol, Activo, FechaAlta
    FROM Usuarios
    ORDER BY Nombre;
END
GO

/* =============================================================================
   15. STORED PROCEDURES — SOPORTE DE VALIDACIONES DE NEGOCIO
   ============================================================================= */

CREATE OR ALTER PROCEDURE sp_Cobro_GetById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, PolizaId, NumeroCuota, FechaVencimiento, Monto, Estado, FechaPago, MetodoPagoId
    FROM Cobros
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Vehiculo_GetByPatente
    @Patente VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, ClienteId, Marca, Modelo, Anio, Patente, Chasis, Motor, TipoCobertura
    FROM Vehiculos
    WHERE Patente = @Patente;
END
GO

/* =============================================================================
   16. NOTIFICACIONES DE VENCIMIENTO (recordatorios Email / WhatsApp)
   ============================================================================= */

-- Log de notificaciones enviadas (idempotencia: no reenviar lo mismo)
IF OBJECT_ID('dbo.NotificacionesVencimiento', 'U') IS NULL
BEGIN
    CREATE TABLE NotificacionesVencimiento (
        Id           INT PRIMARY KEY IDENTITY,
        Tipo         VARCHAR(20)   NOT NULL,   -- 'Poliza' | 'Cuota'
        ReferenciaId INT           NOT NULL,   -- PolizaId o CobroId
        Canal        VARCHAR(20)   NOT NULL,   -- 'Email' | 'WhatsApp'
        Destino      NVARCHAR(150) NULL,       -- email o teléfono notificado
        FechaEnvio   DATETIME      NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE UNIQUE INDEX UX_Notif_Tipo_Ref_Canal
        ON NotificacionesVencimiento(Tipo, ReferenciaId, Canal);
END
GO

-- Pólizas activas cuya FechaFin vence exactamente en @Dias días
CREATE OR ALTER PROCEDURE sp_Notif_PolizasPorVencer
    @Dias INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        p.Id AS PolizaId, p.Numero, p.FechaFin,
        c.Nombre AS ClienteNombre, c.Email, c.Telefono,
        v.Patente, cp.Nombre AS Compania
    FROM Polizas p
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Vehiculos v  ON v.Id  = p.VehiculoId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    WHERE p.Estado = 0
      AND p.FechaFin = DATEADD(DAY, @Dias, CAST(GETUTCDATE() AS DATE));
END
GO

-- Cuotas pendientes cuyo vencimiento es exactamente en @Dias días
CREATE OR ALTER PROCEDURE sp_Notif_CuotasPorVencer
    @Dias INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        co.Id AS CobroId, co.NumeroCuota, co.Monto, co.FechaVencimiento,
        p.Numero AS NroPoliza,
        c.Nombre AS ClienteNombre, c.Email, c.Telefono
    FROM Cobros co
    INNER JOIN Polizas  p ON p.Id = co.PolizaId
    INNER JOIN Clientes c ON c.Id = p.ClienteId
    WHERE co.Estado = 0
      AND co.FechaVencimiento = DATEADD(DAY, @Dias, CAST(GETUTCDATE() AS DATE));
END
GO

CREATE OR ALTER PROCEDURE sp_Notif_YaEnviada
    @Tipo VARCHAR(20), @ReferenciaId INT, @Canal VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS Enviada
    FROM NotificacionesVencimiento
    WHERE Tipo = @Tipo AND ReferenciaId = @ReferenciaId AND Canal = @Canal;
END
GO

CREATE OR ALTER PROCEDURE sp_Notif_Registrar
    @Tipo VARCHAR(20), @ReferenciaId INT, @Canal VARCHAR(20), @Destino NVARCHAR(150) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM NotificacionesVencimiento
                   WHERE Tipo = @Tipo AND ReferenciaId = @ReferenciaId AND Canal = @Canal)
        INSERT INTO NotificacionesVencimiento (Tipo, ReferenciaId, Canal, Destino)
        VALUES (@Tipo, @ReferenciaId, @Canal, @Destino);
END
GO

/* =============================================================================
   17. RESET DE CONTRASEÑA CON AUTORIZACIÓN DEL ADMINISTRADOR
   ============================================================================= */

-- Estado: 0=Pendiente 1=Autorizada 2=Completada 3=Rechazada
IF OBJECT_ID('dbo.SolicitudesReset', 'U') IS NULL
BEGIN
    CREATE TABLE SolicitudesReset (
        Id                INT PRIMARY KEY IDENTITY,
        UsuarioId         INT          NOT NULL REFERENCES Usuarios(Id),
        Email             VARCHAR(100) NOT NULL,
        Estado            INT          NOT NULL DEFAULT 0,
        FechaSolicitud    DATETIME     NOT NULL DEFAULT GETUTCDATE(),
        FechaAutorizacion DATETIME     NULL,
        AutorizadoPor     INT          NULL
    );
    CREATE INDEX IX_SolicitudesReset_Estado ON SolicitudesReset(Estado);
END
GO

-- Crea una solicitud pendiente (evita duplicar si ya hay una pendiente o autorizada)
CREATE OR ALTER PROCEDURE sp_Reset_Solicitar
    @UsuarioId INT, @Email VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM SolicitudesReset WHERE UsuarioId = @UsuarioId AND Estado IN (0, 1))
        INSERT INTO SolicitudesReset (UsuarioId, Email) VALUES (@UsuarioId, @Email);
END
GO

-- Solicitudes pendientes (para el panel del Admin)
CREATE OR ALTER PROCEDURE sp_Reset_GetPendientes
AS
BEGIN
    SET NOCOUNT ON;
    SELECT s.Id, s.UsuarioId, s.Email, s.Estado, s.FechaSolicitud,
           u.Nombre AS UsuarioNombre, u.Rol
    FROM SolicitudesReset s
    INNER JOIN Usuarios u ON u.Id = s.UsuarioId
    WHERE s.Estado = 0
    ORDER BY s.FechaSolicitud;
END
GO

CREATE OR ALTER PROCEDURE sp_Reset_Autorizar
    @Id INT, @AdminId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE SolicitudesReset
    SET Estado = 1, FechaAutorizacion = GETUTCDATE(), AutorizadoPor = @AdminId
    WHERE Id = @Id AND Estado = 0;
    SELECT @@ROWCOUNT AS Afectadas;
END
GO

-- Última solicitud autorizada para un email (para que el vendedor confirme)
CREATE OR ALTER PROCEDURE sp_Reset_GetAutorizadaPorEmail
    @Email VARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 Id, UsuarioId, Email, Estado
    FROM SolicitudesReset
    WHERE Email = @Email AND Estado = 1
    ORDER BY FechaAutorizacion DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_Reset_Completar
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE SolicitudesReset SET Estado = 2 WHERE Id = @Id;
END
GO

/* =============================================================================
   18. RAMOS (multi-ramo) — catálogo admin + póliza con ramo, vehículo opcional
   ============================================================================= */

IF OBJECT_ID('dbo.Ramos','U') IS NULL
BEGIN
    CREATE TABLE Ramos (
        Id     INT PRIMARY KEY IDENTITY,
        Nombre NVARCHAR(60) NOT NULL UNIQUE,
        Activo BIT NOT NULL DEFAULT 1
    );
END
GO

-- Pólizas: RamoId + VehiculoId pasa a opcional (ramos sin vehículo)
IF COL_LENGTH('dbo.Polizas','RamoId') IS NULL
    ALTER TABLE Polizas ADD RamoId INT NULL REFERENCES Ramos(Id);
GO
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Polizas') AND name='VehiculoId' AND is_nullable = 0)
    ALTER TABLE Polizas ALTER COLUMN VehiculoId INT NULL;
GO

CREATE OR ALTER PROCEDURE sp_Ramo_Insertar @Nombre NVARCHAR(60) AS
BEGIN SET NOCOUNT ON; INSERT INTO Ramos (Nombre) VALUES (@Nombre); SELECT SCOPE_IDENTITY() AS NuevoId; END
GO
CREATE OR ALTER PROCEDURE sp_Ramo_GetAll AS
BEGIN SET NOCOUNT ON; SELECT Id, Nombre, Activo FROM Ramos WHERE Activo = 1 ORDER BY Nombre; END
GO

-- sp_Poliza_Insertar con @RamoId y @VehiculoId opcional
CREATE OR ALTER PROCEDURE sp_Poliza_Insertar
    @ClienteId INT, @VehiculoId INT = NULL, @CompaniaId INT, @FechaInicio DATE, @FechaFin DATE,
    @PrecioTotal DECIMAL(18,2), @CantidadCuotas INT, @Estado INT, @PolizaOrigenId INT = NULL,
    @FechaEmision DATETIME, @RamoId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Numero VARCHAR(20);
    SET @Numero = 'POL-' + FORMAT(GETUTCDATE(), 'yyyyMM') + '-' +
                  RIGHT('0000' + CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR), 4);
    INSERT INTO Polizas (Numero, ClienteId, VehiculoId, CompaniaId, FechaInicio, FechaFin,
                         PrecioTotal, CantidadCuotas, Estado, PolizaOrigenId, FechaEmision, RamoId)
    VALUES (@Numero, @ClienteId, @VehiculoId, @CompaniaId, @FechaInicio, @FechaFin,
            @PrecioTotal, @CantidadCuotas, @Estado, @PolizaOrigenId, @FechaEmision, @RamoId);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_GetById @Id INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre
    FROM Polizas p LEFT JOIN Ramos r ON r.Id = p.RamoId
    WHERE p.Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_GetActivaPorVehiculo @VehiculoId INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Numero, ClienteId, VehiculoId, CompaniaId, FechaInicio, FechaFin,
           PrecioTotal, CantidadCuotas, Estado, PolizaOrigenId, FechaEmision, RamoId
    FROM Polizas WHERE VehiculoId = @VehiculoId AND Estado = 0;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_Listar
    @ClienteId INT = NULL, @Estado INT = NULL, @Offset INT, @PageSize INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, c.Nombre AS ClienteNombre, v.Patente,
           COUNT(*) OVER() AS Total
    FROM Polizas p
    INNER JOIN Clientes  c ON c.Id = p.ClienteId
    LEFT  JOIN Vehiculos v ON v.Id = p.VehiculoId
    LEFT  JOIN Ramos     r ON r.Id = p.RamoId
    WHERE (@ClienteId IS NULL OR p.ClienteId = @ClienteId)
      AND (@Estado    IS NULL OR p.Estado    = @Estado)
    ORDER BY p.FechaEmision DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

/* =============================================================================
   19. EDITAR PÓLIZA (cobertura)
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Poliza_Actualizar
    @Id INT, @CompaniaId INT, @RamoId INT = NULL, @FechaInicio DATE, @FechaFin DATE,
    @PrecioTotal DECIMAL(18,2), @CantidadCuotas INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Polizas SET CompaniaId=@CompaniaId, RamoId=@RamoId, FechaInicio=@FechaInicio,
                       FechaFin=@FechaFin, PrecioTotal=@PrecioTotal, CantidadCuotas=@CantidadCuotas
    WHERE Id=@Id;
END
GO

/* =============================================================================
   20. BAJAS / ANULACIONES (con aprobación del Admin)
   ============================================================================= */
IF OBJECT_ID('dbo.Bajas','U') IS NULL
BEGIN
    CREATE TABLE Bajas (
        Id INT PRIMARY KEY IDENTITY,
        PolizaId INT NOT NULL REFERENCES Polizas(Id),
        Motivo NVARCHAR(60) NOT NULL,
        Observaciones NVARCHAR(300) NULL,
        Estado INT NOT NULL DEFAULT 0,      -- 0=Pendiente 1=Aprobada 2=Rechazada
        SolicitadoPor INT NOT NULL,
        FechaSolicitud DATETIME NOT NULL DEFAULT GETUTCDATE(),
        ResueltoPor INT NULL,
        FechaResolucion DATETIME NULL
    );
    CREATE INDEX IX_Bajas_Estado ON Bajas(Estado);
END
GO

CREATE OR ALTER PROCEDURE sp_Baja_Solicitar
    @PolizaId INT, @Motivo NVARCHAR(60), @Observaciones NVARCHAR(300) = NULL, @UsuarioId INT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Bajas WHERE PolizaId = @PolizaId AND Estado = 0)
    BEGIN SELECT CAST(0 AS INT) AS NuevoId; RETURN; END
    INSERT INTO Bajas (PolizaId, Motivo, Observaciones, SolicitadoPor)
    VALUES (@PolizaId, @Motivo, @Observaciones, @UsuarioId);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Baja_GetAll @Estado INT = NULL AS
BEGIN
    SET NOCOUNT ON;
    SELECT b.Id, b.PolizaId, p.Numero AS NroPoliza, c.Nombre AS ClienteNombre,
           b.Motivo, b.Observaciones, b.Estado, b.FechaSolicitud
    FROM Bajas b
    INNER JOIN Polizas  p ON p.Id = b.PolizaId
    INNER JOIN Clientes c ON c.Id = p.ClienteId
    WHERE (@Estado IS NULL OR b.Estado = @Estado)
    ORDER BY b.FechaSolicitud DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_Baja_Aprobar @Id INT, @AdminId INT AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @PolizaId INT = (SELECT PolizaId FROM Bajas WHERE Id = @Id AND Estado = 0);
        IF @PolizaId IS NULL BEGIN ROLLBACK TRANSACTION; SELECT CAST(0 AS INT) AS Afectadas; RETURN; END
        UPDATE Bajas SET Estado = 1, ResueltoPor = @AdminId, FechaResolucion = GETUTCDATE() WHERE Id = @Id;
        UPDATE Polizas SET Estado = 2 WHERE Id = @PolizaId;
        COMMIT TRANSACTION;
        SELECT CAST(1 AS INT) AS Afectadas;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_Baja_Rechazar @Id INT, @AdminId INT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Bajas SET Estado = 2, ResueltoPor = @AdminId, FechaResolucion = GETUTCDATE()
    WHERE Id = @Id AND Estado = 0;
    SELECT @@ROWCOUNT AS Afectadas;
END
GO

/* =============================================================================
   21. REPORTE — PAGOS RECIBIDOS (base de Pagos / Rendición / Hechos del día)
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Reporte_PagosRecibidos
    @Desde DATE, @Hasta DATE, @CompaniaId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT co.Id, co.FechaPago, co.Monto, co.NumeroCuota,
           p.Numero AS NroPoliza, c.Nombre AS ClienteNombre,
           cp.Nombre AS Compania, p.CompaniaId,
           ISNULL(r.Nombre,'—') AS Ramo,
           ISNULL(mp.Nombre,'Sin especificar') AS Metodo
    FROM Cobros co
    INNER JOIN Polizas   p  ON p.Id  = co.PolizaId
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    LEFT  JOIN Ramos       r  ON r.Id  = p.RamoId
    LEFT  JOIN MetodosPago mp ON mp.Id = co.MetodoPagoId
    WHERE co.Estado = 1
      AND co.FechaPago >= @Desde AND co.FechaPago < DATEADD(DAY, 1, @Hasta)
      AND (@CompaniaId IS NULL OR p.CompaniaId = @CompaniaId)
    ORDER BY co.FechaPago DESC;
END
GO

/* =============================================================================
   22. CAMPOS POR RAMO — tipo de documento, combustión y forma de pago
   Columnas nuevas (idempotentes) + SPs extendidos. Esta sección va al final:
   las columnas se agregan antes de redefinir los SPs que las referencian, y los
   CREATE OR ALTER sobreescriben las definiciones anteriores.
   ============================================================================= */

IF COL_LENGTH('dbo.Clientes','TipoDocumento') IS NULL
    ALTER TABLE Clientes ADD TipoDocumento VARCHAR(20) NULL;
GO
IF COL_LENGTH('dbo.Vehiculos','Combustion') IS NULL
    ALTER TABLE Vehiculos ADD Combustion VARCHAR(40) NULL;
GO
IF COL_LENGTH('dbo.Polizas','FormaPago') IS NULL
    ALTER TABLE Polizas ADD FormaPago VARCHAR(40) NULL;
GO

/* --- Clientes --- */
CREATE OR ALTER PROCEDURE sp_Cliente_Insertar
    @Nombre    NVARCHAR(150),
    @Documento VARCHAR(20),
    @Email     VARCHAR(100)  = NULL,
    @Telefono  VARCHAR(30)   = NULL,
    @Direccion NVARCHAR(200) = NULL,
    @TipoDocumento VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Clientes (Nombre, Documento, Email, Telefono, Direccion, TipoDocumento)
    VALUES (@Nombre, @Documento, @Email, @Telefono, @Direccion, @TipoDocumento);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Cliente_Actualizar
    @Id        INT,
    @Nombre    NVARCHAR(150),
    @Email     VARCHAR(100)  = NULL,
    @Telefono  VARCHAR(30)   = NULL,
    @Direccion NVARCHAR(200) = NULL,
    @TipoDocumento VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Clientes
    SET Nombre = @Nombre, Email = @Email, Telefono = @Telefono,
        Direccion = @Direccion,
        TipoDocumento = COALESCE(@TipoDocumento, TipoDocumento)
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Cliente_GetById @Id INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Documento, Email, Telefono, Direccion, FechaAlta, Activo, TipoDocumento
    FROM Clientes WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Cliente_Buscar
    @Termino NVARCHAR(100), @Offset INT, @PageSize INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Documento, Email, Telefono, Direccion, FechaAlta, Activo, TipoDocumento,
           COUNT(*) OVER() AS Total
    FROM Clientes
    WHERE @Termino = '' OR Nombre LIKE '%' + @Termino + '%' OR Documento LIKE '%' + @Termino + '%'
    ORDER BY Nombre ASC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

/* --- Vehiculos --- */
CREATE OR ALTER PROCEDURE sp_Vehiculo_Insertar
    @ClienteId INT, @Marca VARCHAR(60), @Modelo VARCHAR(60), @Anio SMALLINT,
    @Patente VARCHAR(10), @Chasis VARCHAR(50) = NULL, @Motor VARCHAR(50) = NULL,
    @TipoCobertura VARCHAR(40) = NULL, @Combustion VARCHAR(40) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Vehiculos (ClienteId, Marca, Modelo, Anio, Patente, Chasis, Motor, TipoCobertura, Combustion)
    VALUES (@ClienteId, @Marca, @Modelo, @Anio, @Patente, @Chasis, @Motor, @TipoCobertura, @Combustion);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Vehiculo_Actualizar
    @Id INT, @Marca VARCHAR(60), @Modelo VARCHAR(60), @Anio SMALLINT,
    @Chasis VARCHAR(50) = NULL, @Motor VARCHAR(50) = NULL,
    @TipoCobertura VARCHAR(40) = NULL, @Combustion VARCHAR(40) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Vehiculos
    SET Marca = @Marca, Modelo = @Modelo, Anio = @Anio, Chasis = @Chasis, Motor = @Motor,
        TipoCobertura = @TipoCobertura,
        Combustion = COALESCE(@Combustion, Combustion)
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Vehiculo_GetPorCliente @ClienteId INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, ClienteId, Marca, Modelo, Anio, Patente, Chasis, Motor, TipoCobertura, Combustion
    FROM Vehiculos WHERE ClienteId = @ClienteId ORDER BY Marca, Modelo;
END
GO

CREATE OR ALTER PROCEDURE sp_Vehiculo_GetByPatente @Patente VARCHAR(10) AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, ClienteId, Marca, Modelo, Anio, Patente, Chasis, Motor, TipoCobertura, Combustion
    FROM Vehiculos WHERE Patente = @Patente;
END
GO

/* --- Polizas --- */
CREATE OR ALTER PROCEDURE sp_Poliza_Insertar
    @ClienteId INT, @VehiculoId INT = NULL, @CompaniaId INT, @FechaInicio DATE, @FechaFin DATE,
    @PrecioTotal DECIMAL(18,2), @CantidadCuotas INT, @Estado INT, @PolizaOrigenId INT = NULL,
    @FechaEmision DATETIME, @RamoId INT = NULL, @FormaPago VARCHAR(40) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Numero VARCHAR(20);
    SET @Numero = 'POL-' + FORMAT(GETUTCDATE(), 'yyyyMM') + '-' +
                  RIGHT('0000' + CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR), 4);
    INSERT INTO Polizas (Numero, ClienteId, VehiculoId, CompaniaId, FechaInicio, FechaFin,
                         PrecioTotal, CantidadCuotas, Estado, PolizaOrigenId, FechaEmision, RamoId, FormaPago)
    VALUES (@Numero, @ClienteId, @VehiculoId, @CompaniaId, @FechaInicio, @FechaFin,
            @PrecioTotal, @CantidadCuotas, @Estado, @PolizaOrigenId, @FechaEmision, @RamoId, @FormaPago);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_GetById @Id INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, p.FormaPago
    FROM Polizas p LEFT JOIN Ramos r ON r.Id = p.RamoId
    WHERE p.Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_Listar
    @ClienteId INT = NULL, @Estado INT = NULL, @Offset INT, @PageSize INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, c.Nombre AS ClienteNombre, v.Patente, p.FormaPago,
           COUNT(*) OVER() AS Total
    FROM Polizas p
    INNER JOIN Clientes  c ON c.Id = p.ClienteId
    LEFT  JOIN Vehiculos v ON v.Id = p.VehiculoId
    LEFT  JOIN Ramos     r ON r.Id = p.RamoId
    WHERE (@ClienteId IS NULL OR p.ClienteId = @ClienteId)
      AND (@Estado    IS NULL OR p.Estado    = @Estado)
    ORDER BY p.FechaEmision DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_Actualizar
    @Id INT, @CompaniaId INT, @RamoId INT = NULL, @FechaInicio DATE, @FechaFin DATE,
    @PrecioTotal DECIMAL(18,2), @CantidadCuotas INT, @FormaPago VARCHAR(40) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Polizas SET CompaniaId=@CompaniaId, RamoId=@RamoId, FechaInicio=@FechaInicio,
                       FechaFin=@FechaFin, PrecioTotal=@PrecioTotal, CantidadCuotas=@CantidadCuotas,
                       FormaPago=COALESCE(@FormaPago, FormaPago)
    WHERE Id=@Id;
END
GO

/* =============================================================================
   23. STATS PÚBLICAS — conteos para el panel de bienvenida (login, sin auth)
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Stats_Publicas AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM Polizas  WHERE Estado = 0) AS PolizasActivas,
        (SELECT COUNT(*) FROM Clientes WHERE Activo = 1) AS Clientes,
        (SELECT COUNT(*) FROM Companias WHERE Activo = 1) AS Companias;
END
GO

/* =============================================================================
   24. ANULACIÓN DE PAGOS (revertir cuota pagada; con aprobación del Admin)
   ============================================================================= */
IF OBJECT_ID('dbo.AnulacionesCobro','U') IS NULL
BEGIN
    CREATE TABLE AnulacionesCobro (
        Id              INT PRIMARY KEY IDENTITY,
        CobroId         INT NOT NULL REFERENCES Cobros(Id),
        Estado          INT NOT NULL DEFAULT 0,   -- 0=Pendiente 1=Aprobada 2=Rechazada
        Motivo          NVARCHAR(200) NULL,
        SolicitadoPor   INT NOT NULL,
        FechaSolicitud  DATETIME NOT NULL DEFAULT GETUTCDATE(),
        ResueltoPor     INT NULL,
        FechaResolucion DATETIME NULL
    );
    CREATE INDEX IX_AnulacionesCobro_Estado ON AnulacionesCobro(Estado);
END
GO

-- Revierte una cuota pagada a Pendiente (uso directo del Admin/AM)
CREATE OR ALTER PROCEDURE sp_Cobro_AnularPago @CobroId INT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Cobros SET Estado = 0, FechaPago = NULL, MetodoPagoId = NULL
    WHERE Id = @CobroId AND Estado = 1;
    SELECT @@ROWCOUNT AS Afectadas;
END
GO

-- Solicitud de anulación (Productor) — queda pendiente de aprobación
CREATE OR ALTER PROCEDURE sp_Anulacion_Solicitar
    @CobroId INT, @UsuarioId INT, @Motivo NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM AnulacionesCobro WHERE CobroId = @CobroId AND Estado = 0)
    BEGIN SELECT CAST(0 AS INT) AS NuevoId; RETURN; END
    INSERT INTO AnulacionesCobro (CobroId, Motivo, SolicitadoPor)
    VALUES (@CobroId, @Motivo, @UsuarioId);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Anulacion_GetPendientes AS
BEGIN
    SET NOCOUNT ON;
    SELECT a.Id, a.CobroId, a.Motivo, a.FechaSolicitud,
           co.NumeroCuota, co.Monto,
           p.Numero AS NroPoliza, c.Nombre AS ClienteNombre,
           u.Nombre AS Solicitante
    FROM AnulacionesCobro a
    INNER JOIN Cobros   co ON co.Id = a.CobroId
    INNER JOIN Polizas  p  ON p.Id  = co.PolizaId
    INNER JOIN Clientes c  ON c.Id  = p.ClienteId
    LEFT  JOIN Usuarios u  ON u.Id  = a.SolicitadoPor
    WHERE a.Estado = 0
    ORDER BY a.FechaSolicitud DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_Anulacion_Aprobar @Id INT, @AdminId INT AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @CobroId INT = (SELECT CobroId FROM AnulacionesCobro WHERE Id = @Id AND Estado = 0);
        IF @CobroId IS NULL BEGIN ROLLBACK TRANSACTION; SELECT CAST(0 AS INT) AS Afectadas; RETURN; END
        UPDATE Cobros SET Estado = 0, FechaPago = NULL, MetodoPagoId = NULL WHERE Id = @CobroId;
        UPDATE AnulacionesCobro SET Estado = 1, ResueltoPor = @AdminId, FechaResolucion = GETUTCDATE() WHERE Id = @Id;
        COMMIT TRANSACTION;
        SELECT CAST(1 AS INT) AS Afectadas;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_Anulacion_Rechazar @Id INT, @AdminId INT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE AnulacionesCobro SET Estado = 2, ResueltoPor = @AdminId, FechaResolucion = GETUTCDATE()
    WHERE Id = @Id AND Estado = 0;
    SELECT @@ROWCOUNT AS Afectadas;
END
GO

/* =============================================================================
   25. ELIMINAR (baja lógica) catálogos — compañías, métodos de pago, ramos
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Compania_Eliminar @Id INT AS
BEGIN SET NOCOUNT ON; UPDATE Companias SET Activo = 0 WHERE Id = @Id; SELECT @@ROWCOUNT AS Afectadas; END
GO
CREATE OR ALTER PROCEDURE sp_MetodoPago_Eliminar @Id INT AS
BEGIN SET NOCOUNT ON; UPDATE MetodosPago SET Activo = 0 WHERE Id = @Id; SELECT @@ROWCOUNT AS Afectadas; END
GO
CREATE OR ALTER PROCEDURE sp_Ramo_Eliminar @Id INT AS
BEGIN SET NOCOUNT ON; UPDATE Ramos SET Activo = 0 WHERE Id = @Id; SELECT @@ROWCOUNT AS Afectadas; END
GO

/* =============================================================================
   26. PRIMA OG (precio real, interno) + Nº de póliza E/T → definitivo
   ============================================================================= */
IF COL_LENGTH('dbo.Polizas','PrimaOG') IS NULL
    ALTER TABLE Polizas ADD PrimaOG DECIMAL(18,2) NULL;
GO

-- Inserción: si @EnTramite=1 el número sale como "E/T-######" (en trámite)
CREATE OR ALTER PROCEDURE sp_Poliza_Insertar
    @ClienteId INT, @VehiculoId INT = NULL, @CompaniaId INT, @FechaInicio DATE, @FechaFin DATE,
    @PrecioTotal DECIMAL(18,2), @CantidadCuotas INT, @Estado INT, @PolizaOrigenId INT = NULL,
    @FechaEmision DATETIME, @RamoId INT = NULL, @FormaPago VARCHAR(40) = NULL,
    @PrimaOG DECIMAL(18,2) = NULL, @EnTramite BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Numero VARCHAR(20);
    IF @EnTramite = 1
        SET @Numero = 'E/T-' + RIGHT('000000' + CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR), 6);
    ELSE
        SET @Numero = 'POL-' + FORMAT(GETUTCDATE(), 'yyyyMM') + '-' +
                      RIGHT('0000' + CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR), 4);
    INSERT INTO Polizas (Numero, ClienteId, VehiculoId, CompaniaId, FechaInicio, FechaFin,
                         PrecioTotal, CantidadCuotas, Estado, PolizaOrigenId, FechaEmision, RamoId, FormaPago, PrimaOG)
    VALUES (@Numero, @ClienteId, @VehiculoId, @CompaniaId, @FechaInicio, @FechaFin,
            @PrecioTotal, @CantidadCuotas, @Estado, @PolizaOrigenId, @FechaEmision, @RamoId, @FormaPago, @PrimaOG);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_GetById @Id INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, p.FormaPago, p.PrimaOG
    FROM Polizas p LEFT JOIN Ramos r ON r.Id = p.RamoId
    WHERE p.Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_Listar
    @ClienteId INT = NULL, @Estado INT = NULL, @Offset INT, @PageSize INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, c.Nombre AS ClienteNombre, v.Patente, p.FormaPago, p.PrimaOG,
           COUNT(*) OVER() AS Total
    FROM Polizas p
    INNER JOIN Clientes  c ON c.Id = p.ClienteId
    LEFT  JOIN Vehiculos v ON v.Id = p.VehiculoId
    LEFT  JOIN Ramos     r ON r.Id = p.RamoId
    WHERE (@ClienteId IS NULL OR p.ClienteId = @ClienteId)
      AND (@Estado    IS NULL OR p.Estado    = @Estado)
    ORDER BY p.FechaEmision DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_Actualizar
    @Id INT, @CompaniaId INT, @RamoId INT = NULL, @FechaInicio DATE, @FechaFin DATE,
    @PrecioTotal DECIMAL(18,2), @CantidadCuotas INT, @FormaPago VARCHAR(40) = NULL,
    @PrimaOG DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Polizas SET CompaniaId=@CompaniaId, RamoId=@RamoId, FechaInicio=@FechaInicio,
                       FechaFin=@FechaFin, PrecioTotal=@PrecioTotal, CantidadCuotas=@CantidadCuotas,
                       FormaPago=COALESCE(@FormaPago, FormaPago),
                       PrimaOG=COALESCE(@PrimaOG, PrimaOG)
    WHERE Id=@Id;
END
GO

-- Asigna el número definitivo a una póliza E/T (valida unicidad)
CREATE OR ALTER PROCEDURE sp_Poliza_AsignarNumero @Id INT, @Numero VARCHAR(20) AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Polizas WHERE Numero = @Numero AND Id <> @Id)
    BEGIN SELECT CAST(-1 AS INT) AS Afectadas; RETURN; END
    UPDATE Polizas SET Numero = @Numero WHERE Id = @Id;
    SELECT @@ROWCOUNT AS Afectadas;
END
GO

-- Pagos recibidos ahora incluye PolizaId y PrimaOG (para la rendición)
CREATE OR ALTER PROCEDURE sp_Reporte_PagosRecibidos
    @Desde DATE, @Hasta DATE, @CompaniaId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT co.Id, co.FechaPago, co.Monto, co.NumeroCuota,
           p.Id AS PolizaId, p.Numero AS NroPoliza, p.PrimaOG,
           c.Nombre AS ClienteNombre,
           cp.Nombre AS Compania, p.CompaniaId,
           ISNULL(r.Nombre,'—') AS Ramo,
           ISNULL(mp.Nombre,'Sin especificar') AS Metodo
    FROM Cobros co
    INNER JOIN Polizas   p  ON p.Id  = co.PolizaId
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    LEFT  JOIN Ramos       r  ON r.Id  = p.RamoId
    LEFT  JOIN MetodosPago mp ON mp.Id = co.MetodoPagoId
    WHERE co.Estado = 1
      AND co.FechaPago >= @Desde AND co.FechaPago < DATEADD(DAY, 1, @Hasta)
      AND (@CompaniaId IS NULL OR p.CompaniaId = @CompaniaId)
    ORDER BY co.FechaPago DESC;
END
GO

/* =============================================================================
   27. BAJAS — incluir el solicitante en el listado
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Baja_GetAll @Estado INT = NULL AS
BEGIN
    SET NOCOUNT ON;
    SELECT b.Id, b.PolizaId, p.Numero AS NroPoliza, c.Nombre AS ClienteNombre,
           b.Motivo, b.Observaciones, b.Estado, b.FechaSolicitud,
           u.Nombre AS Solicitante
    FROM Bajas b
    INNER JOIN Polizas  p ON p.Id = b.PolizaId
    INNER JOIN Clientes c ON c.Id = p.ClienteId
    LEFT  JOIN Usuarios u ON u.Id = b.SolicitadoPor
    WHERE (@Estado IS NULL OR b.Estado = @Estado)
    ORDER BY b.FechaSolicitud DESC;
END
GO

/* =============================================================================
   28. MOVIMIENTOS — finanzas personales (ingresos / egresos) privadas por usuario
   ============================================================================= */
IF OBJECT_ID('dbo.Movimientos','U') IS NULL
BEGIN
    CREATE TABLE Movimientos (
        Id          INT PRIMARY KEY IDENTITY,
        UsuarioId   INT NOT NULL REFERENCES Usuarios(Id),
        Tipo        VARCHAR(10)   NOT NULL,   -- 'ingreso' | 'egreso'
        Monto       DECIMAL(18,2) NOT NULL,
        Categoria   NVARCHAR(60)  NULL,
        Descripcion NVARCHAR(200) NULL,
        Fecha       DATE          NOT NULL,
        FechaAlta   DATETIME      NOT NULL DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_Movimientos_Usuario ON Movimientos(UsuarioId, Fecha DESC);
END
GO

CREATE OR ALTER PROCEDURE sp_Movimiento_Insertar
    @UsuarioId INT, @Tipo VARCHAR(10), @Monto DECIMAL(18,2),
    @Categoria NVARCHAR(60) = NULL, @Descripcion NVARCHAR(200) = NULL, @Fecha DATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Movimientos (UsuarioId, Tipo, Monto, Categoria, Descripcion, Fecha)
    VALUES (@UsuarioId, @Tipo, @Monto, @Categoria, @Descripcion, @Fecha);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Movimiento_GetPorUsuario
    @UsuarioId INT, @Desde DATE = NULL, @Hasta DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, UsuarioId, Tipo, Monto, Categoria, Descripcion, Fecha
    FROM Movimientos
    WHERE UsuarioId = @UsuarioId
      AND (@Desde IS NULL OR Fecha >= @Desde)
      AND (@Hasta IS NULL OR Fecha <= @Hasta)
    ORDER BY Fecha DESC, Id DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_Movimiento_Eliminar @Id INT, @UsuarioId INT AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM Movimientos WHERE Id = @Id AND UsuarioId = @UsuarioId;
    SELECT @@ROWCOUNT AS Afectadas;
END
GO

/* =============================================================================
   29. LISTADO DE PÓLIZAS — conteo de cuotas (para los dots de Cobranzas)
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Poliza_Listar
    @ClienteId INT = NULL, @Estado INT = NULL, @Offset INT, @PageSize INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, c.Nombre AS ClienteNombre, v.Patente, p.FormaPago, p.PrimaOG,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id)                  AS CuotasTotal,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado=1)  AS CuotasPagadas,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado=2)  AS CuotasVencidas,
           COUNT(*) OVER() AS Total
    FROM Polizas p
    INNER JOIN Clientes  c ON c.Id = p.ClienteId
    LEFT  JOIN Vehiculos v ON v.Id = p.VehiculoId
    LEFT  JOIN Ramos     r ON r.Id = p.RamoId
    WHERE (@ClienteId IS NULL OR p.ClienteId = @ClienteId)
      AND (@Estado    IS NULL OR p.Estado    = @Estado)
    ORDER BY p.FechaEmision DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

/* =============================================================================
   30. CONFIGURACIONES (clave/valor) — p. ej. SMTP editable por el Admin
   ============================================================================= */
IF OBJECT_ID('dbo.Configuraciones','U') IS NULL
BEGIN
    CREATE TABLE Configuraciones (
        Clave              NVARCHAR(100) PRIMARY KEY,
        Valor              NVARCHAR(500) NULL,
        FechaActualizacion DATETIME NOT NULL DEFAULT GETUTCDATE()
    );
END
GO

CREATE OR ALTER PROCEDURE sp_Config_GetAll AS
BEGIN
    SET NOCOUNT ON;
    SELECT Clave, Valor FROM Configuraciones;
END
GO

CREATE OR ALTER PROCEDURE sp_Config_Set @Clave NVARCHAR(100), @Valor NVARCHAR(500) = NULL AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Configuraciones WHERE Clave = @Clave)
        UPDATE Configuraciones SET Valor = @Valor, FechaActualizacion = GETUTCDATE() WHERE Clave = @Clave;
    ELSE
        INSERT INTO Configuraciones (Clave, Valor) VALUES (@Clave, @Valor);
END
GO

/* =============================================================================
   31. OFICINAS — clientes por oficina, compartibles entre oficinas
   Regla de visibilidad (no-Admin): un cliente se ve si es de tu oficina, si está
   compartido con tu oficina, o si no tiene oficina asignada (global/compat).
   El Admin ve todos. Usuarios sin oficina también ven todos (compat).
   ============================================================================= */
IF OBJECT_ID('dbo.Oficinas','U') IS NULL
BEGIN
    CREATE TABLE Oficinas (
        Id     INT PRIMARY KEY IDENTITY,
        Nombre NVARCHAR(100) NOT NULL,
        Activo BIT NOT NULL DEFAULT 1
    );
END
GO
IF COL_LENGTH('dbo.Usuarios','OficinaId') IS NULL
    ALTER TABLE Usuarios ADD OficinaId INT NULL REFERENCES Oficinas(Id);
GO
IF COL_LENGTH('dbo.Clientes','OficinaId') IS NULL
    ALTER TABLE Clientes ADD OficinaId INT NULL REFERENCES Oficinas(Id);
GO
IF OBJECT_ID('dbo.ClientesCompartidos','U') IS NULL
BEGIN
    CREATE TABLE ClientesCompartidos (
        Id        INT PRIMARY KEY IDENTITY,
        ClienteId INT NOT NULL REFERENCES Clientes(Id),
        OficinaId INT NOT NULL REFERENCES Oficinas(Id)
    );
    CREATE UNIQUE INDEX UX_ClientesCompartidos ON ClientesCompartidos(ClienteId, OficinaId);
END
GO

/* --- Oficinas (catálogo, Admin) --- */
CREATE OR ALTER PROCEDURE sp_Oficina_Insertar @Nombre NVARCHAR(100) AS
BEGIN SET NOCOUNT ON; INSERT INTO Oficinas (Nombre) VALUES (@Nombre); SELECT SCOPE_IDENTITY() AS NuevoId; END
GO
CREATE OR ALTER PROCEDURE sp_Oficina_GetAll AS
BEGIN SET NOCOUNT ON; SELECT Id, Nombre, Activo FROM Oficinas WHERE Activo = 1 ORDER BY Nombre; END
GO
CREATE OR ALTER PROCEDURE sp_Oficina_Eliminar @Id INT AS
BEGIN SET NOCOUNT ON; UPDATE Oficinas SET Activo = 0 WHERE Id = @Id; SELECT @@ROWCOUNT AS Afectadas; END
GO

/* --- Asignar oficina a un usuario --- */
CREATE OR ALTER PROCEDURE sp_Usuario_AsignarOficina @UsuarioId INT, @OficinaId INT = NULL AS
BEGIN SET NOCOUNT ON; UPDATE Usuarios SET OficinaId = @OficinaId WHERE Id = @UsuarioId; SELECT @@ROWCOUNT AS Afectadas; END
GO

CREATE OR ALTER PROCEDURE sp_Usuario_GetAll AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.Id, u.Nombre, u.Email, u.Rol, u.Activo, u.FechaAlta, u.OficinaId, o.Nombre AS OficinaNombre
    FROM Usuarios u LEFT JOIN Oficinas o ON o.Id = u.OficinaId
    ORDER BY u.Nombre;
END
GO

/* --- Compartir / descompartir cliente con oficinas --- */
CREATE OR ALTER PROCEDURE sp_Cliente_Compartir @ClienteId INT, @OficinaId INT AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM ClientesCompartidos WHERE ClienteId = @ClienteId AND OficinaId = @OficinaId)
        INSERT INTO ClientesCompartidos (ClienteId, OficinaId) VALUES (@ClienteId, @OficinaId);
END
GO
CREATE OR ALTER PROCEDURE sp_Cliente_Descompartir @ClienteId INT, @OficinaId INT AS
BEGIN SET NOCOUNT ON; DELETE FROM ClientesCompartidos WHERE ClienteId = @ClienteId AND OficinaId = @OficinaId; END
GO
CREATE OR ALTER PROCEDURE sp_Cliente_GetOficinasCompartidas @ClienteId INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT o.Id, o.Nombre FROM ClientesCompartidos cc INNER JOIN Oficinas o ON o.Id = cc.OficinaId
    WHERE cc.ClienteId = @ClienteId ORDER BY o.Nombre;
END
GO

/* --- Cliente: alta con oficina, GetById con oficina --- */
CREATE OR ALTER PROCEDURE sp_Cliente_Insertar
    @Nombre NVARCHAR(150), @Documento VARCHAR(20), @Email VARCHAR(100) = NULL,
    @Telefono VARCHAR(30) = NULL, @Direccion NVARCHAR(200) = NULL,
    @TipoDocumento VARCHAR(20) = NULL, @OficinaId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Clientes (Nombre, Documento, Email, Telefono, Direccion, TipoDocumento, OficinaId)
    VALUES (@Nombre, @Documento, @Email, @Telefono, @Direccion, @TipoDocumento, @OficinaId);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Cliente_GetById @Id INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Documento, Email, Telefono, Direccion, FechaAlta, Activo, TipoDocumento, OficinaId
    FROM Clientes WHERE Id = @Id;
END
GO

/* --- Cliente: búsqueda con scoping por oficina --- */
CREATE OR ALTER PROCEDURE sp_Cliente_Buscar
    @Termino NVARCHAR(100), @Offset INT, @PageSize INT,
    @UsuarioId INT = NULL, @EsAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Ofi INT = (SELECT OficinaId FROM Usuarios WHERE Id = @UsuarioId);
    SELECT Id, Nombre, Documento, Email, Telefono, Direccion, FechaAlta, Activo, TipoDocumento, OficinaId,
           COUNT(*) OVER() AS Total
    FROM Clientes c
    WHERE (@Termino = '' OR Nombre LIKE '%' + @Termino + '%' OR Documento LIKE '%' + @Termino + '%')
      AND (@EsAdmin = 1 OR @Ofi IS NULL OR c.OficinaId IS NULL OR c.OficinaId = @Ofi
           OR EXISTS (SELECT 1 FROM ClientesCompartidos cc WHERE cc.ClienteId = c.Id AND cc.OficinaId = @Ofi))
    ORDER BY Nombre ASC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

/* --- Pólizas: listado con scoping por oficina del cliente --- */
CREATE OR ALTER PROCEDURE sp_Poliza_Listar
    @ClienteId INT = NULL, @Estado INT = NULL, @Offset INT, @PageSize INT,
    @UsuarioId INT = NULL, @EsAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Ofi INT = (SELECT OficinaId FROM Usuarios WHERE Id = @UsuarioId);
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, c.Nombre AS ClienteNombre, v.Patente, p.FormaPago, p.PrimaOG,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id)                  AS CuotasTotal,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado=1)  AS CuotasPagadas,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado=2)  AS CuotasVencidas,
           COUNT(*) OVER() AS Total
    FROM Polizas p
    INNER JOIN Clientes  c ON c.Id = p.ClienteId
    LEFT  JOIN Vehiculos v ON v.Id = p.VehiculoId
    LEFT  JOIN Ramos     r ON r.Id = p.RamoId
    WHERE (@ClienteId IS NULL OR p.ClienteId = @ClienteId)
      AND (@Estado    IS NULL OR p.Estado    = @Estado)
      AND (@EsAdmin = 1 OR @Ofi IS NULL OR c.OficinaId IS NULL OR c.OficinaId = @Ofi
           OR EXISTS (SELECT 1 FROM ClientesCompartidos cc WHERE cc.ClienteId = c.Id AND cc.OficinaId = @Ofi))
    ORDER BY p.FechaEmision DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

/* =============================================================================
   32. COBERTURAS — catálogo (Admin). Son las opciones al crear una póliza.
   ============================================================================= */
IF OBJECT_ID('dbo.Coberturas','U') IS NULL
BEGIN
    CREATE TABLE Coberturas (
        Id     INT PRIMARY KEY IDENTITY,
        Nombre NVARCHAR(80) NOT NULL UNIQUE,
        Activo BIT NOT NULL DEFAULT 1
    );
    INSERT INTO Coberturas (Nombre) VALUES
        ('Responsabilidad Civil'), ('Terceros Completo'), ('Terceros Completo Premium'),
        ('Todo Riesgo c/Franquicia'), ('Todo Riesgo s/Franquicia'), ('Robo e Incendio');
END
GO

CREATE OR ALTER PROCEDURE sp_Cobertura_Insertar @Nombre NVARCHAR(80) AS
BEGIN SET NOCOUNT ON; INSERT INTO Coberturas (Nombre) VALUES (@Nombre); SELECT SCOPE_IDENTITY() AS NuevoId; END
GO
CREATE OR ALTER PROCEDURE sp_Cobertura_GetAll AS
BEGIN SET NOCOUNT ON; SELECT Id, Nombre, Activo FROM Coberturas WHERE Activo = 1 ORDER BY Nombre; END
GO
CREATE OR ALTER PROCEDURE sp_Cobertura_Eliminar @Id INT AS
BEGIN SET NOCOUNT ON; UPDATE Coberturas SET Activo = 0 WHERE Id = @Id; SELECT @@ROWCOUNT AS Afectadas; END
GO

/* =============================================================================
   33. COLOR POR COMPAÑÍA
   ============================================================================= */
IF COL_LENGTH('dbo.Companias','Color') IS NULL
    ALTER TABLE Companias ADD Color VARCHAR(50) NULL;
GO

CREATE OR ALTER PROCEDURE sp_Compania_Insertar
    @Nombre NVARCHAR(100), @CUIT VARCHAR(15) = NULL, @Telefono VARCHAR(30) = NULL,
    @LogoUrl VARCHAR(300) = NULL, @Color VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Companias (Nombre, CUIT, Telefono, LogoUrl, Color)
    VALUES (@Nombre, @CUIT, @Telefono, @LogoUrl, @Color);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO
CREATE OR ALTER PROCEDURE sp_Compania_GetAll AS
BEGIN SET NOCOUNT ON; SELECT Id, Nombre, CUIT, Telefono, LogoUrl, Activo, Color FROM Companias WHERE Activo = 1 ORDER BY Nombre; END
GO
CREATE OR ALTER PROCEDURE sp_Compania_GetById @Id INT AS
BEGIN SET NOCOUNT ON; SELECT Id, Nombre, CUIT, Telefono, LogoUrl, Activo, Color FROM Companias WHERE Id = @Id; END
GO

/* =============================================================================
   35. REPORTES — filtro por oficina (vendedor) en pagos recibidos
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Reporte_PagosRecibidos
    @Desde DATE, @Hasta DATE, @CompaniaId INT = NULL, @OficinaId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT co.Id, co.FechaPago, co.Monto, co.NumeroCuota,
           p.Id AS PolizaId, p.Numero AS NroPoliza, p.PrimaOG,
           c.Nombre AS ClienteNombre,
           cp.Nombre AS Compania, p.CompaniaId,
           ISNULL(r.Nombre,'—') AS Ramo,
           ISNULL(mp.Nombre,'Sin especificar') AS Metodo,
           c.OficinaId, ISNULL(o.Nombre,'Sin oficina') AS OficinaNombre
    FROM Cobros co
    INNER JOIN Polizas   p  ON p.Id  = co.PolizaId
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    LEFT  JOIN Ramos       r  ON r.Id  = p.RamoId
    LEFT  JOIN MetodosPago mp ON mp.Id = co.MetodoPagoId
    LEFT  JOIN Oficinas    o  ON o.Id  = c.OficinaId
    WHERE co.Estado = 1
      AND co.FechaPago >= @Desde AND co.FechaPago < DATEADD(DAY, 1, @Hasta)
      AND (@CompaniaId IS NULL OR p.CompaniaId = @CompaniaId)
      AND (@OficinaId  IS NULL OR c.OficinaId  = @OficinaId)
    ORDER BY co.FechaPago DESC;
END
GO

/* =============================================================================
   34. BAJA DE USUARIOS (Admin) — baja lógica
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Usuario_Eliminar @Id INT AS
BEGIN SET NOCOUNT ON; UPDATE Usuarios SET Activo = 0 WHERE Id = @Id; SELECT @@ROWCOUNT AS Afectadas; END
GO

-- El listado muestra sólo usuarios activos (con su oficina)
CREATE OR ALTER PROCEDURE sp_Usuario_GetAll AS
BEGIN
    SET NOCOUNT ON;
    SELECT u.Id, u.Nombre, u.Email, u.Rol, u.Activo, u.FechaAlta, u.OficinaId, o.Nombre AS OficinaNombre
    FROM Usuarios u LEFT JOIN Oficinas o ON o.Id = u.OficinaId
    WHERE u.Activo = 1
    ORDER BY u.Nombre;
END
GO

/* =============================================================================
   36. VENDEDOR POR CLIENTE — rendición por usuario (solo Admin en la UI)
   ============================================================================= */
IF COL_LENGTH('Clientes','VendedorId') IS NULL
    ALTER TABLE Clientes ADD VendedorId INT NULL
        CONSTRAINT FK_Clientes_Vendedor REFERENCES Usuarios(Id);
GO

-- El cliente registra qué usuario (vendedor) lo dio de alta.
CREATE OR ALTER PROCEDURE sp_Cliente_Insertar
    @Nombre NVARCHAR(150), @Documento VARCHAR(20), @Email VARCHAR(100) = NULL,
    @Telefono VARCHAR(30) = NULL, @Direccion NVARCHAR(200) = NULL,
    @TipoDocumento VARCHAR(20) = NULL, @OficinaId INT = NULL, @VendedorId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Clientes (Nombre, Documento, Email, Telefono, Direccion, TipoDocumento, OficinaId, VendedorId)
    VALUES (@Nombre, @Documento, @Email, @Telefono, @Direccion, @TipoDocumento, @OficinaId, @VendedorId);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

-- Pagos recibidos: filtro opcional por vendedor (usuario que dio de alta el cliente).
CREATE OR ALTER PROCEDURE sp_Reporte_PagosRecibidos
    @Desde DATE, @Hasta DATE, @CompaniaId INT = NULL, @OficinaId INT = NULL, @VendedorId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT co.Id, co.FechaPago, co.Monto, co.NumeroCuota,
           p.Id AS PolizaId, p.Numero AS NroPoliza, p.PrimaOG, p.CantidadCuotas,
           c.Nombre AS ClienteNombre,
           cp.Nombre AS Compania, p.CompaniaId,
           ISNULL(r.Nombre,'-') AS Ramo,
           ISNULL(mp.Nombre,'Sin especificar') AS Metodo,
           c.OficinaId, ISNULL(o.Nombre,'Sin oficina') AS OficinaNombre,
           c.VendedorId, ISNULL(v.Nombre,'-') AS VendedorNombre
    FROM Cobros co
    INNER JOIN Polizas   p  ON p.Id  = co.PolizaId
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    LEFT  JOIN Ramos       r  ON r.Id  = p.RamoId
    LEFT  JOIN MetodosPago mp ON mp.Id = co.MetodoPagoId
    LEFT  JOIN Oficinas    o  ON o.Id  = c.OficinaId
    LEFT  JOIN Usuarios    v  ON v.Id  = c.VendedorId
    WHERE co.Estado = 1
      AND co.FechaPago >= @Desde AND co.FechaPago < DATEADD(DAY, 1, @Hasta)
      AND (@CompaniaId IS NULL OR p.CompaniaId = @CompaniaId)
      AND (@OficinaId  IS NULL OR c.OficinaId  = @OficinaId)
      AND (@VendedorId IS NULL OR c.VendedorId = @VendedorId)
    ORDER BY co.FechaPago DESC;
END
GO

/* =============================================================================
   37. VENDEDOR POR PÓLIZA / COBRO — atribución para reportes
       El vendedor de un cobro = quien lo registró; si no, quien cargó la póliza.
   ============================================================================= */
IF COL_LENGTH('Polizas','VendedorId') IS NULL
    ALTER TABLE Polizas ADD VendedorId INT NULL
        CONSTRAINT FK_Polizas_Vendedor REFERENCES Usuarios(Id);
GO
IF COL_LENGTH('Cobros','RegistradoPor') IS NULL
    ALTER TABLE Cobros ADD RegistradoPor INT NULL
        CONSTRAINT FK_Cobros_RegistradoPor REFERENCES Usuarios(Id);
GO

-- Póliza: registra qué usuario la cargó.
CREATE OR ALTER PROCEDURE sp_Poliza_Insertar
    @ClienteId INT, @VehiculoId INT = NULL, @CompaniaId INT, @FechaInicio DATE, @FechaFin DATE,
    @PrecioTotal DECIMAL(18,2), @CantidadCuotas INT, @Estado INT, @PolizaOrigenId INT = NULL,
    @FechaEmision DATETIME, @RamoId INT = NULL, @FormaPago VARCHAR(40) = NULL,
    @PrimaOG DECIMAL(18,2) = NULL, @EnTramite BIT = 0, @VendedorId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Numero VARCHAR(20);
    IF @EnTramite = 1
        SET @Numero = 'E/T-' + RIGHT('000000' + CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR), 6);
    ELSE
        SET @Numero = 'POL-' + FORMAT(GETUTCDATE(), 'yyyyMM') + '-' +
                      RIGHT('0000' + CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR), 4);
    INSERT INTO Polizas (Numero, ClienteId, VehiculoId, CompaniaId, FechaInicio, FechaFin,
                         PrecioTotal, CantidadCuotas, Estado, PolizaOrigenId, FechaEmision, RamoId, FormaPago, PrimaOG, VendedorId)
    VALUES (@Numero, @ClienteId, @VehiculoId, @CompaniaId, @FechaInicio, @FechaFin,
            @PrecioTotal, @CantidadCuotas, @Estado, @PolizaOrigenId, @FechaEmision, @RamoId, @FormaPago, @PrimaOG, @VendedorId);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

-- Cobro: registra qué usuario cargó el pago.
CREATE OR ALTER PROCEDURE sp_Cobro_MarcarPagado
    @Id INT, @FechaPago DATETIME, @MetodoPagoId INT = NULL, @RegistradoPor INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Cobros
    SET Estado = 1, FechaPago = @FechaPago, MetodoPagoId = @MetodoPagoId,
        RegistradoPor = ISNULL(@RegistradoPor, RegistradoPor)
    WHERE Id = @Id;
END
GO

-- Pagos recibidos: vendedor = quien registró el cobro; si no, quien cargó la póliza.
-- Filtros: @VendedorId (un usuario puntual) o @VendedorRol (todos los de un rol, ej. 'Admin').
CREATE OR ALTER PROCEDURE sp_Reporte_PagosRecibidos
    @Desde DATE, @Hasta DATE, @CompaniaId INT = NULL, @OficinaId INT = NULL,
    @VendedorId INT = NULL, @VendedorRol VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT co.Id, co.FechaPago, co.Monto, co.NumeroCuota,
           p.Id AS PolizaId, p.Numero AS NroPoliza, p.PrimaOG, p.CantidadCuotas,
           c.Nombre AS ClienteNombre,
           cp.Nombre AS Compania, p.CompaniaId,
           ISNULL(r.Nombre,'-') AS Ramo,
           ISNULL(mp.Nombre,'Sin especificar') AS Metodo,
           ISNULL(vh.Patente,'-') AS Patente,
           c.OficinaId, ISNULL(o.Nombre,'Sin oficina') AS OficinaNombre,
           COALESCE(co.RegistradoPor, p.VendedorId) AS VendedorId,
           ISNULL(v.Nombre,'-') AS VendedorNombre
    FROM Cobros co
    INNER JOIN Polizas   p  ON p.Id  = co.PolizaId
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    LEFT  JOIN Ramos       r  ON r.Id  = p.RamoId
    LEFT  JOIN MetodosPago mp ON mp.Id = co.MetodoPagoId
    LEFT  JOIN Vehiculos   vh ON vh.Id = p.VehiculoId
    LEFT  JOIN Oficinas    o  ON o.Id  = c.OficinaId
    LEFT  JOIN Usuarios    v  ON v.Id  = COALESCE(co.RegistradoPor, p.VendedorId)
    WHERE co.Estado = 1
      AND co.FechaPago >= @Desde AND co.FechaPago < DATEADD(DAY, 1, @Hasta)
      AND (@CompaniaId  IS NULL OR p.CompaniaId = @CompaniaId)
      AND (@OficinaId   IS NULL OR c.OficinaId  = @OficinaId)
      AND (@VendedorId  IS NULL OR COALESCE(co.RegistradoPor, p.VendedorId) = @VendedorId)
      AND (@VendedorRol IS NULL OR v.Rol = @VendedorRol)
    ORDER BY co.FechaPago DESC;
END
GO

/* =============================================================================
   38. EXPORT DE CARTERA (Admin) — datos completos por póliza para exportar
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Reporte_Cartera @VendedorId INT = NULL AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT MIN(co.FechaVencimiento) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado <> 1) AS ProximoVencimiento,
        cp.Nombre AS Compania,
        (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado = 1) AS CuotasPagadas,
        p.CantidadCuotas AS CuotasTotal,
        (SELECT ISNULL(SUM(co.Monto), 0) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado = 1) AS PrecioCobrado,
        p.PrecioTotal,
        ISNULL(p.PrimaOG, 0) AS PrimaOG,
        p.Numero AS NroPoliza,
        c.Nombre AS ClienteNombre, c.Documento, ISNULL(c.TipoDocumento, '') AS TipoDocumento,
        ISNULL(c.Email, '') AS Email, ISNULL(c.Telefono, '') AS Telefono, ISNULL(c.Direccion, '') AS Direccion,
        ISNULL(v.Patente, '') AS Patente, ISNULL(v.Marca, '') AS Marca, ISNULL(v.Modelo, '') AS Modelo,
        ISNULL(CAST(v.Anio AS VARCHAR(10)), '') AS Anio, ISNULL(v.Chasis, '') AS Chasis, ISNULL(v.Motor, '') AS Motor,
        ISNULL(v.Combustion, '') AS Combustion, ISNULL(v.TipoCobertura, '') AS TipoCobertura,
        p.VendedorId
    FROM Polizas p
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    LEFT  JOIN Vehiculos v  ON v.Id  = p.VehiculoId
    WHERE p.Estado = 0                                   -- cartera = pólizas activas
      AND (@VendedorId IS NULL OR p.VendedorId = @VendedorId)
    ORDER BY c.Nombre, p.Numero;
END
GO

/* =============================================================================
   39. COBERTURA COMO DATO DE LA PÓLIZA (además del vehículo)
   ============================================================================= */
IF COL_LENGTH('Polizas','Cobertura') IS NULL
    ALTER TABLE Polizas ADD Cobertura NVARCHAR(100) NULL;
GO

CREATE OR ALTER PROCEDURE sp_Poliza_Insertar
    @ClienteId INT, @VehiculoId INT = NULL, @CompaniaId INT, @FechaInicio DATE, @FechaFin DATE,
    @PrecioTotal DECIMAL(18,2), @CantidadCuotas INT, @Estado INT, @PolizaOrigenId INT = NULL,
    @FechaEmision DATETIME, @RamoId INT = NULL, @FormaPago VARCHAR(40) = NULL,
    @PrimaOG DECIMAL(18,2) = NULL, @EnTramite BIT = 0, @VendedorId INT = NULL, @Cobertura NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Numero VARCHAR(20);
    IF @EnTramite = 1
        SET @Numero = 'E/T-' + RIGHT('000000' + CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR), 6);
    ELSE
        SET @Numero = 'POL-' + FORMAT(GETUTCDATE(), 'yyyyMM') + '-' +
                      RIGHT('0000' + CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR), 4);
    INSERT INTO Polizas (Numero, ClienteId, VehiculoId, CompaniaId, FechaInicio, FechaFin,
                         PrecioTotal, CantidadCuotas, Estado, PolizaOrigenId, FechaEmision, RamoId, FormaPago, PrimaOG, VendedorId, Cobertura)
    VALUES (@Numero, @ClienteId, @VehiculoId, @CompaniaId, @FechaInicio, @FechaFin,
            @PrecioTotal, @CantidadCuotas, @Estado, @PolizaOrigenId, @FechaEmision, @RamoId, @FormaPago, @PrimaOG, @VendedorId, @Cobertura);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_GetById @Id INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, p.FormaPago, p.PrimaOG, p.Cobertura
    FROM Polizas p LEFT JOIN Ramos r ON r.Id = p.RamoId
    WHERE p.Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_Listar
    @ClienteId INT = NULL, @Estado INT = NULL, @Offset INT, @PageSize INT,
    @UsuarioId INT = NULL, @EsAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Ofi INT = (SELECT OficinaId FROM Usuarios WHERE Id = @UsuarioId);
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, c.Nombre AS ClienteNombre, v.Patente, p.FormaPago, p.PrimaOG, p.Cobertura,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id)                  AS CuotasTotal,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado=1)  AS CuotasPagadas,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado=2)  AS CuotasVencidas,
           COUNT(*) OVER() AS Total
    FROM Polizas p
    INNER JOIN Clientes  c ON c.Id = p.ClienteId
    LEFT  JOIN Vehiculos v ON v.Id = p.VehiculoId
    LEFT  JOIN Ramos     r ON r.Id = p.RamoId
    WHERE (@ClienteId IS NULL OR p.ClienteId = @ClienteId)
      AND (@Estado    IS NULL OR p.Estado    = @Estado)
      AND (@EsAdmin = 1 OR @Ofi IS NULL OR c.OficinaId IS NULL OR c.OficinaId = @Ofi
           OR EXISTS (SELECT 1 FROM ClientesCompartidos cc WHERE cc.ClienteId = c.Id AND cc.OficinaId = @Ofi))
    ORDER BY p.FechaEmision DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_Actualizar
    @Id INT, @CompaniaId INT, @RamoId INT = NULL, @FechaInicio DATE, @FechaFin DATE,
    @PrecioTotal DECIMAL(18,2), @CantidadCuotas INT, @FormaPago VARCHAR(40) = NULL,
    @PrimaOG DECIMAL(18,2) = NULL, @Cobertura NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Polizas SET CompaniaId=@CompaniaId, RamoId=@RamoId, FechaInicio=@FechaInicio,
                       FechaFin=@FechaFin, PrecioTotal=@PrecioTotal, CantidadCuotas=@CantidadCuotas,
                       FormaPago=COALESCE(@FormaPago, FormaPago),
                       PrimaOG=COALESCE(@PrimaOG, PrimaOG),
                       Cobertura=COALESCE(@Cobertura, Cobertura)
    WHERE Id=@Id;
END
GO

/* =============================================================================
   §40 — Token público de verificación (QR). Reemplaza el id secuencial por un
   GUID no adivinable, para que la web pública /verificar no se pueda enumerar.
   ============================================================================= */
IF COL_LENGTH('dbo.Polizas', 'TokenPublico') IS NULL
BEGIN
    ALTER TABLE Polizas ADD TokenPublico UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT DF_Polizas_TokenPublico DEFAULT NEWID();
    -- NEWID() se evalúa por fila: cada póliza existente recibe un token único.
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Polizas_TokenPublico')
    CREATE UNIQUE INDEX UX_Polizas_TokenPublico ON Polizas(TokenPublico);
GO

-- GetById ahora también devuelve el token (lo necesita el comprobante para el QR)
CREATE OR ALTER PROCEDURE sp_Poliza_GetById @Id INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, p.FormaPago, p.PrimaOG, p.Cobertura, p.TokenPublico
    FROM Polizas p LEFT JOIN Ramos r ON r.Id = p.RamoId
    WHERE p.Id = @Id;
END
GO

-- Búsqueda por token para la verificación pública (no expone el id secuencial)
CREATE OR ALTER PROCEDURE sp_Poliza_GetByToken @Token UNIQUEIDENTIFIER AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, p.FormaPago, p.PrimaOG, p.Cobertura, p.TokenPublico
    FROM Polizas p LEFT JOIN Ramos r ON r.Id = p.RamoId
    WHERE p.TokenPublico = @Token;
END
GO

/* =============================================================================
   §41 — Eliminación de pólizas (con autorización del Admin y registro/auditoría).
   El productor solicita; el Admin autoriza (ejecuta el borrado) o rechaza.
   Se guardan "snapshots" para poder ver qué se borró aunque la póliza ya no exista.
   ============================================================================= */
IF OBJECT_ID('dbo.EliminacionesPoliza', 'U') IS NULL
BEGIN
    CREATE TABLE EliminacionesPoliza (
        Id              INT PRIMARY KEY IDENTITY,
        PolizaId        INT NOT NULL,               -- sin FK: la póliza se borra al aprobar
        PolizaNumero    VARCHAR(30)   NULL,         -- snapshots (para el registro)
        ClienteNombre   NVARCHAR(200) NULL,
        Patente         VARCHAR(20)   NULL,
        CantidadCuotas  INT NOT NULL DEFAULT 0,
        CuotasPagadas   INT NOT NULL DEFAULT 0,
        Estado          INT NOT NULL DEFAULT 0,     -- 0=Pendiente 1=Ejecutada 2=Rechazada
        Motivo          NVARCHAR(300) NULL,
        SolicitadoPor   INT NOT NULL,
        FechaSolicitud  DATETIME NOT NULL DEFAULT GETUTCDATE(),
        ResueltoPor     INT NULL,
        FechaResolucion DATETIME NULL
    );
    CREATE INDEX IX_EliminacionesPoliza_Estado ON EliminacionesPoliza(Estado);
END
GO

-- Solicitud (Productor) o paso previo del Admin. Devuelve el Id y si ya existía una pendiente.
CREATE OR ALTER PROCEDURE sp_EliminacionPoliza_Solicitar
    @PolizaId INT, @UsuarioId INT, @Motivo NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM Polizas WHERE Id = @PolizaId)
    BEGIN SELECT CAST(0 AS INT) AS Id, CAST(0 AS BIT) AS YaExistia; RETURN; END

    DECLARE @Existente INT = (SELECT TOP 1 Id FROM EliminacionesPoliza WHERE PolizaId = @PolizaId AND Estado = 0);
    IF @Existente IS NOT NULL
    BEGIN SELECT @Existente AS Id, CAST(1 AS BIT) AS YaExistia; RETURN; END

    INSERT INTO EliminacionesPoliza (PolizaId, PolizaNumero, ClienteNombre, Patente, CantidadCuotas, CuotasPagadas, Motivo, SolicitadoPor)
    SELECT p.Id, p.Numero, c.Nombre, v.Patente, p.CantidadCuotas,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado = 1),
           @Motivo, @UsuarioId
    FROM Polizas p
    INNER JOIN Clientes  c ON c.Id = p.ClienteId
    LEFT  JOIN Vehiculos v ON v.Id = p.VehiculoId
    WHERE p.Id = @PolizaId;

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS Id, CAST(0 AS BIT) AS YaExistia;
END
GO

-- Aprobar = ejecutar el borrado (borra póliza + cuotas + su vehículo si queda huérfano; conserva el cliente).
CREATE OR ALTER PROCEDURE sp_EliminacionPoliza_Aprobar @Id INT, @AdminId INT AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @PolizaId INT = (SELECT PolizaId FROM EliminacionesPoliza WHERE Id = @Id AND Estado = 0);
        IF @PolizaId IS NULL BEGIN ROLLBACK TRANSACTION; SELECT CAST(0 AS INT) AS Afectadas; RETURN; END

        DECLARE @VehiculoId INT = (SELECT VehiculoId FROM Polizas WHERE Id = @PolizaId);

        DELETE FROM AnulacionesCobro WHERE CobroId IN (SELECT Id FROM Cobros WHERE PolizaId = @PolizaId);
        DELETE FROM Cobros           WHERE PolizaId = @PolizaId;
        DELETE FROM Bajas            WHERE PolizaId = @PolizaId;
        -- NotificacionesVencimiento es un log genérico (Tipo/ReferenciaId) sin FK: no bloquea.
        -- Desvincular renovaciones que apuntaban a esta póliza (self-FK)
        UPDATE Polizas SET PolizaOrigenId = NULL WHERE PolizaOrigenId = @PolizaId;
        DELETE FROM Polizas                   WHERE Id = @PolizaId;
        -- Borrar el vehículo sólo si ninguna otra póliza lo usa; el cliente NUNCA se borra.
        IF @VehiculoId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Polizas WHERE VehiculoId = @VehiculoId)
            DELETE FROM Vehiculos WHERE Id = @VehiculoId;

        UPDATE EliminacionesPoliza SET Estado = 1, ResueltoPor = @AdminId, FechaResolucion = GETUTCDATE() WHERE Id = @Id;
        COMMIT TRANSACTION;
        SELECT CAST(1 AS INT) AS Afectadas;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE sp_EliminacionPoliza_Rechazar @Id INT, @AdminId INT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE EliminacionesPoliza SET Estado = 2, ResueltoPor = @AdminId, FechaResolucion = GETUTCDATE()
    WHERE Id = @Id AND Estado = 0;
    SELECT @@ROWCOUNT AS Afectadas;
END
GO

CREATE OR ALTER PROCEDURE sp_EliminacionPoliza_GetPendientes AS
BEGIN
    SET NOCOUNT ON;
    SELECT e.Id, e.PolizaId, e.PolizaNumero, e.ClienteNombre, e.Patente,
           e.CantidadCuotas, e.CuotasPagadas, e.Motivo, e.FechaSolicitud,
           u.Nombre AS Solicitante
    FROM EliminacionesPoliza e
    LEFT JOIN Usuarios u ON u.Id = e.SolicitadoPor
    WHERE e.Estado = 0
    ORDER BY e.FechaSolicitud DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_EliminacionPoliza_GetHistorial AS
BEGIN
    SET NOCOUNT ON;
    SELECT e.Id, e.PolizaId, e.PolizaNumero, e.ClienteNombre, e.Patente,
           e.CantidadCuotas, e.CuotasPagadas, e.Estado, e.Motivo,
           e.FechaSolicitud, e.FechaResolucion,
           us.Nombre AS Solicitante, ur.Nombre AS Resolvio
    FROM EliminacionesPoliza e
    LEFT JOIN Usuarios us ON us.Id = e.SolicitadoPor
    LEFT JOIN Usuarios ur ON ur.Id = e.ResueltoPor
    ORDER BY e.FechaSolicitud DESC;
END
GO

-- Historial de anulaciones de cuota (para el mismo registro de movimientos)
CREATE OR ALTER PROCEDURE sp_Anulacion_GetHistorial AS
BEGIN
    SET NOCOUNT ON;
    SELECT a.Id, a.CobroId, a.Estado, a.Motivo, a.FechaSolicitud, a.FechaResolucion,
           co.NumeroCuota, co.Monto, p.Numero AS NroPoliza, c.Nombre AS ClienteNombre,
           us.Nombre AS Solicitante, ur.Nombre AS Resolvio
    FROM AnulacionesCobro a
    INNER JOIN Cobros   co ON co.Id = a.CobroId
    INNER JOIN Polizas  p  ON p.Id  = co.PolizaId
    INNER JOIN Clientes c  ON c.Id  = p.ClienteId
    LEFT  JOIN Usuarios us ON us.Id = a.SolicitadoPor
    LEFT  JOIN Usuarios ur ON ur.Id = a.ResueltoPor
    ORDER BY a.FechaSolicitud DESC;
END
GO

/* =============================================================================
   §42 — Configuración por usuario (SMTP/WhatsApp). Cada usuario tiene la suya;
   si le falta, se usa la del Admin (fallback). Migra la config global al Admin.
   ============================================================================= */
IF COL_LENGTH('dbo.Configuraciones', 'UsuarioId') IS NULL
BEGIN
    ALTER TABLE Configuraciones ADD UsuarioId INT NOT NULL CONSTRAINT DF_Configuraciones_UsuarioId DEFAULT 0;

    -- La PK pasa de (Clave) a (UsuarioId, Clave). Las sentencias que referencian la
    -- columna nueva van por EXEC (resolución diferida: no existe al compilar el batch).
    DECLARE @pk SYSNAME = (SELECT name FROM sys.key_constraints
                           WHERE parent_object_id = OBJECT_ID('dbo.Configuraciones') AND type = 'PK');
    IF @pk IS NOT NULL EXEC('ALTER TABLE dbo.Configuraciones DROP CONSTRAINT ' + @pk);
    EXEC('ALTER TABLE dbo.Configuraciones ADD CONSTRAINT PK_Configuraciones PRIMARY KEY (UsuarioId, Clave)');

    -- La config global existente (UsuarioId=0) pasa a ser la del Admin (fallback de todos)
    DECLARE @admin INT = (SELECT MIN(Id) FROM Usuarios WHERE Rol = 'Admin');
    IF @admin IS NOT NULL
        EXEC sp_executesql N'UPDATE dbo.Configuraciones SET UsuarioId = @a WHERE UsuarioId = 0', N'@a INT', @a = @admin;
END
GO

CREATE OR ALTER PROCEDURE sp_Config_GetByUsuario @UsuarioId INT AS
BEGIN SET NOCOUNT ON; SELECT Clave, Valor FROM Configuraciones WHERE UsuarioId = @UsuarioId; END
GO

CREATE OR ALTER PROCEDURE sp_Config_Set @UsuarioId INT, @Clave NVARCHAR(100), @Valor NVARCHAR(500) = NULL AS
BEGIN
    SET NOCOUNT ON;
    MERGE Configuraciones AS t
    USING (SELECT @UsuarioId AS UsuarioId, @Clave AS Clave) AS s
        ON t.UsuarioId = s.UsuarioId AND t.Clave = s.Clave
    WHEN MATCHED THEN UPDATE SET Valor = @Valor, FechaActualizacion = GETUTCDATE()
    WHEN NOT MATCHED THEN INSERT (UsuarioId, Clave, Valor) VALUES (@UsuarioId, @Clave, @Valor);
END
GO

CREATE OR ALTER PROCEDURE sp_Config_GetAdminId AS
BEGIN SET NOCOUNT ON; SELECT MIN(Id) AS AdminId FROM Usuarios WHERE Rol = 'Admin'; END
GO

/* =============================================================================
   §43 — Papelera de pólizas (soft-delete). "Eliminar" ahora marca la póliza como
   Eliminada (se oculta de la operación) en vez de borrarla; se puede Restaurar o
   Borrar definitivamente (vaciar papelera). Los reportes históricos no se filtran.
   ============================================================================= */
IF COL_LENGTH('dbo.Polizas', 'Eliminada') IS NULL
    ALTER TABLE Polizas ADD Eliminada BIT NOT NULL CONSTRAINT DF_Polizas_Eliminada DEFAULT 0;
GO
IF COL_LENGTH('dbo.Polizas', 'FechaEliminacion') IS NULL
    ALTER TABLE Polizas ADD FechaEliminacion DATETIME NULL;
GO

-- Aprobar = mandar a la PAPELERA (soft-delete). No borra cuotas ni vehículo.
CREATE OR ALTER PROCEDURE sp_EliminacionPoliza_Aprobar @Id INT, @AdminId INT AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @PolizaId INT = (SELECT PolizaId FROM EliminacionesPoliza WHERE Id = @Id AND Estado = 0);
    IF @PolizaId IS NULL BEGIN SELECT CAST(0 AS INT) AS Afectadas; RETURN; END
    UPDATE Polizas SET Eliminada = 1, FechaEliminacion = GETUTCDATE() WHERE Id = @PolizaId;
    UPDATE EliminacionesPoliza SET Estado = 1, ResueltoPor = @AdminId, FechaResolucion = GETUTCDATE() WHERE Id = @Id;
    SELECT CAST(1 AS INT) AS Afectadas;
END
GO

-- Restaurar desde la papelera (la póliza vuelve a estar activa/visible).
CREATE OR ALTER PROCEDURE sp_EliminacionPoliza_Restaurar @PolizaId INT, @AdminId INT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Polizas SET Eliminada = 0, FechaEliminacion = NULL WHERE Id = @PolizaId AND Eliminada = 1;
    DECLARE @n INT = @@ROWCOUNT;
    IF @n > 0
        UPDATE EliminacionesPoliza SET Estado = 3, ResueltoPor = @AdminId, FechaResolucion = GETUTCDATE()
        WHERE PolizaId = @PolizaId AND Estado = 1;
    SELECT @n AS Afectadas;   -- 3 = Restaurada
END
GO

-- Borrar DEFINITIVO (vaciar papelera): elimina físicamente póliza + cuotas + vehículo huérfano.
CREATE OR ALTER PROCEDURE sp_EliminacionPoliza_BorrarDefinitivo @PolizaId INT, @AdminId INT AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM Polizas WHERE Id = @PolizaId AND Eliminada = 1)
        BEGIN ROLLBACK TRANSACTION; SELECT CAST(0 AS INT) AS Afectadas; RETURN; END

        DECLARE @VehiculoId INT = (SELECT VehiculoId FROM Polizas WHERE Id = @PolizaId);
        DELETE FROM AnulacionesCobro WHERE CobroId IN (SELECT Id FROM Cobros WHERE PolizaId = @PolizaId);
        DELETE FROM Cobros WHERE PolizaId = @PolizaId;
        DELETE FROM Bajas  WHERE PolizaId = @PolizaId;
        UPDATE Polizas SET PolizaOrigenId = NULL WHERE PolizaOrigenId = @PolizaId;
        DELETE FROM Polizas WHERE Id = @PolizaId;
        IF @VehiculoId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Polizas WHERE VehiculoId = @VehiculoId)
            DELETE FROM Vehiculos WHERE Id = @VehiculoId;
        UPDATE EliminacionesPoliza SET Estado = 4 WHERE PolizaId = @PolizaId AND Estado = 1;  -- 4 = Borrada definitiva
        COMMIT TRANSACTION;
        SELECT CAST(1 AS INT) AS Afectadas;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW;
    END CATCH
END
GO

-- Listado de la papelera (pólizas eliminadas, con quién/cuándo/motivo).
CREATE OR ALTER PROCEDURE sp_EliminacionPoliza_GetPapelera AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id AS PolizaId, p.Numero AS PolizaNumero, c.Nombre AS ClienteNombre, v.Patente,
           p.CantidadCuotas,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado = 1) AS CuotasPagadas,
           p.FechaEliminacion, e.Motivo, e.FechaSolicitud,
           us.Nombre AS Solicitante, ur.Nombre AS Resolvio
    FROM Polizas p
    INNER JOIN Clientes c ON c.Id = p.ClienteId
    LEFT  JOIN Vehiculos v ON v.Id = p.VehiculoId
    OUTER APPLY (SELECT TOP 1 * FROM EliminacionesPoliza ep WHERE ep.PolizaId = p.Id AND ep.Estado = 1 ORDER BY ep.FechaResolucion DESC) e
    LEFT  JOIN Usuarios us ON us.Id = e.SolicitadoPor
    LEFT  JOIN Usuarios ur ON ur.Id = e.ResueltoPor
    WHERE p.Eliminada = 1
    ORDER BY p.FechaEliminacion DESC;
END
GO

/* --- Consultas operativas: ocultan las pólizas en papelera (Eliminada = 0) --- */
CREATE OR ALTER PROCEDURE sp_Poliza_Listar
    @ClienteId INT = NULL, @Estado INT = NULL, @Offset INT, @PageSize INT,
    @UsuarioId INT = NULL, @EsAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Ofi INT = (SELECT OficinaId FROM Usuarios WHERE Id = @UsuarioId);
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, c.Nombre AS ClienteNombre, v.Patente, p.FormaPago, p.PrimaOG, p.Cobertura,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id)                  AS CuotasTotal,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado=1)  AS CuotasPagadas,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado=2)  AS CuotasVencidas,
           COUNT(*) OVER() AS Total
    FROM Polizas p
    INNER JOIN Clientes  c ON c.Id = p.ClienteId
    LEFT  JOIN Vehiculos v ON v.Id = p.VehiculoId
    LEFT  JOIN Ramos     r ON r.Id = p.RamoId
    WHERE p.Eliminada = 0
      AND (@ClienteId IS NULL OR p.ClienteId = @ClienteId)
      AND (@Estado    IS NULL OR p.Estado    = @Estado)
      AND (@EsAdmin = 1 OR @Ofi IS NULL OR c.OficinaId IS NULL OR c.OficinaId = @Ofi
           OR EXISTS (SELECT 1 FROM ClientesCompartidos cc WHERE cc.ClienteId = c.Id AND cc.OficinaId = @Ofi))
    ORDER BY p.FechaEmision DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_GetActivaPorVehiculo @VehiculoId INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Numero, ClienteId, VehiculoId, CompaniaId, FechaInicio, FechaFin,
           PrecioTotal, CantidadCuotas, Estado, PolizaOrigenId, FechaEmision, RamoId
    FROM Polizas WHERE VehiculoId = @VehiculoId AND Estado = 0 AND Eliminada = 0;
END
GO

CREATE OR ALTER PROCEDURE sp_Cobro_GetPendientesMes @Mes INT, @Anio INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT co.Id, co.PolizaId, co.NumeroCuota, co.FechaVencimiento, co.Monto,
           co.Estado, co.FechaPago, co.MetodoPagoId,
           p.Numero AS NroPoliza, c.Nombre AS ClienteNombre
    FROM Cobros co
    INNER JOIN Polizas  p ON p.Id = co.PolizaId
    INNER JOIN Clientes c ON c.Id = p.ClienteId
    WHERE co.Estado = 0 AND p.Eliminada = 0
      AND MONTH(co.FechaVencimiento) = @Mes
      AND YEAR(co.FechaVencimiento)  = @Anio
    ORDER BY co.FechaVencimiento;
END
GO

CREATE OR ALTER PROCEDURE sp_Busqueda_Global @Termino NVARCHAR(100) AS
BEGIN
    SET NOCOUNT ON;
    SELECT 'Cliente' AS Tipo, c.Id, c.Nombre AS Titulo, c.Documento AS Subtitulo, c.Id AS Referencia
    FROM Clientes c
    WHERE c.Nombre LIKE '%' + @Termino + '%' OR c.Documento LIKE '%' + @Termino + '%'
    UNION ALL
    SELECT 'Vehiculo' AS Tipo, v.Id, (v.Marca + ' ' + v.Modelo) AS Titulo, v.Patente AS Subtitulo, v.ClienteId AS Referencia
    FROM Vehiculos v
    WHERE v.Patente LIKE '%' + @Termino + '%'
    UNION ALL
    SELECT 'Poliza' AS Tipo, p.Id, p.Numero AS Titulo, c.Nombre AS Subtitulo, p.Id AS Referencia
    FROM Polizas p
    INNER JOIN Clientes c ON c.Id = p.ClienteId
    WHERE p.Numero LIKE '%' + @Termino + '%' AND p.Eliminada = 0;
END
GO

CREATE OR ALTER PROCEDURE sp_Notif_PolizasPorVencer @Dias INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id AS PolizaId, p.Numero, p.FechaFin,
           c.Nombre AS ClienteNombre, c.Email, c.Telefono,
           v.Patente, cp.Nombre AS Compania
    FROM Polizas p
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Vehiculos v  ON v.Id  = p.VehiculoId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    WHERE p.Estado = 0 AND p.Eliminada = 0
      AND p.FechaFin = DATEADD(DAY, @Dias, CAST(GETUTCDATE() AS DATE));
END
GO

CREATE OR ALTER PROCEDURE sp_Notif_CuotasPorVencer @Dias INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT co.Id AS CobroId, co.NumeroCuota, co.Monto, co.FechaVencimiento,
           p.Numero AS NroPoliza, c.Nombre AS ClienteNombre, c.Email, c.Telefono
    FROM Cobros co
    INNER JOIN Polizas  p ON p.Id = co.PolizaId
    INNER JOIN Clientes c ON c.Id = p.ClienteId
    WHERE co.Estado = 0 AND p.Eliminada = 0
      AND co.FechaVencimiento = DATEADD(DAY, @Dias, CAST(GETUTCDATE() AS DATE));
END
GO

CREATE OR ALTER PROCEDURE sp_Stats_Publicas AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM Polizas  WHERE Estado = 0 AND Eliminada = 0) AS PolizasActivas,
        (SELECT COUNT(*) FROM Clientes WHERE Activo = 1) AS Clientes,
        (SELECT COUNT(*) FROM Companias WHERE Activo = 1) AS Companias;
END
GO

/* =============================================================================
   §44 — Atribución: quién cargó la póliza, quién cobró la cuota, y de quién es
   el cliente (su vendedor). Se agregan a las consultas existentes.
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Poliza_GetById @Id INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, p.FormaPago, p.PrimaOG, p.Cobertura, p.TokenPublico,
           uv.Nombre AS VendedorNombre, uc.Nombre AS ClienteVendedorNombre
    FROM Polizas p
    LEFT JOIN Ramos    r  ON r.Id  = p.RamoId
    LEFT JOIN Usuarios uv ON uv.Id = p.VendedorId
    LEFT JOIN Clientes c  ON c.Id  = p.ClienteId
    LEFT JOIN Usuarios uc ON uc.Id = c.VendedorId
    WHERE p.Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_Listar
    @ClienteId INT = NULL, @Estado INT = NULL, @Offset INT, @PageSize INT,
    @UsuarioId INT = NULL, @EsAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Ofi INT = (SELECT OficinaId FROM Usuarios WHERE Id = @UsuarioId);
    SELECT p.Id, p.Numero, p.ClienteId, p.VehiculoId, p.CompaniaId, p.FechaInicio, p.FechaFin,
           p.PrecioTotal, p.CantidadCuotas, p.Estado, p.PolizaOrigenId, p.FechaEmision,
           p.RamoId, r.Nombre AS RamoNombre, c.Nombre AS ClienteNombre, v.Patente, p.FormaPago, p.PrimaOG, p.Cobertura,
           uv.Nombre AS VendedorNombre, uc.Nombre AS ClienteVendedorNombre,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id)                  AS CuotasTotal,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado=1)  AS CuotasPagadas,
           (SELECT COUNT(*) FROM Cobros co WHERE co.PolizaId = p.Id AND co.Estado=2)  AS CuotasVencidas,
           COUNT(*) OVER() AS Total
    FROM Polizas p
    INNER JOIN Clientes  c ON c.Id = p.ClienteId
    LEFT  JOIN Vehiculos v ON v.Id = p.VehiculoId
    LEFT  JOIN Ramos     r ON r.Id = p.RamoId
    LEFT  JOIN Usuarios uv ON uv.Id = p.VendedorId
    LEFT  JOIN Usuarios uc ON uc.Id = c.VendedorId
    WHERE p.Eliminada = 0
      AND (@ClienteId IS NULL OR p.ClienteId = @ClienteId)
      AND (@Estado    IS NULL OR p.Estado    = @Estado)
      AND (@EsAdmin = 1 OR @Ofi IS NULL OR c.OficinaId IS NULL OR c.OficinaId = @Ofi
           OR EXISTS (SELECT 1 FROM ClientesCompartidos cc WHERE cc.ClienteId = c.Id AND cc.OficinaId = @Ofi))
    ORDER BY p.FechaEmision DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

CREATE OR ALTER PROCEDURE sp_Cobro_GetPorPoliza @PolizaId INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT co.Id, co.PolizaId, co.NumeroCuota, co.FechaVencimiento, co.Monto, co.Estado,
           co.FechaPago, co.MetodoPagoId, u.Nombre AS CobradorNombre
    FROM Cobros co
    LEFT JOIN Usuarios u ON u.Id = co.RegistradoPor
    WHERE co.PolizaId = @PolizaId
    ORDER BY co.NumeroCuota;
END
GO

/* =============================================================================
   §45 — Segundo método de pago (opcional) al cobrar una cuota.
   El método principal pasa a ser obligatorio a nivel de negocio; en pocos casos
   se usa además un segundo método (ej. parte efectivo + parte transferencia).
   ============================================================================= */
IF COL_LENGTH('dbo.Cobros', 'MetodoPago2Id') IS NULL
    ALTER TABLE Cobros ADD MetodoPago2Id INT NULL REFERENCES MetodosPago(Id);
GO

CREATE OR ALTER PROCEDURE sp_Cobro_MarcarPagado
    @Id INT, @FechaPago DATETIME, @MetodoPagoId INT = NULL, @RegistradoPor INT = NULL, @MetodoPago2Id INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Cobros
    SET Estado = 1, FechaPago = @FechaPago, MetodoPagoId = @MetodoPagoId,
        MetodoPago2Id = @MetodoPago2Id,
        RegistradoPor = ISNULL(@RegistradoPor, RegistradoPor)
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Cobro_GetPorPoliza @PolizaId INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT co.Id, co.PolizaId, co.NumeroCuota, co.FechaVencimiento, co.Monto, co.Estado,
           co.FechaPago, co.MetodoPagoId, co.MetodoPago2Id, u.Nombre AS CobradorNombre
    FROM Cobros co
    LEFT JOIN Usuarios u ON u.Id = co.RegistradoPor
    WHERE co.PolizaId = @PolizaId
    ORDER BY co.NumeroCuota;
END
GO

CREATE OR ALTER PROCEDURE sp_Cobro_GetById @Id INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, PolizaId, NumeroCuota, FechaVencimiento, Monto, Estado, FechaPago, MetodoPagoId, MetodoPago2Id
    FROM Cobros
    WHERE Id = @Id;
END
GO

-- Las anulaciones también limpian el segundo método
CREATE OR ALTER PROCEDURE sp_Cobro_AnularPago @CobroId INT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Cobros SET Estado = 0, FechaPago = NULL, MetodoPagoId = NULL, MetodoPago2Id = NULL
    WHERE Id = @CobroId AND Estado = 1;
    SELECT @@ROWCOUNT AS Afectadas;
END
GO

CREATE OR ALTER PROCEDURE sp_Anulacion_Aprobar @Id INT, @AdminId INT AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @CobroId INT = (SELECT CobroId FROM AnulacionesCobro WHERE Id = @Id AND Estado = 0);
        IF @CobroId IS NULL BEGIN ROLLBACK TRANSACTION; SELECT CAST(0 AS INT) AS Afectadas; RETURN; END
        UPDATE Cobros SET Estado = 0, FechaPago = NULL, MetodoPagoId = NULL, MetodoPago2Id = NULL WHERE Id = @CobroId;
        UPDATE AnulacionesCobro SET Estado = 1, ResueltoPor = @AdminId, FechaResolucion = GETUTCDATE() WHERE Id = @Id;
        COMMIT TRANSACTION;
        SELECT CAST(1 AS INT) AS Afectadas;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW;
    END CATCH
END
GO

/* =============================================================================
   §46 — Monto del segundo método en pagos mixtos + desglose por medio en reportes.
   El monto del método principal = Cobros.Monto - MetodoPago2Monto.
   En sp_Reporte_PagosRecibidos cada pago mixto se divide en DOS filas (una por
   método, con su monto), para que la rendición sume exacto por medio de pago.
   ============================================================================= */
IF COL_LENGTH('dbo.Cobros', 'MetodoPago2Monto') IS NULL
    ALTER TABLE Cobros ADD MetodoPago2Monto DECIMAL(18,2) NULL;
GO

CREATE OR ALTER PROCEDURE sp_Cobro_MarcarPagado
    @Id INT, @FechaPago DATETIME, @MetodoPagoId INT = NULL, @RegistradoPor INT = NULL,
    @MetodoPago2Id INT = NULL, @MetodoPago2Monto DECIMAL(18,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Cobros
    SET Estado = 1, FechaPago = @FechaPago, MetodoPagoId = @MetodoPagoId,
        MetodoPago2Id = @MetodoPago2Id, MetodoPago2Monto = @MetodoPago2Monto,
        RegistradoPor = ISNULL(@RegistradoPor, RegistradoPor)
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Cobro_GetPorPoliza @PolizaId INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT co.Id, co.PolizaId, co.NumeroCuota, co.FechaVencimiento, co.Monto, co.Estado,
           co.FechaPago, co.MetodoPagoId, co.MetodoPago2Id, co.MetodoPago2Monto, u.Nombre AS CobradorNombre
    FROM Cobros co
    LEFT JOIN Usuarios u ON u.Id = co.RegistradoPor
    WHERE co.PolizaId = @PolizaId
    ORDER BY co.NumeroCuota;
END
GO

CREATE OR ALTER PROCEDURE sp_Cobro_GetById @Id INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, PolizaId, NumeroCuota, FechaVencimiento, Monto, Estado, FechaPago,
           MetodoPagoId, MetodoPago2Id, MetodoPago2Monto
    FROM Cobros
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Cobro_AnularPago @CobroId INT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Cobros SET Estado = 0, FechaPago = NULL, MetodoPagoId = NULL, MetodoPago2Id = NULL, MetodoPago2Monto = NULL
    WHERE Id = @CobroId AND Estado = 1;
    SELECT @@ROWCOUNT AS Afectadas;
END
GO

CREATE OR ALTER PROCEDURE sp_Anulacion_Aprobar @Id INT, @AdminId INT AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @CobroId INT = (SELECT CobroId FROM AnulacionesCobro WHERE Id = @Id AND Estado = 0);
        IF @CobroId IS NULL BEGIN ROLLBACK TRANSACTION; SELECT CAST(0 AS INT) AS Afectadas; RETURN; END
        UPDATE Cobros SET Estado = 0, FechaPago = NULL, MetodoPagoId = NULL, MetodoPago2Id = NULL, MetodoPago2Monto = NULL WHERE Id = @CobroId;
        UPDATE AnulacionesCobro SET Estado = 1, ResueltoPor = @AdminId, FechaResolucion = GETUTCDATE() WHERE Id = @Id;
        COMMIT TRANSACTION;
        SELECT CAST(1 AS INT) AS Afectadas;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION; THROW;
    END CATCH
END
GO

-- Pagos recibidos con desglose por medio: los pagos mixtos generan dos filas
-- (el Id de la 2ª fila es negativo para mantener claves únicas en los listados).
CREATE OR ALTER PROCEDURE sp_Reporte_PagosRecibidos
    @Desde DATE, @Hasta DATE, @CompaniaId INT = NULL, @OficinaId INT = NULL,
    @VendedorId INT = NULL, @VendedorRol VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT x.Id, co.FechaPago, x.Monto, co.NumeroCuota,
           p.Id AS PolizaId, p.Numero AS NroPoliza, p.PrimaOG, p.CantidadCuotas,
           c.Nombre AS ClienteNombre,
           cp.Nombre AS Compania, p.CompaniaId,
           ISNULL(r.Nombre,'-') AS Ramo,
           x.Metodo,
           ISNULL(vh.Patente,'-') AS Patente,
           c.OficinaId, ISNULL(o.Nombre,'Sin oficina') AS OficinaNombre,
           COALESCE(co.RegistradoPor, p.VendedorId) AS VendedorId,
           ISNULL(v.Nombre,'-') AS VendedorNombre
    FROM Cobros co
    INNER JOIN Polizas   p  ON p.Id  = co.PolizaId
    INNER JOIN Clientes  c  ON c.Id  = p.ClienteId
    INNER JOIN Companias cp ON cp.Id = p.CompaniaId
    LEFT  JOIN Ramos       r   ON r.Id   = p.RamoId
    LEFT  JOIN MetodosPago mp  ON mp.Id  = co.MetodoPagoId
    LEFT  JOIN MetodosPago mp2 ON mp2.Id = co.MetodoPago2Id
    LEFT  JOIN Vehiculos   vh  ON vh.Id  = p.VehiculoId
    LEFT  JOIN Oficinas    o   ON o.Id   = c.OficinaId
    LEFT  JOIN Usuarios    v   ON v.Id   = COALESCE(co.RegistradoPor, p.VendedorId)
    CROSS APPLY (
        SELECT co.Id AS Id,
               co.Monto - ISNULL(co.MetodoPago2Monto, 0) AS Monto,
               ISNULL(mp.Nombre,'Sin especificar') AS Metodo
        UNION ALL
        SELECT -co.Id,
               co.MetodoPago2Monto,
               ISNULL(mp2.Nombre,'Sin especificar')
        WHERE co.MetodoPago2Id IS NOT NULL AND ISNULL(co.MetodoPago2Monto, 0) > 0
    ) x
    WHERE co.Estado = 1
      AND co.FechaPago >= @Desde AND co.FechaPago < DATEADD(DAY, 1, @Hasta)
      AND (@CompaniaId  IS NULL OR p.CompaniaId = @CompaniaId)
      AND (@OficinaId   IS NULL OR c.OficinaId  = @OficinaId)
      AND (@VendedorId  IS NULL OR COALESCE(co.RegistradoPor, p.VendedorId) = @VendedorId)
      AND (@VendedorRol IS NULL OR v.Rol = @VendedorRol)
    ORDER BY co.FechaPago DESC;
END
GO

/* =============================================================================
   §47 — Búsqueda global: las pólizas muestran la patente del vehículo en el
   subtítulo y también se encuentran buscando por patente.
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Busqueda_Global @Termino NVARCHAR(100) AS
BEGIN
    SET NOCOUNT ON;
    SELECT 'Cliente' AS Tipo, c.Id, c.Nombre AS Titulo, c.Documento AS Subtitulo, c.Id AS Referencia
    FROM Clientes c
    WHERE c.Nombre LIKE '%' + @Termino + '%' OR c.Documento LIKE '%' + @Termino + '%'
    UNION ALL
    SELECT 'Vehiculo' AS Tipo, v.Id, (v.Marca + ' ' + v.Modelo) AS Titulo, v.Patente AS Subtitulo, v.ClienteId AS Referencia
    FROM Vehiculos v
    WHERE v.Patente LIKE '%' + @Termino + '%'
    UNION ALL
    SELECT 'Poliza' AS Tipo, p.Id, p.Numero AS Titulo,
           c.Nombre + ISNULL(N' · ' + v.Patente, N'') AS Subtitulo, p.Id AS Referencia
    FROM Polizas p
    INNER JOIN Clientes  c ON c.Id = p.ClienteId
    LEFT  JOIN Vehiculos v ON v.Id = p.VehiculoId
    WHERE p.Eliminada = 0
      AND (p.Numero LIKE '%' + @Termino + '%' OR v.Patente LIKE '%' + @Termino + '%');
END
GO

/* =============================================================================
   §48 — Endoso de titular. Cambia el titular (cliente) de una póliza guardando
   el titular anterior. No cambia nada más de la póliza; el vehículo asegurado se
   mueve al nuevo titular.
   ============================================================================= */
IF OBJECT_ID('EndososTitular') IS NULL
BEGIN
    CREATE TABLE EndososTitular (
        Id                INT PRIMARY KEY IDENTITY,
        PolizaId          INT NOT NULL REFERENCES Polizas(Id),
        ClienteAnteriorId INT NOT NULL REFERENCES Clientes(Id),
        ClienteNuevoId    INT NOT NULL REFERENCES Clientes(Id),
        FechaEndoso       DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UsuarioId         INT NULL REFERENCES Usuarios(Id),
        Motivo            NVARCHAR(300) NULL
    );
    CREATE INDEX IX_EndososTitular_PolizaId ON EndososTitular(PolizaId);
END
GO

CREATE OR ALTER PROCEDURE sp_Endoso_Insertar
    @PolizaId INT, @ClienteAnteriorId INT, @ClienteNuevoId INT,
    @UsuarioId INT = NULL, @Motivo NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO EndososTitular (PolizaId, ClienteAnteriorId, ClienteNuevoId, UsuarioId, Motivo)
    VALUES (@PolizaId, @ClienteAnteriorId, @ClienteNuevoId, @UsuarioId, @Motivo);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Endoso_GetPorPoliza @PolizaId INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT e.Id, e.PolizaId, e.FechaEndoso, e.Motivo,
           e.ClienteAnteriorId, ca.Nombre AS ClienteAnteriorNombre, ca.Documento AS ClienteAnteriorDocumento,
           e.ClienteNuevoId,    cn.Nombre AS ClienteNuevoNombre,    cn.Documento AS ClienteNuevoDocumento,
           u.Nombre AS UsuarioNombre
    FROM EndososTitular e
    INNER JOIN Clientes ca ON ca.Id = e.ClienteAnteriorId
    INNER JOIN Clientes cn ON cn.Id = e.ClienteNuevoId
    LEFT  JOIN Usuarios u  ON u.Id  = e.UsuarioId
    WHERE e.PolizaId = @PolizaId
    ORDER BY e.FechaEndoso DESC, e.Id DESC;
END
GO

CREATE OR ALTER PROCEDURE sp_Poliza_CambiarTitular @PolizaId INT, @ClienteId INT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Polizas SET ClienteId = @ClienteId WHERE Id = @PolizaId;
END
GO

CREATE OR ALTER PROCEDURE sp_Vehiculo_CambiarCliente @VehiculoId INT, @ClienteId INT AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Vehiculos SET ClienteId = @ClienteId WHERE Id = @VehiculoId;
END
GO

/* =============================================================================
   §49 — Recalcular cuotas pendientes al cambiar el precio de la póliza.
   Solo toca las cuotas NO pagadas (Estado <> 1); las ya cobradas conservan el
   monto con el que se pagaron, para que los reportes reflejen lo realmente cobrado.
   La última cuota absorbe el redondeo (igual que al generar el plan original).
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Cobro_RecalcularPendientes
    @PolizaId INT, @PrecioTotal DECIMAL(18,2), @CantidadCuotas INT
AS
BEGIN
    SET NOCOUNT ON;
    IF @CantidadCuotas IS NULL OR @CantidadCuotas <= 0 RETURN;
    DECLARE @base   DECIMAL(18,2) = ROUND(@PrecioTotal / @CantidadCuotas, 2);
    DECLARE @ultima DECIMAL(18,2) = @PrecioTotal - @base * (@CantidadCuotas - 1);
    UPDATE Cobros
    SET Monto = CASE WHEN NumeroCuota >= @CantidadCuotas THEN @ultima ELSE @base END
    WHERE PolizaId = @PolizaId AND Estado <> 1;   -- 1 = Pagado (no se toca)
END
GO

/* =============================================================================
   §50 — Fecha de nacimiento del asegurado (cliente). Editable desde la ficha del
   cliente y desde el apartado de edición. Se re-crean los SPs vigentes de cliente
   agregando la columna, conservando el resto de parámetros (TipoDocumento, Oficina).
   ============================================================================= */
IF COL_LENGTH('dbo.Clientes','FechaNacimiento') IS NULL
    ALTER TABLE Clientes ADD FechaNacimiento DATE NULL;
GO

CREATE OR ALTER PROCEDURE sp_Cliente_Insertar
    @Nombre NVARCHAR(150), @Documento VARCHAR(20), @Email VARCHAR(100) = NULL,
    @Telefono VARCHAR(30) = NULL, @Direccion NVARCHAR(200) = NULL,
    @TipoDocumento VARCHAR(20) = NULL, @OficinaId INT = NULL, @VendedorId INT = NULL,
    @FechaNacimiento DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO Clientes (Nombre, Documento, Email, Telefono, Direccion, TipoDocumento, OficinaId, VendedorId, FechaNacimiento)
    VALUES (@Nombre, @Documento, @Email, @Telefono, @Direccion, @TipoDocumento, @OficinaId, @VendedorId, @FechaNacimiento);
    SELECT SCOPE_IDENTITY() AS NuevoId;
END
GO

CREATE OR ALTER PROCEDURE sp_Cliente_Actualizar
    @Id INT, @Nombre NVARCHAR(150), @Email VARCHAR(100) = NULL,
    @Telefono VARCHAR(30) = NULL, @Direccion NVARCHAR(200) = NULL,
    @TipoDocumento VARCHAR(20) = NULL, @FechaNacimiento DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Clientes
    SET Nombre = @Nombre, Email = @Email, Telefono = @Telefono,
        Direccion = @Direccion,
        TipoDocumento = COALESCE(@TipoDocumento, TipoDocumento),
        FechaNacimiento = @FechaNacimiento
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE sp_Cliente_GetById @Id INT AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Nombre, Documento, Email, Telefono, Direccion, FechaAlta, Activo, TipoDocumento, OficinaId, FechaNacimiento
    FROM Clientes WHERE Id = @Id;
END
GO

/* =============================================================================
   §51 — La cobertura deja de editarse desde el vehículo (vive solo en la póliza).
   Como el formulario del vehículo ya no manda @TipoCobertura, se usa COALESCE para
   NO borrar el valor existente al actualizar. La combustión sí se edita desde ahí.
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Vehiculo_Actualizar
    @Id INT, @Marca VARCHAR(60), @Modelo VARCHAR(60), @Anio SMALLINT,
    @Chasis VARCHAR(50) = NULL, @Motor VARCHAR(50) = NULL,
    @TipoCobertura VARCHAR(40) = NULL, @Combustion VARCHAR(40) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Vehiculos
    SET Marca = @Marca, Modelo = @Modelo, Anio = @Anio, Chasis = @Chasis, Motor = @Motor,
        TipoCobertura = COALESCE(@TipoCobertura, TipoCobertura),
        Combustion    = COALESCE(@Combustion, Combustion)
    WHERE Id = @Id;
END
GO

/* =============================================================================
   §52 — Regenerar las cuotas pendientes cuando cambia la CANTIDAD de cuotas o el
   PERÍODO (fecha de inicio) de la póliza. Conserva las cuotas ya pagadas (monto y
   vencimiento históricos) y regenera el resto: cantidad, montos y vencimientos.
   Reemplaza al recálculo simple de monto (§49).
   ============================================================================= */
CREATE OR ALTER PROCEDURE sp_Cobro_RegenerarPendientes
    @PolizaId INT, @PrecioTotal DECIMAL(18,2), @CantidadCuotas INT, @PrimerVencimiento DATE
AS
BEGIN
    SET NOCOUNT ON;
    IF @CantidadCuotas IS NULL OR @CantidadCuotas <= 0 RETURN;

    -- Última cuota pagada: no se puede bajar la cantidad por debajo de las ya cobradas.
    DECLARE @maxPag INT = ISNULL((SELECT MAX(NumeroCuota) FROM Cobros WHERE PolizaId=@PolizaId AND Estado=1), 0);
    DECLARE @total  INT = CASE WHEN @CantidadCuotas < @maxPag THEN @maxPag ELSE @CantidadCuotas END;

    -- Borra las pendientes que sobran (más allá del total), salvo las referidas por una anulación.
    DELETE FROM Cobros
    WHERE PolizaId=@PolizaId AND Estado<>1 AND NumeroCuota > @total
      AND Id NOT IN (SELECT CobroId FROM AnulacionesCobro);

    DECLARE @base   DECIMAL(18,2) = ROUND(@PrecioTotal / @CantidadCuotas, 2);
    DECLARE @ultima DECIMAL(18,2) = @PrecioTotal - @base * (@CantidadCuotas - 1);

    DECLARE @monto DECIMAL(18,2), @venc DATE;
    DECLARE @i INT = @maxPag + 1;
    WHILE @i <= @total
    BEGIN
        SET @monto = CASE WHEN @i >= @CantidadCuotas THEN @ultima ELSE @base END;
        -- La cuota 1 vence en @PrimerVencimiento; las siguientes, un mes después de la anterior.
        SET @venc  = DATEADD(MONTH, @i - 1, @PrimerVencimiento);
        IF EXISTS (SELECT 1 FROM Cobros WHERE PolizaId=@PolizaId AND NumeroCuota=@i)
            UPDATE Cobros SET Monto=@monto, FechaVencimiento=@venc
            WHERE PolizaId=@PolizaId AND NumeroCuota=@i AND Estado<>1;   -- no toca pagadas
        ELSE
            INSERT INTO Cobros (PolizaId, NumeroCuota, FechaVencimiento, Monto, Estado)
            VALUES (@PolizaId, @i, @venc, @monto, 0);
        SET @i = @i + 1;
    END
END
GO

/* =============================================================================
   §53 — El número de una póliza CANCELADA (baja) o ELIMINADA puede reutilizarse.
   Se cambia el UNIQUE de tabla por un índice único FILTRADO que solo exige unicidad
   entre pólizas vivas (Estado <> 2 = no cancelada, y Eliminada = 0).
   ============================================================================= */
-- Quitar el constraint UNIQUE de tabla sobre Numero (tiene nombre autogenerado)
DECLARE @uqNumero NVARCHAR(200) = (
    SELECT kc.name FROM sys.key_constraints kc
    JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id AND ic.index_id = kc.unique_index_id
    JOIN sys.columns col ON col.object_id = ic.object_id AND col.column_id = ic.column_id
    WHERE kc.parent_object_id = OBJECT_ID('dbo.Polizas') AND kc.type = 'UQ' AND col.name = 'Numero');
IF @uqNumero IS NOT NULL
    EXEC('ALTER TABLE dbo.Polizas DROP CONSTRAINT ' + @uqNumero);
GO

-- Nota: NO se usa índice único filtrado a propósito. Un índice filtrado obliga a
-- QUOTED_IDENTIFIER ON en TODO INSERT/UPDATE de Polizas, lo que rompería el import y
-- cualquier operación por sqlcmd. La unicidad se valida a nivel aplicación en el SP; los
-- números automáticos ya son únicos por la secuencia seq_Poliza. Si quedó de un intento
-- previo, se elimina.
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Polizas_Numero_Vivas' AND object_id = OBJECT_ID('dbo.Polizas'))
    DROP INDEX UX_Polizas_Numero_Vivas ON dbo.Polizas;
GO

-- El check de asignación de número ignora las canceladas (2), renovadas (3) y eliminadas,
-- así el número de una póliza dada de baja, eliminada o renovada puede reutilizarse
-- (p. ej. la renovación conserva el número de la original, que queda en estado Renovada).
CREATE OR ALTER PROCEDURE sp_Poliza_AsignarNumero @Id INT, @Numero VARCHAR(20) AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM Polizas WHERE Numero = @Numero AND Id <> @Id AND Estado NOT IN (2, 3) AND Eliminada = 0)
    BEGIN SELECT CAST(-1 AS INT) AS Afectadas; RETURN; END
    UPDATE Polizas SET Numero = @Numero WHERE Id = @Id;
    SELECT @@ROWCOUNT AS Afectadas;
END
GO

/* =============================================================================
   FIN DEL SCRIPT — AmrProdSeg_Schema.sql
   ============================================================================= */
