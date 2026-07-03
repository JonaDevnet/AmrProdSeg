/* =============================================================================
   AmrProdSeg_SeedDemo.sql
   Datos de prueba RICOS para ejercitar todas las pantallas y reportes.
   Ejecutar DESPUÉS de AmrProdSeg_Schema.sql (y, opcionalmente, AmrProdSeg_Seed.sql).

   - Autocontenido: garantiza compañías, ramos y métodos de pago si faltan.
   - Idempotente: usa un cliente "testigo" (documento 20304050) como guarda;
     si ya existe, no vuelve a insertar nada.
   - Cubre estados: vigente, por vencer (<30 días), vencida, cancelada, renovada.
   - Cuotas en estados Pagada / Pendiente / Vencida.
   - Bajas (pendiente + aprobada) y una solicitud de reset pendiente.

   Fechas relativas a la fecha de ejecución → los estados se mantienen correctos.
   ============================================================================= */

SET NOCOUNT ON;
GO
USE AmrProdSeg;
GO

/* --- Catálogos base (idempotente) --- */
IF NOT EXISTS (SELECT 1 FROM Companias WHERE Nombre = 'La Caja Seguros')      INSERT INTO Companias (Nombre, CUIT, Telefono) VALUES ('La Caja Seguros','30-12345678-9','0800-111-2222');
IF NOT EXISTS (SELECT 1 FROM Companias WHERE Nombre = 'Sancor Seguros')       INSERT INTO Companias (Nombre, CUIT, Telefono) VALUES ('Sancor Seguros','30-98765432-1','0800-333-4444');
IF NOT EXISTS (SELECT 1 FROM Companias WHERE Nombre = 'Federación Patronal')  INSERT INTO Companias (Nombre, CUIT, Telefono) VALUES ('Federación Patronal','30-55566677-8','0800-555-6666');
IF NOT EXISTS (SELECT 1 FROM Companias WHERE Nombre = 'Río Uruguay Seguros')  INSERT INTO Companias (Nombre, CUIT, Telefono) VALUES ('Río Uruguay Seguros','30-44455566-7','0800-777-8888');
GO

