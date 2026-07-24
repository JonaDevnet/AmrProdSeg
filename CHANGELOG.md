# Changelog

Todas las modificaciones relevantes de AMR Producción de Seguros.
Formato basado en [Keep a Changelog](https://keepachangelog.com/) y versionado semántico
(`MAJOR.MINOR.PATCH`).

## [1.1.0] — sin desplegar

Gran tanda de features, mejoras y correcciones. Requiere aplicar el schema (§48–§61) y
rebuild de back + front (`bash actualizar.sh`).

### Añadido
- **Recordatorio de cuota VENCIDA** (§62): además del aviso "por vencer", ahora se avisa cuando
  una cuota impaga de una póliza activa **ya venció** (N días después, config `DiasVencida`), para
  que el cliente regularice y **no pierda la cobertura**. Idempotente y sin envío masivo histórico.
- **Refacturación / renovación** de pólizas: dentro del período de vigencia las cuotas se
  renuevan continuando el patrón (última cuota + 1 mes, fecha bloqueada, hereda la vigencia);
  al terminar el período se renueva con fecha nueva. Preview de las cuotas resultantes.
- **clientes/id**: sección **Historial de pólizas** (vencidas / renovadas / canceladas) separada
  de las **activas**. Botón **Pagar** en cada card que lleva a la póliza y, tras cobrar, vuelve a
  la ficha con un **cartel de cuenta regresiva** (3 s). **Exportar PDF** de la ficha completa
  (datos + vehículos + todas las pólizas con su estado), que se abre en el visor.
- **/polizas**: buscador con **campo obligatorio** (número/cliente/patente), búsqueda real en
  backend, paginada y con debounce; **exportar** por póliza (cliente + póliza + vehículo);
  accesible desde el menú de usuario. **Aviso a administradores** en la campanita cuando alguien
  exporta (§60).
- **Bloqueo geográfico** (solo Argentina) vía ipquery.io: middleware cacheado y fail-open.
- **Headers de seguridad** en Traefik (CSP report-only, HSTS, X-Content-Type-Options,
  X-Frame-Options, Referrer-Policy).
- **Backend del bot de WhatsApp** (§57): endpoints `/api/bot` (consulta por teléfono, pago
  pendiente, escalación) con auth por `X-Bot-Key`. Workflow de n8n + docs.
- **Script de backup** (`backup.sh`) independiente: BACKUP + verificación + copia al host +
  rotación + off-site opcional (rclone/rsync).
- Prima OG + diferencia opcional en la exportación de "Hechos del día".
- Marca y modelo del vehículo en la card de Cobranzas (§56).

### Cambiado
- **Campanita**: botón **"Limpiar todo"** en la cabecera que descarta vencimientos + exportaciones
  de una (en vez de limpiar apartado por apartado). Las solicitudes de anulación/eliminación no se
  descartan (son tareas de Aceptar/Rechazar).
- **Texto del recordatorio de cuota por vencer**: ahora incluye "Aboná antes del vencimiento para
  mantener tu cobertura activa".
- **Modelo de cuotas "inicio de póliza"**: la 1ª cuota vence 1 mes después del inicio y las
  siguientes +1 mes; al editar el inicio se re-fechan todas (incl. pagadas, solo la fecha) (§55).
- **Buscador global (navbar)**: por número muestra la póliza **activa**; si no hay activa,
  la cancelada/baja (§59).
- **Comprobante**: muestra el vencimiento de **su propia** cuota (etiqueta "Vencimiento");
  nombre del PDF `{recibo}-{patente}-{fecha}.pdf`.
- **Búsqueda de /polizas** optimizada: índices `IX_Polizas_Numero` e `IX_Clientes_Nombre`;
  SQL dinámico parametrizado (prefijo con index seek en número/patente) (§61).
- Navbar: logo pegado a la orilla; espacio sobre los botones "Volver".
- `Microsoft.OpenApi` fijado a 2.10.0 (vuln. alta) y `KnownNetworks` → `KnownIPNetworks`.

### Corregido
- **Coberturas/ramos/métodos**: recargar un nombre eliminado ya no rompe (reactiva) (§58).
- **Vehículo "colgado"**: al reutilizar un vehículo en un alta se reasigna al cliente de la
  nueva póliza; ya no queda "sin vehículo asociado" (§54).
- **Fecha de pago**: se registra en horario local (Argentina), no en UTC (ya no adelantaba el día).
- **Envío por WhatsApp**: en vez de 500 opaco, mensaje claro con el detalle de Evolution.
- **Vigencia desincronizada** entre clientes/id y cobranzas: se invalida la caché de la póliza
  al editar.
- **Card de clientes/id**: muestra la cuota **actual** (última pagada) en vez de la próxima.
- **Login**: franja blanca en resoluciones con `zoom` (compensación de `100vh`).

## [1.0.0]

Versión base en producción (línea de partida del changelog).

[1.1.0]: #
[1.0.0]: #
