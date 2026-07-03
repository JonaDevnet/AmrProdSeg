/* =============================================================================
   AmrProdSeg_Seed.sql
   Datos de prueba para AMR Producción Seguros (AmrProdSeg)
   Ejecutar DESPUÉS de AmrProdSeg_Schema.sql
   Idempotente: solo inserta si las tablas están vacías.

   Usuarios sembrados (contraseña en texto plano: Admin123!)
     - admin@amrseguros.com      (Rol: Admin)
     - productor@amrseguros.com  (Rol: Productor)
   Hash BCrypt generado con work factor 10 (compatible con BCrypt.Net-Next).
   ============================================================================= */

SET NOCOUNT ON;
GO

USE AmrProdSeg;
GO

/* -----------------------------------------------------------------------------
   1. USUARIOS
   ----------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM Usuarios)
BEGIN
    INSERT INTO Usuarios (Nombre, Email, PasswordHash, Rol) VALUES
        ('Administrador', 'jonathan.rinaldi03@gmail.com',
         '$2b$10$YaWBt1dpolSsJwj29LU2MO1AkPgdc4QdZCSeIRazCQkwrBAsRGyKC', 'Admin'),
        ('Productor Demo', 'productor@amrseguros.com',
         '$2b$10$YaWBt1dpolSsJwj29LU2MO1AkPgdc4QdZCSeIRazCQkwrBAsRGyKC', 'Productor');
END
GO

/* -----------------------------------------------------------------------------
   2. COMPAÑÍAS
   ----------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM Companias)
BEGIN
    INSERT INTO Companias (Nombre, CUIT, Telefono) VALUES
        ('La Caja Seguros',      '30-12345678-9', '0800-111-2222'),
        ('Sancor Seguros',       '30-98765432-1', '0800-333-4444'),
        ('Federación Patronal',  '30-55566677-8', '0800-555-6666');
END
GO

/* -----------------------------------------------------------------------------
   2a. RAMOS (catálogo, admin-only)
   ----------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.Ramos','U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Ramos)
BEGIN
    INSERT INTO Ramos (Nombre) VALUES
        ('Automotor'), ('Motovehículo'), ('Hogar'), ('Vida'), ('Comercio'), ('ART');
END
GO

/* -----------------------------------------------------------------------------
   2b. MÉTODOS DE PAGO (catálogo compartido)
   ----------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM MetodosPago)
BEGIN
    INSERT INTO MetodosPago (Nombre) VALUES
        ('Efectivo'),
        ('Transferencia bancaria'),
        ('Tarjeta de crédito'),
        ('Débito automático'),
        ('Mercado Pago'),
        ('CBU');
END
GO

/* -----------------------------------------------------------------------------
   3. CLIENTES + VEHÍCULOS + PÓLIZAS + COBROS
   Solo se siembra si no hay clientes cargados.
   ----------------------------------------------------------------------------- */
