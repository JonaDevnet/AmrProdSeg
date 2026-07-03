# AmrProdSeg — Estado del Proyecto

Sistema de gestión de pólizas para **AMR Producción de Seguros**: clientes, vehículos,
pólizas multi-ramo, cobranzas, renovaciones, bajas, reportes y comprobantes en PDF.

> Documento de estado: qué está **implementado y verificado**, y qué **queda pendiente**.

---

## 1. Stack y arquitectura

| Capa | Tecnología |
|---|---|
| **Backend** | ASP.NET Core (.NET 10), arquitectura en capas, **ADO.NET** (sin ORM) sobre **SQL Server** con **Stored Procedures** |
| **Auth** | JWT Bearer + roles (Admin / Productor), refresh token con rotación |
| **Backend libs** | FluentValidation, Quartz.NET (jobs), QuestPDF (PDF), ClosedXML (Excel), Serilog, AspNetCoreRateLimit, BCrypt.Net |
| **Frontend** | React 18 + TypeScript + Vite, React Router v6, React Query (TanStack), React Hook Form + Zod, Recharts |
| **Base de datos** | SQL Server (`AmrProdSeg`) — probado en `localhost\SQLEXPRESS` |
| **Diseño** | Tokens oklch + DM Sans / JetBrains Mono, fiel a `Front/disenioAMR` |

**Estructura de carpetas**
```
AmrProdSeg_Schema.sql        # esquema + SPs (idempotente)
AmrProdSeg_Seed.sql          # datos de prueba
Back/AmrProdSeg.API/         # API (.NET): Controllers, Application, Domain, Infrastructure, Security
Back/AmrProdSeg.Tests/       # tests xUnit (reglas de negocio)
Front/                       # app React+TS (src/) — diseño en disenioAMR/, prototipos en prototipos/
README.md                    # puesta en marcha
ESTADO_DEL_PROYECTO.md       # este documento
```

## 2. Puesta en marcha

```bash
# Base de datos (en orden)
sqlcmd -S "localhost\SQLEXPRESS" -E -i AmrProdSeg_Schema.sql
sqlcmd -S "localhost\SQLEXPRESS" -E -i AmrProdSeg_Seed.sql

# Backend
cd Back/AmrProdSeg.API && dotnet run --launch-profile http    # http://localhost:5207

# Frontend
cd Front && npm install && npm run dev                         # http://localhost:5173
```

**Credenciales** (contraseña `Admin123!`): `jonathan.rinaldi03@gmail.com` (Admin) · `productor@amrseguros.com` (Productor).

---

## 3. Funcionalidades implementadas ✅

### Autenticación y usuarios
- Login JWT, **refresh con rotación**, logout. Autorización por **roles** (Admin/Productor) en API y rutas del front.
- **Recuperación de contraseña con autorización del Admin**: el vendedor la solicita → el Admin la autoriza → el vendedor define su nueva contraseña.
- Gestión de **usuarios/vendedores** (alta con hash BCrypt — solo Admin) y **cambio de contraseña propia**.

### Clientes (Cartera)
- Listado **paginado** con búsqueda (nombre/documento), alta y edición.
- **Corrección de documento** (solo Admin) registrada en **auditoría**.
- **Ficha del cliente**: datos + vehículos (alta/edición) + pólizas asociadas.

### Vehículos
- Alta/edición desde la ficha; consulta por cliente y **por patente**.

### Pólizas
- Listado con **filtros** (estado, cliente) + **paginación** + **ramo** + cliente + patente.
- Detalle con **plan de cuotas**, **comprobante PDF**, **cancelar**, **renovar**, **pagar cuotas**.
- **Editar cobertura** (`PUT /polizas/{id}`): compañía, ramo, vigencia, prima, cuotas.

### Multi-ramo (catálogo gestionado solo por Admin)
- Catálogo **Ramos** (Automotor, Motovehículo, Hogar, Vida, Comercio, ART) — alta solo Admin, lectura para todos.
- Las pólizas tienen ramo; el **vehículo es opcional según el ramo** (Automotor/Moto lo requieren; Hogar/Vida no).

### Alta de asegurado (Nueva Póliza)
- **Wizard transaccional** (cliente + vehículo + póliza + cuotas en una sola transacción, con rollback).
- UI **fiel al diseño**: 3 columnas, stepper vertical, panel **RESUMEN** en vivo, segmented controls, hints, requeridos. El paso "Vehículo" aparece según el ramo.