IF OBJECT_ID('dbo.Ramos','U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Ramos WHERE Nombre='Automotor')     INSERT INTO Ramos (Nombre) VALUES ('Automotor');
    IF NOT EXISTS (SELECT 1 FROM Ramos WHERE Nombre='Motovehículo')  INSERT INTO Ramos (Nombre) VALUES ('Motovehículo');
    IF NOT EXISTS (SELECT 1 FROM Ramos WHERE Nombre='Hogar')         INSERT INTO Ramos (Nombre) VALUES ('Hogar');
    IF NOT EXISTS (SELECT 1 FROM Ramos WHERE Nombre='Vida')          INSERT INTO Ramos (Nombre) VALUES ('Vida');
    IF NOT EXISTS (SELECT 1 FROM Ramos WHERE Nombre='Comercio')      INSERT INTO Ramos (Nombre) VALUES ('Comercio');
    IF NOT EXISTS (SELECT 1 FROM Ramos WHERE Nombre='ART')           INSERT INTO Ramos (Nombre) VALUES ('ART');
END
GO

IF NOT EXISTS (SELECT 1 FROM MetodosPago WHERE Nombre='Efectivo')                INSERT INTO MetodosPago (Nombre) VALUES ('Efectivo');
IF NOT EXISTS (SELECT 1 FROM MetodosPago WHERE Nombre='Transferencia bancaria')  INSERT INTO MetodosPago (Nombre) VALUES ('Transferencia bancaria');
IF NOT EXISTS (SELECT 1 FROM MetodosPago WHERE Nombre='Tarjeta de crédito')      INSERT INTO MetodosPago (Nombre) VALUES ('Tarjeta de crédito');
IF NOT EXISTS (SELECT 1 FROM MetodosPago WHERE Nombre='Débito automático')       INSERT INTO MetodosPago (Nombre) VALUES ('Débito automático');
IF NOT EXISTS (SELECT 1 FROM MetodosPago WHERE Nombre='Mercado Pago')            INSERT INTO MetodosPago (Nombre) VALUES ('Mercado Pago');
GO

/* =============================================================================
   DEMO — guarda por cliente testigo (documento 20304050)
   ============================================================================= */
IF NOT EXISTS (SELECT 1 FROM Clientes WHERE Documento = '20304050')
BEGIN
    DECLARE @hoy DATE = CAST(GETUTCDATE() AS DATE);

    /* IDs de catálogos */
    DECLARE @CiaCaja INT = (SELECT Id FROM Companias WHERE Nombre='La Caja Seguros');
    DECLARE @CiaSanc INT = (SELECT Id FROM Companias WHERE Nombre='Sancor Seguros');
    DECLARE @CiaFed  INT = (SELECT Id FROM Companias WHERE Nombre='Federación Patronal');
    DECLARE @CiaRus  INT = (SELECT Id FROM Companias WHERE Nombre='Río Uruguay Seguros');

    DECLARE @RAuto INT = (SELECT Id FROM Ramos WHERE Nombre='Automotor');
    DECLARE @RMoto INT = (SELECT Id FROM Ramos WHERE Nombre='Motovehículo');
    DECLARE @RHog  INT = (SELECT Id FROM Ramos WHERE Nombre='Hogar');
    DECLARE @RVida INT = (SELECT Id FROM Ramos WHERE Nombre='Vida');
    DECLARE @RCom  INT = (SELECT Id FROM Ramos WHERE Nombre='Comercio');

    DECLARE @AdminId INT = (SELECT TOP 1 Id FROM Usuarios WHERE Rol='Admin' ORDER BY Id);
    DECLARE @ProdId  INT = (SELECT TOP 1 Id FROM Usuarios WHERE Rol='Productor' ORDER BY Id);
    IF @AdminId IS NULL SET @AdminId = (SELECT TOP 1 Id FROM Usuarios ORDER BY Id);

    /* --- Clientes --- */
    INSERT INTO Clientes (Nombre, Documento, Email, Telefono, Direccion) VALUES
        ('Sofía Romero',            '20304050', 'sofia.romero@mail.com',  '11-5520-7711', 'Av. Cabildo 2380, CABA'),
        ('Ricardo Pérez',           '22781003', 'r.perez@outlook.com',    '351-458-0012', 'San Martín 815, Córdoba'),
        ('Diego Molina',            '32445890', 'diego.molina@mail.com',  '261-4488-3300', 'Balcarce 450, Mendoza'),
        ('Lucía Fernández',         '35112440', 'lu.fernandez@mail.com',  '341-621-0092', 'Corrientes 2340, Rosario'),
        ('Camila Suárez',           '40330881', 'c.suarez@mail.com',      '11-5559-2211', 'Maipú 560, CABA'),
        ('Federico Bianchi',        '29009112', 'f.bianchi@mail.com',     '11-4887-3300', 'Monroe 1247, CABA'),
        ('Comercio La Estación SRL','30715550001','admin@laestacion.com.ar','11-4300-5522','Ruta 9 Km 55, Pilar'),
        ('Valentina Ortiz',         '39887550', 'v.ortiz@mail.com',       '11-6110-8823', 'Av. Santa Fe 3340, CABA');

    DECLARE @cSofia INT=(SELECT Id FROM Clientes WHERE Documento='20304050');
    DECLARE @cRica  INT=(SELECT Id FROM Clientes WHERE Documento='22781003');
    DECLARE @cDiego INT=(SELECT Id FROM Clientes WHERE Documento='32445890');
    DECLARE @cLucia INT=(SELECT Id FROM Clientes WHERE Documento='35112440');
    DECLARE @cCami  INT=(SELECT Id FROM Clientes WHERE Documento='40330881');
    DECLARE @cFede  INT=(SELECT Id FROM Clientes WHERE Documento='29009112');
    DECLARE @cComer INT=(SELECT Id FROM Clientes WHERE Documento='30715550001');
    DECLARE @cVale  INT=(SELECT Id FROM Clientes WHERE Documento='39887550');

    /* --- Vehículos (solo ramos vehiculares) --- */
    INSERT INTO Vehiculos (ClienteId, Marca, Modelo, Anio, Patente, Chasis, Motor, TipoCobertura) VALUES
        (@cSofia,'Chevrolet','Onix LT 1.0T',2023,'KQA312','8AGBA5534PE000811','LIY-338812','Todo Riesgo'),
        (@cRica, 'Ford','Focus SE 2.0',     2018,'PFG882','3FADP4BJ7JM149381','M50A-098761','Todo Riesgo c/Franquicia'),
        (@cDiego,'Honda','CB 190R',         2022,'A210BCJ','9C2JC7730LR000231','JC73E-2231001','Terceros Completo'),
        (@cFede, 'Fiat','Cronos Drive 1.3', 2022,'AC991XT','8AP1F6318NJ445892','ETORQ-889201','Terceros Completo'),
        (@cVale, 'Renault','Sandero 1.6',   2020,'AD778LR','VF1KSB20EH2334901','K4M-992110','Terceros Completo');

    DECLARE @vSofia INT=(SELECT Id FROM Vehiculos WHERE Patente='KQA312');
    DECLARE @vRica  INT=(SELECT Id FROM Vehiculos WHERE Patente='PFG882');
    DECLARE @vDiego INT=(SELECT Id FROM Vehiculos WHERE Patente='A210BCJ');
    DECLARE @vFede  INT=(SELECT Id FROM Vehiculos WHERE Patente='AC991XT');
    DECLARE @vVale  INT=(SELECT Id FROM Vehiculos WHERE Patente='AD778LR');

    DECLARE @PolId INT, @Numero VARCHAR(20), @i INT, @N INT, @Monto DECIMAL(18,2),
            @FIni DATE, @FFin DATE, @Precio DECIMAL(18,2), @Venc DATE, @Estado INT;

    /* helper de numeración igual al SP */
    DECLARE @mk VARCHAR(20);

    /* ---------------------------------------------------------------------------
       P1 — Sofía (Automotor / La Caja) — VIGENTE, cuotas pasadas pagadas
       --------------------------------------------------------------------------- */
    SET @FIni=DATEADD(MONTH,-3,@hoy); SET @FFin=DATEADD(MONTH,9,@hoy); SET @Precio=480000; SET @N=12;
    SET @Numero='POL-'+FORMAT(@hoy,'yyyyMM')+'-'+RIGHT('0000'+CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR),4);
    INSERT INTO Polizas (Numero,ClienteId,VehiculoId,CompaniaId,RamoId,FechaInicio,FechaFin,PrecioTotal,CantidadCuotas,Estado)
      VALUES (@Numero,@cSofia,@vSofia,@CiaCaja,@RAuto,@FIni,@FFin,@Precio,@N,0);
    SET @PolId=SCOPE_IDENTITY(); SET @Monto=ROUND(@Precio/@N,2); SET @i=1;
    WHILE @i<=@N BEGIN
      SET @Venc=DATEADD(MONTH,@i-1,@FIni);
      INSERT INTO Cobros (PolizaId,NumeroCuota,FechaVencimiento,Monto,Estado,FechaPago)
        VALUES (@PolId,@i,@Venc,@Monto, CASE WHEN @Venc<@hoy THEN 1 ELSE 0 END, CASE WHEN @Venc<@hoy THEN @Venc ELSE NULL END);
      SET @i+=1; END

    /* ---------------------------------------------------------------------------
       P2 — Ricardo (Automotor / Sancor) — MOROSA (cuotas vencidas impagas)
       --------------------------------------------------------------------------- */
    SET @FIni=DATEADD(MONTH,-5,@hoy); SET @FFin=DATEADD(MONTH,7,@hoy); SET @Precio=629000; SET @N=12;
    SET @Numero='POL-'+FORMAT(@hoy,'yyyyMM')+'-'+RIGHT('0000'+CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR),4);
    INSERT INTO Polizas (Numero,ClienteId,VehiculoId,CompaniaId,RamoId,FechaInicio,FechaFin,PrecioTotal,CantidadCuotas,Estado)
      VALUES (@Numero,@cRica,@vRica,@CiaSanc,@RAuto,@FIni,@FFin,@Precio,@N,0);
    SET @PolId=SCOPE_IDENTITY(); SET @Monto=ROUND(@Precio/@N,2); SET @i=1;
    WHILE @i<=@N BEGIN
      SET @Venc=DATEADD(MONTH,@i-1,@FIni);
      INSERT INTO Cobros (PolizaId,NumeroCuota,FechaVencimiento,Monto,Estado,FechaPago)
        VALUES (@PolId,@i,@Venc,@Monto,
                CASE WHEN @Venc<@hoy AND @i<=2 THEN 1            -- primeras 2 pagadas
                     WHEN @Venc<@hoy           THEN 2            -- resto vencidas impagas
                     ELSE 0 END,
                CASE WHEN @Venc<@hoy AND @i<=2 THEN @Venc ELSE NULL END);
      SET @i+=1; END

    /* ---------------------------------------------------------------------------
       P3 — Diego (Motovehículo / Federación) — POR VENCER (fin en ~20 días)
       --------------------------------------------------------------------------- */
    SET @FIni=DATEADD(DAY,-345,@hoy); SET @FFin=DATEADD(DAY,20,@hoy); SET @Precio=288000; SET @N=12;
    SET @Numero='POL-'+FORMAT(@hoy,'yyyyMM')+'-'+RIGHT('0000'+CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR),4);
    INSERT INTO Polizas (Numero,ClienteId,VehiculoId,CompaniaId,RamoId,FechaInicio,FechaFin,PrecioTotal,CantidadCuotas,Estado)
      VALUES (@Numero,@cDiego,@vDiego,@CiaFed,@RMoto,@FIni,@FFin,@Precio,@N,0);
    SET @PolId=SCOPE_IDENTITY(); SET @Monto=ROUND(@Precio/@N,2); SET @i=1;
    WHILE @i<=@N BEGIN
      SET @Venc=DATEADD(MONTH,@i-1,@FIni);
      INSERT INTO Cobros (PolizaId,NumeroCuota,FechaVencimiento,Monto,Estado,FechaPago)
        VALUES (@PolId,@i,@Venc,@Monto, CASE WHEN @Venc<@hoy THEN 1 ELSE 0 END, CASE WHEN @Venc<@hoy THEN @Venc ELSE NULL END);
      SET @i+=1; END

    /* ---------------------------------------------------------------------------
       P4 — Lucía (Hogar SIN vehículo / La Caja) — VIGENTE, trimestral
       --------------------------------------------------------------------------- */
    SET @FIni=DATEADD(MONTH,-4,@hoy); SET @FFin=DATEADD(MONTH,8,@hoy); SET @Precio=236700; SET @N=4;
    SET @Numero='POL-'+FORMAT(@hoy,'yyyyMM')+'-'+RIGHT('0000'+CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR),4);
    INSERT INTO Polizas (Numero,ClienteId,VehiculoId,CompaniaId,RamoId,FechaInicio,FechaFin,PrecioTotal,CantidadCuotas,Estado)
      VALUES (@Numero,@cLucia,NULL,@CiaCaja,@RHog,@FIni,@FFin,@Precio,@N,0);
    SET @PolId=SCOPE_IDENTITY(); SET @Monto=ROUND(@Precio/@N,2); SET @i=1;
    WHILE @i<=@N BEGIN
      SET @Venc=DATEADD(MONTH,(@i-1)*3,@FIni);
      INSERT INTO Cobros (PolizaId,NumeroCuota,FechaVencimiento,Monto,Estado,FechaPago)
        VALUES (@PolId,@i,@Venc,@Monto, CASE WHEN @Venc<@hoy THEN 1 ELSE 0 END, CASE WHEN @Venc<@hoy THEN @Venc ELSE NULL END);
      SET @i+=1; END

    /* ---------------------------------------------------------------------------
       P5 — Camila (Vida SIN vehículo / Sancor) — AL DÍA (3 cuotas pagadas → renovable)
       --------------------------------------------------------------------------- */
    SET @FIni=DATEADD(MONTH,-3,@hoy); SET @FFin=DATEADD(MONTH,9,@hoy); SET @Precio=150000; SET @N=3;
    SET @Numero='POL-'+FORMAT(@hoy,'yyyyMM')+'-'+RIGHT('0000'+CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR),4);
    INSERT INTO Polizas (Numero,ClienteId,VehiculoId,CompaniaId,RamoId,FechaInicio,FechaFin,PrecioTotal,CantidadCuotas,Estado)
      VALUES (@Numero,@cCami,NULL,@CiaSanc,@RVida,@FIni,@FFin,@Precio,@N,0);
    SET @PolId=SCOPE_IDENTITY(); SET @Monto=ROUND(@Precio/@N,2); SET @i=1;
    WHILE @i<=@N BEGIN
      SET @Venc=DATEADD(MONTH,@i-1,@FIni);
      INSERT INTO Cobros (PolizaId,NumeroCuota,FechaVencimiento,Monto,Estado,FechaPago)
        VALUES (@PolId,@i,@Venc,@Monto,1,@Venc);   -- todas pagadas
      SET @i+=1; END

    /* ---------------------------------------------------------------------------
       P6 — Federico (Automotor / Federación) — VENCIDA sin renovar (Estado=1)
       --------------------------------------------------------------------------- */
    SET @FIni=DATEADD(MONTH,-13,@hoy); SET @FFin=DATEADD(DAY,-30,@hoy); SET @Precio=420000; SET @N=12;
    SET @Numero='POL-'+FORMAT(@hoy,'yyyyMM')+'-'+RIGHT('0000'+CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR),4);
    INSERT INTO Polizas (Numero,ClienteId,VehiculoId,CompaniaId,RamoId,FechaInicio,FechaFin,PrecioTotal,CantidadCuotas,Estado)
      VALUES (@Numero,@cFede,@vFede,@CiaFed,@RAuto,@FIni,@FFin,@Precio,@N,1);
    SET @PolId=SCOPE_IDENTITY(); SET @Monto=ROUND(@Precio/@N,2); SET @i=1;
    WHILE @i<=@N BEGIN
      SET @Venc=DATEADD(MONTH,@i-1,@FIni);
      INSERT INTO Cobros (PolizaId,NumeroCuota,FechaVencimiento,Monto,Estado,FechaPago)
        VALUES (@PolId,@i,@Venc,@Monto,1,@Venc);
      SET @i+=1; END

    /* ---------------------------------------------------------------------------
       P7 — Comercio La Estación (Comercio SIN vehículo / Río Uruguay)
            → CANCELADA (Estado=2) por baja aprobada
       --------------------------------------------------------------------------- */
    SET @FIni=DATEADD(MONTH,-2,@hoy); SET @FFin=DATEADD(MONTH,10,@hoy); SET @Precio=540000; SET @N=12;
    SET @Numero='POL-'+FORMAT(@hoy,'yyyyMM')+'-'+RIGHT('0000'+CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR),4);
    INSERT INTO Polizas (Numero,ClienteId,VehiculoId,CompaniaId,RamoId,FechaInicio,FechaFin,PrecioTotal,CantidadCuotas,Estado)
      VALUES (@Numero,@cComer,NULL,@CiaRus,@RCom,@FIni,@FFin,@Precio,@N,2);
    DECLARE @PolComercio INT = SCOPE_IDENTITY();
    SET @Monto=ROUND(@Precio/@N,2); SET @i=1;
    WHILE @i<=@N BEGIN
      SET @Venc=DATEADD(MONTH,@i-1,@FIni);
      INSERT INTO Cobros (PolizaId,NumeroCuota,FechaVencimiento,Monto,Estado,FechaPago)
        VALUES (@PolComercio,@i,@Venc,@Monto, CASE WHEN @Venc<@hoy THEN 1 ELSE 0 END, CASE WHEN @Venc<@hoy THEN @Venc ELSE NULL END);
      SET @i+=1; END

    /* ---------------------------------------------------------------------------
       P8 — Valentina (Automotor / Río Uruguay) — RENOVADA (Estado=3) + nueva vigente
       --------------------------------------------------------------------------- */
    SET @FIni=DATEADD(MONTH,-14,@hoy); SET @FFin=DATEADD(MONTH,-2,@hoy); SET @Precio=360000; SET @N=12;
    SET @Numero='POL-'+FORMAT(@hoy,'yyyyMM')+'-'+RIGHT('0000'+CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR),4);
    INSERT INTO Polizas (Numero,ClienteId,VehiculoId,CompaniaId,RamoId,FechaInicio,FechaFin,PrecioTotal,CantidadCuotas,Estado)
      VALUES (@Numero,@cVale,@vVale,@CiaRus,@RAuto,@FIni,@FFin,@Precio,@N,3);
    DECLARE @PolValeOrig INT = SCOPE_IDENTITY();
    SET @Monto=ROUND(@Precio/@N,2); SET @i=1;
    WHILE @i<=@N BEGIN
      SET @Venc=DATEADD(MONTH,@i-1,@FIni);
      INSERT INTO Cobros (PolizaId,NumeroCuota,FechaVencimiento,Monto,Estado,FechaPago)
        VALUES (@PolValeOrig,@i,@Venc,@Monto,1,@Venc);
      SET @i+=1; END
    -- nueva póliza producto de la renovación (vigente)
    SET @FIni=DATEADD(MONTH,-2,@hoy); SET @FFin=DATEADD(MONTH,10,@hoy); SET @Precio=468000; SET @N=12;
    SET @Numero='POL-'+FORMAT(@hoy,'yyyyMM')+'-'+RIGHT('0000'+CAST(NEXT VALUE FOR seq_Poliza AS VARCHAR),4);
    INSERT INTO Polizas (Numero,ClienteId,VehiculoId,CompaniaId,RamoId,FechaInicio,FechaFin,PrecioTotal,CantidadCuotas,Estado,PolizaOrigenId)
      VALUES (@Numero,@cVale,@vVale,@CiaRus,@RAuto,@FIni,@FFin,@Precio,@N,0,@PolValeOrig);
    SET @PolId=SCOPE_IDENTITY(); SET @Monto=ROUND(@Precio/@N,2); SET @i=1;
    WHILE @i<=@N BEGIN
      SET @Venc=DATEADD(MONTH,@i-1,@FIni);
      INSERT INTO Cobros (PolizaId,NumeroCuota,FechaVencimiento,Monto,Estado,FechaPago)
        VALUES (@PolId,@i,@Venc,@Monto, CASE WHEN @Venc<@hoy THEN 1 ELSE 0 END, CASE WHEN @Venc<@hoy THEN @Venc ELSE NULL END);
      SET @i+=1; END

    /* ---------------------------------------------------------------------------
       BAJAS — una pendiente (Ricardo) y una aprobada (Comercio, póliza cancelada)
       --------------------------------------------------------------------------- */
    IF OBJECT_ID('dbo.Bajas','U') IS NOT NULL
    BEGIN
        DECLARE @PolRica INT = (SELECT Id FROM Polizas WHERE ClienteId=@cRica);
        INSERT INTO Bajas (PolizaId, Motivo, Observaciones, Estado, SolicitadoPor)
          VALUES (@PolRica, 'Falta de pago', 'Cliente con 3 cuotas vencidas.', 0, ISNULL(@ProdId,@AdminId));
        INSERT INTO Bajas (PolizaId, Motivo, Observaciones, Estado, SolicitadoPor, ResueltoPor, FechaResolucion)
          VALUES (@PolComercio, 'Cierre del comercio', 'Aprobada: el comercio cesó actividad.', 1, ISNULL(@ProdId,@AdminId), @AdminId, GETUTCDATE());
    END

    /* ---------------------------------------------------------------------------
       SOLICITUD DE RESET pendiente para el productor (la verá el Admin)
       --------------------------------------------------------------------------- */
    IF OBJECT_ID('dbo.SolicitudesReset','U') IS NOT NULL AND @ProdId IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM SolicitudesReset WHERE UsuarioId=@ProdId AND Estado=0)
    BEGIN
        INSERT INTO SolicitudesReset (UsuarioId, Email, Estado)
          SELECT @ProdId, Email, 0 FROM Usuarios WHERE Id=@ProdId;
    END

    PRINT 'Seed DEMO cargado: 8 clientes, 9 pólizas, cobros mixtos, 2 bajas y 1 solicitud de reset.';
END
ELSE
    PRINT 'Seed DEMO ya estaba cargado (cliente testigo 20304050 presente). No se insertó nada.';
GO

/* =============================================================================
   FIN — AmrProdSeg_SeedDemo.sql
   ============================================================================= */