IF NOT EXISTS (SELECT 1 FROM Clientes)
BEGIN
    /* --- Clientes --- */
    INSERT INTO Clientes (Nombre, Documento, Email, Telefono, Direccion) VALUES
        ('Juan Pérez',            '30111222', 'juan.perez@mail.com',  '11-4000-1111', 'Av. Siempreviva 742'),
        ('María Gómez',           '27888999', 'maria.gomez@mail.com', '11-4000-2222', 'Calle Falsa 123'),
        ('Transporte del Sur SRL','30712345678', 'contacto@tdelsur.com','11-4000-3333','Ruta 3 Km 45');

    DECLARE @CliJuan  INT = (SELECT Id FROM Clientes WHERE Documento = '30111222');
    DECLARE @CliMaria INT = (SELECT Id FROM Clientes WHERE Documento = '27888999');
    DECLARE @CliTrans INT = (SELECT Id FROM Clientes WHERE Documento = '30712345678');

    DECLARE @CiaCaja  INT = (SELECT Id FROM Companias WHERE Nombre = 'La Caja Seguros');
    DECLARE @CiaSanc  INT = (SELECT Id FROM Companias WHERE Nombre = 'Sancor Seguros');
    DECLARE @CiaFed   INT = (SELECT Id FROM Companias WHERE Nombre = 'Federación Patronal');

    /* --- Vehículos --- */
    INSERT INTO Vehiculos (ClienteId, Marca, Modelo, Anio, Patente, Chasis, Motor, TipoCobertura) VALUES
        (@CliJuan,  'Toyota',     'Corolla', 2021, 'AB123CD', 'CH-JUAN-001', 'MT-JUAN-001', 'Todo riesgo'),
        (@CliMaria, 'Volkswagen', 'Gol',     2018, 'AC456EF', 'CH-MARIA-01', 'MT-MARIA-01', 'Terceros completo'),
        (@CliTrans, 'Mercedes',   'Sprinter',2019, 'AD789GH', 'CH-TRANS-01', 'MT-TRANS-01', 'Terceros');

    DECLARE @VehJuan  INT = (SELECT Id FROM Vehiculos WHERE Patente = 'AB123CD');
    DECLARE @VehMaria INT = (SELECT Id FROM Vehiculos WHERE Patente = 'AC456EF');
    DECLARE @VehTrans INT = (SELECT Id FROM Vehiculos WHERE Patente = 'AD789GH');

    /* =========================================================================
       Helper inline: insertamos cada póliza y luego generamos sus cuotas con
       un WHILE. El Número se arma con la secuencia, igual que sp_Poliza_Insertar.
       ========================================================================= */
    DECLARE @PolId INT, @Numero VARCHAR(20), @i INT, @N INT, @Monto DECIMAL(18,2),
            @FIni DATE, @Precio DECIMAL(18,2), @Venc DATE;

    /* --- PÓLIZA 1: Juan — ACTIVA, cuotas pasadas pagadas --- */
    SET @FIni = '2026-03-01'; SET @Precio = 120000.00; SET @N = 12;
    SET @Numero = 'POL-' + FORMAT(GETDATE(),'yyyyMM') + '-' + RIGHT('0000'+CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR),4);
    INSERT INTO Polizas (Numero, ClienteId, VehiculoId, CompaniaId, FechaInicio, FechaFin, PrecioTotal, CantidadCuotas, Estado)
    VALUES (@Numero, @CliJuan, @VehJuan, @CiaCaja, @FIni, DATEADD(YEAR,1,@FIni), @Precio, @N, 0);
    SET @PolId = SCOPE_IDENTITY();
    SET @Monto = ROUND(@Precio / @N, 2);
    SET @i = 1;
    WHILE @i <= @N
    BEGIN
        SET @Venc = DATEADD(MONTH, @i-1, @FIni);
        INSERT INTO Cobros (PolizaId, NumeroCuota, FechaVencimiento, Monto, Estado, FechaPago)
        VALUES (@PolId, @i, @Venc, @Monto,
                CASE WHEN @Venc < CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END,           -- pasadas Pagadas
                CASE WHEN @Venc < CAST(GETDATE() AS DATE) THEN @Venc ELSE NULL END);
        SET @i += 1;
    END

    /* --- PÓLIZA 2: María — ACTIVA y PRÓXIMA A VENCER (fin dentro de ~30 días) --- */
    SET @FIni = '2025-07-15'; SET @Precio = 96000.00; SET @N = 12;
    SET @Numero = 'POL-' + FORMAT(GETDATE(),'yyyyMM') + '-' + RIGHT('0000'+CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR),4);
    INSERT INTO Polizas (Numero, ClienteId, VehiculoId, CompaniaId, FechaInicio, FechaFin, PrecioTotal, CantidadCuotas, Estado)
    VALUES (@Numero, @CliMaria, @VehMaria, @CiaSanc, @FIni, '2026-07-15', @Precio, @N, 0);
    SET @PolId = SCOPE_IDENTITY();
    SET @Monto = ROUND(@Precio / @N, 2);
    SET @i = 1;
    WHILE @i <= @N
    BEGIN
        SET @Venc = DATEADD(MONTH, @i-1, @FIni);
        -- Algunas vencidas impagas para alimentar reporte de Deuda Acumulada
        INSERT INTO Cobros (PolizaId, NumeroCuota, FechaVencimiento, Monto, Estado, FechaPago)
        VALUES (@PolId, @i, @Venc, @Monto,
                CASE WHEN @Venc < CAST(GETDATE() AS DATE) AND @i <= 8 THEN 1            -- primeras 8 Pagadas
                     WHEN @Venc < CAST(GETDATE() AS DATE)            THEN 2            -- resto pasadas Vencidas
                     ELSE 0 END,                                                        -- futuras Pendientes
                CASE WHEN @Venc < CAST(GETDATE() AS DATE) AND @i <= 8 THEN @Venc ELSE NULL END);
        SET @i += 1;
    END

    /* --- PÓLIZA 3: Transporte del Sur — VENCIDA SIN RENOVAR (Estado=1) --- */
    SET @FIni = '2025-05-01'; SET @Precio = 180000.00; SET @N = 6;
    SET @Numero = 'POL-' + FORMAT(GETDATE(),'yyyyMM') + '-' + RIGHT('0000'+CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR),4);
    INSERT INTO Polizas (Numero, ClienteId, VehiculoId, CompaniaId, FechaInicio, FechaFin, PrecioTotal, CantidadCuotas, Estado)
    VALUES (@Numero, @CliTrans, @VehTrans, @CiaFed, @FIni, '2025-11-01', @Precio, @N, 1);   -- 1 = Vencida
    SET @PolId = SCOPE_IDENTITY();
    SET @Monto = ROUND(@Precio / @N, 2);
    SET @i = 1;
    WHILE @i <= @N
    BEGIN
        SET @Venc = DATEADD(MONTH, @i-1, @FIni);
        INSERT INTO Cobros (PolizaId, NumeroCuota, FechaVencimiento, Monto, Estado, FechaPago)
        VALUES (@PolId, @i, @Venc, @Monto, 1, @Venc);   -- todas Pagadas en su momento
        SET @i += 1;
    END
END
GO

PRINT 'Seed AmrProdSeg cargado correctamente.';
GO

/* =============================================================================
   FIN DEL SCRIPT — AmrProdSeg_Seed.sql
   ============================================================================= */