### Editar por búsqueda
- Navbar **"Editar ▾"** → Asegurado (DNI) · Vehículo (patente) · Cobertura (póliza).
- Flujo **lookup "Paso 1" → formulario + panel de contexto** (fiel al diseño).

### Cobranzas
- Vista **master-detail** (fiel): lista de pólizas activas + panel navy con cuotas.
- En la lista, **dots de progreso de cuotas** por fila (verde pagada / roja vencida / gris pendiente) + "X/Y pagas" (conteos en `sp_Poliza_Listar`, sin N+1).
- **Registro de pago** por cuota con **método de pago**; **renovación** de póliza; **anulación** de cuota; KPIs y chips de filtro (Todos / Con deuda / Por cobrar / Al día).
- **Cuponera**: forma de pago en la que **no se genera comprobante** (solo se marca el pago) y hay **un único precio = prima OG**.

### Bajas / Anulaciones
- El vendedor **solicita** la baja de una póliza (motivo + observaciones); la lista muestra **quién la solicitó**.
- El **Admin aprueba/rechaza**; al aprobar **cancela la póliza** (en transacción).

### Reportes (3 tabs, fiel al prototipo)
- **Pagos recibidos** (agrupado por compañía + desglose por método con barras + total general),
  **Rendición** (rango + compañía + % comisión, con **prima OG** y diferencia → export) y **Hechos del día** (rango horario).
- Datos reales del endpoint `pagos-recibidos`; **export a CSV/Excel** por tab.

### Catálogos (Admin)
- **Compañías**, **Métodos de pago** y **Ramos**: alta, listado y **eliminación** (baja lógica `Activo=0`, sólo Admin).

### Notificaciones de vencimiento
- **Job diario (Quartz)** que detecta pólizas y cuotas que vencen en N días y envía recordatorios por **Email (SMTP)** y **WhatsApp (Evolution API)** (con normalización de teléfono AR).
- Ambos canales vienen **desactivados por configuración** (listos para activar). Endpoint Admin `POST /api/notificaciones/ejecutar` para dispararlo a demanda.
- **Config SMTP y WhatsApp editables por el Admin desde la web** (apartado **Configuración**): SMTP (correo emisor/From, nombre, host/puerto/SSL, usuario, contraseña, habilitado) y Evolution/WhatsApp (BaseUrl, Instance, ApiKey, habilitado). Se persiste en la tabla `Configuraciones` y se aplica en tiempo de envío (con fallback a `appsettings.json`).

### Cobros, comprobante y anulación
- **Comprobante** tras cobrar: impresión real (comprobante A4 + ticket 80 mm) y **envío por Email/WhatsApp** (`POST /api/cobros/{id}/comprobante/enviar`, reusa los senders).
- **Anulación de pago**: el **Admin** la revierte en el acto; el **Productor** genera una solicitud que el Admin aprueba/rechaza desde la **campanita**.

### Póliza E/T y prima OG
- El alta emite el número como **`E/T-######` (en trámite)**; luego se asigna el **número definitivo** (`PUT /api/polizas/{id}/numero`). Chip "EN TRÁMITE" en la cartera.
- **Prima OG** (precio real de la compañía): campo **interno** (no figura en el comprobante del cliente). Se captura en alta/editar y se refleja en la **rendición** (diferencia cobrado − prima OG).

### Finanzas personales (privado por usuario)
- Apartado **"Mis finanzas"** (menú del avatar): ingresos/egresos con KPIs (ingresos, egresos, balance). Cada usuario sólo ve **sus** movimientos (tabla `Movimientos` acotada al token).

### Campos por ramo (persistidos)
- **Tipo de documento** (Cliente), **combustión** (Vehículo) y **forma de pago** (Póliza) se capturan y **persisten** (columnas nuevas + SPs).

### Búsqueda global y navegación
- **Búsqueda global ⌘K** (clientes, vehículos, pólizas) con navegación directa.
- **Campanita** con pólizas próximas a vencer (30 días).
- **Navbar navy** fiel: Cartera · Pólizas · Nueva póliza · Editar ▾ · Cobranzas · Bajas · Reportes + buscador + avatar-menú (Admin: Vendedores / Compañías-Ramos-Métodos).

