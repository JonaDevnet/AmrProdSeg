# AmrProdSeg — Sistema de Gestión de Pólizas de Seguros

Plataforma web para productores de seguros: clientes, vehículos, pólizas, cobranzas,
renovaciones, reportes y comprobantes en PDF.

- **Backend:** ASP.NET Core (.NET 10) en capas + ADO.NET + SQL Server (Stored Procedures), JWT con roles, FluentValidation, Quartz.NET, QuestPDF, ClosedXML, Serilog.
- **Frontend:** React 18 + TypeScript + Vite, React Router, React Query, React Hook Form + Zod, Recharts.
- **Base de datos:** SQL Server (`AmrProdSeg`).

---

## 1. Requisitos

- .NET SDK 10
- Node.js 18+ y npm
- SQL Server (probado con SQL Server Express — instancia `localhost\SQLEXPRESS`)
- `sqlcmd` o SSMS para ejecutar los scripts

## 2. Base de datos

Ejecutar, **en orden**, sobre tu instancia de SQL Server:

```bash
sqlcmd -S "localhost\SQLEXPRESS" -E -i AmrProdSeg_Schema.sql
sqlcmd -S "localhost\SQLEXPRESS" -E -i AmrProdSeg_Seed.sql
sqlcmd -S "localhost\SQLEXPRESS" -E -d AmrProdSeg -i AmrProdSeg_SeedDemo.sql   # opcional: datos demo ricos
```

- `AmrProdSeg_Schema.sql` — crea la base, tablas, índices, secuencia y todos los Stored Procedures (idempotente).
- `AmrProdSeg_Seed.sql` — datos de prueba base: usuarios, compañías, clientes, vehículos, pólizas, cuotas y métodos de pago.
- `AmrProdSeg_SeedDemo.sql` — datos demo más ricos para ejercitar todas las pantallas y reportes (idempotente; pólizas en todos los estados, cobros mixtos, bajas, solicitud de reset).

> Si tu instancia **no** es `localhost\SQLEXPRESS`, ajustá la cadena de conexión en
> `Back/AmrProdSeg.API/appsettings.json` (`ConnectionStrings:AmrProdSeg`).

**Usuarios sembrados** (contraseña `Admin123!`):
- `jonathan.rinaldi03@gmail.com` — **Admin**
- `productor@amrseguros.com` — **Productor**

## 3. Backend

```bash
cd Back/AmrProdSeg.API
dotnet run --launch-profile http      # API en http://localhost:5207
```

- En **Development** no se fuerza HTTPS (para que el proxy del frontend funcione).
- Swagger/OpenAPI disponible en desarrollo. Healthcheck en `/health`.

## 4. Frontend

```bash
cd Front
npm install
npm run dev                            # http://localhost:5173
```

El dev server **proxea `/api` → `http://localhost:5207`**, así que ambos deben estar corriendo.

## 5. Funcionalidades

- **Cartera de clientes**: búsqueda, paginación, alta/edición, corrección de documento (Admin, auditada).
- **Vehículos**: alta/edición desde la ficha del cliente.
- **Pólizas**: listado con filtros, detalle, plan de cuotas, comprobante PDF, cancelación.
- **Cobranzas**: cuotas pendientes con **dots de progreso** por póliza, registro de pago con **método de pago**,
  **comprobante** (imprimir + enviar por Email/WhatsApp), **anulación** de pago (Admin directo / Productor con aprobación) y **renovación**.
- **Alta de asegurado**: wizard de 3 pasos (cliente + vehículo + póliza) en **una transacción**. Emite Nº **E/T**
  (en trámite) y luego se asigna el **número definitivo**. Captura **prima OG** (interna).
- **Reportes** (3 tabs fieles al diseño): **Pagos recibidos**, **Rendición** (con prima OG y diferencia) y
  **Hechos del día**, con exportación a **CSV/Excel**.
- **Mis finanzas**: dashboard personal de ingresos/egresos, **privado por usuario**.
- **Búsqueda global** (⌘K / Ctrl+K) sobre clientes, vehículos y pólizas.
- **Administración** (rol Admin): usuarios/vendedores, compañías, métodos de pago y ramos (alta y **eliminación**).
- **Recuperación de contraseña con autorización del Admin**: el vendedor la solicita, el Admin la
  autoriza y el vendedor define su nueva contraseña.
- **Notificaciones de vencimiento** (job diario Quartz): recordatorios por **Email** (SMTP) y
  **WhatsApp** (Evolution API). Ambos canales vienen **desactivados** por configuración.

## 6. Configuración de notificaciones (opcional)

**Email (SMTP) — desde la web:** el **Admin** lo edita en **Configuración** (menú del avatar): correo emisor,
host/puerto/SSL, usuario, contraseña y habilitado. Se persiste en la base (`Configuraciones`) y se aplica al enviar.
Lo de abajo (en `appsettings.json`) son los **valores por defecto** si no hay config en la base.

En `Back/AmrProdSeg.API/appsettings.json`:

- **Email (SMTP):** `Smtp.Habilitado = true` + `Host/Port/Usuario/Password/From`.
- **WhatsApp (Evolution API) — desde la web:** el **Admin** también lo edita en **Configuración**
  (BaseUrl/Instance/ApiKey/Habilitado). Se persiste en la base y se aplica al enviar (el teléfono se
  normaliza al formato AR `549…`). Los valores de `appsettings.json` quedan como defaults.
- Anticipación y horario: `Notificaciones.DiasAnticipacion` y `Notificaciones.CronDiario`.
- Para probar sin esperar al cron: **`POST /api/notificaciones/ejecutar`** (rol Admin) dispara el job a demanda.
  Con los canales en `Habilitado=false`, los envíos quedan registrados en el log como `DESACTIVADO`.

## 7. Producción

- La cadena de conexión y la clave JWT deben ir por **variables de entorno**:
  `CONNECTIONSTRINGS__AMRPRODSEG` y `JWT__KEY`.
- Fuera de Development se fuerza HTTPS (HSTS), rate limiting y headers de seguridad.

## 8. Estructura

```
AmrProdSeg_Schema.sql        # esquema + SPs
AmrProdSeg_Seed.sql          # datos de prueba
Back/AmrProdSeg.API/         # API .NET (Controllers, Application, Domain, Infrastructure, Security)
Back/AmrProdSeg.Tests/       # tests xUnit
Front/                       # app React + TS (src/) y prototipos (prototipos/)
AmrProduccionSeguros_Documentacion_Diseno.md   # documento de diseño
```

## 9. Tests

**Backend (xUnit):**
```bash
cd Back
dotnet test
```

**Frontend (Vitest + Testing Library):**
```bash
cd Front
npm test                  # corrida única
npm run test:watch        # modo watch
```
