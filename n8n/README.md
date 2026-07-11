# Agente de WhatsApp AMR (n8n + Evolution + OpenAI)

Atiende por WhatsApp a los clientes de cada instancia de Evolution: informa estado de
póliza, vencimientos, deuda y precio; toma pagos (pendientes de confirmación de un
operador); deriva a un humano para seguros nuevos o pedidos sobre terceros.

Importá `amr-whatsapp-agent.json` en n8n (**Workflows → Import from File**).

---

## Arquitectura (flujo del workflow)

```
Evolution (webhook) ─► Solo entrantes ─► Extraer datos
   └► Buffer push (Redis) ─► Marcar último (Redis) ─► Esperar 8s (debounce)
      └► Leer marca ─► ¿Es el último? ── no ─► (fin, otro mensaje procesa el lote)
                          │ sí
                          ▼
         Leer lote (Redis) ─► Limpiar buffer ─► Agente AMR (OpenAI) ─► Responder (Evolution)
                                                   ├─ OpenAI Chat Model
                                                   ├─ Memoria por contacto (por instancia:telefono)
                                                   └─ Tools: consultar_poliza · registrar_pago · escalar_operador
```

### Manejo por lotes (cliente que manda varios mensajes)
Cada mensaje entrante se **acumula** en una lista Redis (`wa:buf:{instancia}:{telefono}`) y se
graba una **marca** con el id de ejecución (`wa:mark:...`). Después de esperar **8 s**, la ejecución
comprueba si su marca sigue siendo la última: si llegó otro mensaje mientras esperaba, **se corta**
(esa ejecución nueva procesará el lote completo). Así, si el cliente manda 4 mensajes seguidos, el
agente los lee **todos juntos** una sola vez. Ajustá los 8 s en el nodo *Esperar (debounce)*.

---

## Endpoints que necesita en el backend (`/api/bot/...`)

⚠️ **Estos endpoints todavía NO existen en el backend .NET** — hay que crearlos. Todos se
protegen con un header **`X-Bot-Key`** (una clave larga secreta, distinta del JWT de la app).
El agente **nunca** recibe el JWT de un usuario ni puede operar como uno.

### 1. `GET /api/bot/poliza-por-telefono?telefono=549...`
Devuelve SOLO datos seguros del titular cuyo teléfono coincide. **No** incluye prima OG ni
vigencia interna. Si el teléfono no matchea un único cliente → 404 (el agente deriva).

```json
{
  "encontrado": true,
  "numeroPoliza": "679128",
  "estado": "vigente",              // vigente | por_vencer | vencida
  "compania": "La Perseverancia",
  "cobertura": "Responsabilidad Civil",
  "patente": "A132ZOM",
  "proximoVencimiento": "2026-08-01",
  "cuotasAdeudadas": 1,
  "cuotasParaPonerseAlDia": [
    { "numeroCuota": 2, "vencimiento": "2026-07-16", "importe": 55600 }
  ],
  "precioCuota": 55600,
  "precioTotal": 166800
}
```

### 2. `POST /api/bot/registrar-pago`
Deja el pago **PENDIENTE** de confirmación. **No marca la cuota pagada.** Notifica al operador
(por WhatsApp/tablero) para que confirme la recepción del dinero. La cuota se salda recién cuando
el operador confirma (en la app o respondiendo la notificación).

```json
// request
{ "telefono": "549...", "instancia": "amr-oficina", "numeroCuota": 2, "medio": "transferencia" }
// response
{ "ok": true, "estado": "pendiente_confirmacion", "mensaje": "Pago informado. Un operador confirmará la recepción." }
```

### 3. `POST /api/bot/escalar`
Marca la conversación para atención humana y avisa al operador.

```json
{ "telefono": "549...", "instancia": "amr-oficina", "nombre": "Juan", "motivo": "quiere seguro nuevo" }
```

> Recomendado: una tabla `BotConversaciones` (telefono, instancia, estado, motivo, fechas) y una
> `BotPagosPendientes` (telefono, polizaId, cobroId, medio, estado, confirmadoPor). El match por
> teléfono usa `Clientes.Telefono` normalizado a `54 9 + área + número` (misma lógica que
> `EvolutionApiWhatsAppSender.NormalizarTelefono`).

---

## Reglas del agente (ya embebidas en el system prompt)

| Puede | No puede |
|---|---|
| Estado de póliza, vencimiento de cuota | Prima OG (interna) |
| Cuotas adeudadas / cuántas para ponerse al día | Vigencia / período de la póliza |
| Nº póliza, compañía, cobertura, patente | Datos de **otro** cliente/tercero → deriva |
| Precio de la cuota y total | Cotizar seguro nuevo → deriva |
| Registrar pago **pendiente** (tras confirmación del cliente) | Marcar una cuota como pagada por su cuenta |

- **Identidad = número de WhatsApp** del que escribe. Si piden datos de otra persona (nombre/DNI/
  patente ajenos) → `escalar_operador`.
- **Seguro nuevo** → `escalar_operador` (lo atiende un representante).

---

## Configuración en n8n

1. **Credenciales** (reemplazá los `id: "REEMPLAZAR"`):
   - **Redis AMR** → el mismo Redis del stack (`amr-evolution-redis`).
   - **OpenAI AMR** → tu API key de OpenAI.
2. **Variables de entorno de n8n**:
   - `AMR_BOT_KEY` → la clave secreta que valida el backend en `X-Bot-Key`.
   - `EVOLUTION_API_KEY` → la misma `AUTHENTICATION_API_KEY` de Evolution.
3. **Webhook en Evolution** (por cada instancia), apuntando al webhook de este workflow, solo el
   evento `messages.upsert`:
   ```bash
   curl -X POST "https://srv1798610.hstgr.cloud/webhook/set/<instancia>" \
     -H "apikey: $EVOLUTION_API_KEY" -H "Content-Type: application/json" \
     -d '{ "webhook": { "enabled": true, "url": "https://<tu-n8n>/webhook/amr-wa",
           "events": ["MESSAGES_UPSERT"] } }'
   ```
   El workflow es **multi-instancia**: usa `body.instance` para responder por la misma instancia.
4. Activá el workflow. Probá escribiéndole al número de una instancia.

---

## ⚠️ Seguridad y cosas a decidir antes de ir a producción

- **Cobro:** el agente **jamás** confirma que llegó la plata. Solo deja el pago *pendiente* y un
  **operador** confirma la recepción → recién ahí se marca pagado. No cambies esto por
  "auto-confirmar según lo que dice el cliente": es un riesgo contable real.
- **Datos de terceros:** el prompt lo prohíbe, pero la **defensa real está en el backend**:
  `poliza-por-telefono` debe devolver *solo* la póliza del teléfono que consulta, nunca aceptar un
  identificador arbitrario. No confíes solo en el prompt.
- **`X-Bot-Key`** es un secreto: va por variable de entorno, nunca en git.
- **Prima OG / vigencia:** el endpoint NO debe incluir esos campos (que el modelo no pueda filtrarlos
  aunque "quiera"): la mejor protección es no enviarlos nunca al agente.
- **Rate limiting / abuso:** conviene limitar por teléfono en el backend.
- Este JSON es una **plantilla lista para importar**; revisá versiones de nodos y credenciales al
  importar (n8n puede pedir reconectar el modelo/memoria/tools al Agente).