### Seguridad y operación
- Rate limiting, headers de seguridad, manejo de excepciones (sin stack traces al cliente),
  **healthcheck `/health`**, HTTPS forzado en producción, Serilog (consola + archivo).
- **Tests xUnit** de reglas de negocio (pago duplicado, renovación inválida, unicidad, etc.).

---

## 4. Pendiente / próximos pasos ⬜

| Ítem | Detalle |
|---|---|
| **Cargar credenciales de notificaciones** | Email: `Smtp:Habilitado=true` + usuario/clave/from. WhatsApp: `Evolution:Habilitado=true` + BaseUrl/Instance/ApiKey. La infraestructura (senders, normalización AR, job diario, endpoint manual y envío del comprobante) ya está lista; sólo falta la config real. |
| **Más cobertura de tests** | Frontend: hay Vitest + Testing Library (8 tests). Sumar tests de componentes con datos (Cobranzas, Reportes). |
| **Detalles de fidelidad fina** | Revisar 1:1 contra `disenioAMR` pantallas menores (animaciones/toasts). |

---

## 5. Endpoints principales (API)

```
POST  /api/auth/login | /refresh | /logout
POST  /api/auth/reset/solicitar | /reset/confirmar         # recuperación con autorización

GET   /api/clientes?q&page&pageSize   POST/PUT /api/clientes
PUT   /api/clientes/{id}/documento     (Admin, auditado)
GET   /api/vehiculos?clienteId | /por-patente   POST/PUT /api/vehiculos
GET   /api/polizas?clienteId&estado&page   GET/PUT /api/polizas/{id}
POST  /api/polizas/{id}/renovar | PUT /{id}/cancelar | GET /{id}/pdf
GET   /api/cobros?polizaId | /pendientes   PUT /api/cobros/{id}/pagar
POST  /api/cobros/{id}/comprobante/enviar                   # email | whatsapp
POST  /api/cobros/{id}/anular                               # Admin revierte / Productor solicita
GET   /api/anulaciones/pendientes  POST /…/{id}/aprobar|rechazar (Admin)
POST  /api/altas                                            # alta transaccional (Nº E/T)
PUT   /api/polizas/{id}/numero                              # asignar Nº definitivo
GET   /api/ramos     POST /api/ramos     DELETE /api/ramos/{id}        (Admin)
GET   /api/companias POST /api/companias DELETE /api/companias/{id}    (Admin)
GET   /api/metodos-pago POST/DELETE /api/metodos-pago[/{id}]           (Admin)
GET   /api/bajas     POST /api/bajas    POST /api/bajas/{id}/aprobar|rechazar (Admin)
GET   /api/movimientos POST /api/movimientos DELETE /api/movimientos/{id}  # finanzas personales (privado)
GET   /api/usuarios  POST /api/usuarios (Admin)  PUT /api/usuarios/password
GET   /api/usuarios/solicitudes-reset  POST /…/{id}/autorizar (Admin)
POST  /api/notificaciones/ejecutar     (Admin)             # dispara el job a demanda
GET/PUT /api/configuracion/smtp | /configuracion/whatsapp (Admin)   # SMTP y WhatsApp editables
GET   /api/auditoria?tabla&registroId  (Admin)
GET   /api/reportes/*  (+ /pdf y /excel según reporte)
GET   /api/stats/publicas              (anónimo)           # conteos
GET   /api/search?q                                         # búsqueda global
GET   /health
```

## 6. Notas de configuración

- En **producción**, la connection string y la clave JWT van por variables de entorno
  (`CONNECTIONSTRINGS__AMRPRODSEG`, `JWT__KEY`).
- En **Development** no se fuerza HTTPS (para que el proxy de Vite `/api → :5207` funcione).
- Fechas unificadas a **UTC** (`GETUTCDATE()` en SQL + `DateTime.UtcNow` en C#).
- Datos de prueba: además de `AmrProdSeg_Seed.sql`, hay **`AmrProdSeg_SeedDemo.sql`** (8 clientes, pólizas en todos los estados, cobros mixtos, bajas y solicitud de reset) — idempotente.

---

*Última actualización: anulación de pago, eliminación de catálogos, póliza E/T + Nº definitivo, prima OG, rendición con diferencia, solicitante en bajas, finanzas personales, Reportes de 3 tabs, dots de cuotas en Cobranzas y tests de frontend (Vitest/RTL).*
