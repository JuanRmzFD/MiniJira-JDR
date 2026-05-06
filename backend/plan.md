# Plan de implementación — Mini Jira Backend

> **Convención de schema:** `db-schema.yaml` es el mapa de referencia de la base de datos.
> Si una fase agrega o modifica tablas/columnas, actualizar `db-schema.yaml` y re-ejecutar `npm run db:generate` antes de continuar.

## Paso 1 — Instalar dependencias y verificar arranque ✅
```bash
npm install
npm run db:generate
npm run dev
```

**Tablas generadas por Drizzle (SQLite):**

| Tabla | Descripción |
|---|---|
| `ticket_states` | Catálogo de estados: `por_hacer`, `en_progreso`, `listo` |
| `allowed_transitions` | Máquina de estados — transiciones permitidas con flag `admin_only` (PK compuesta) |
| `users` | Usuarios con roles `admin` / `usuario` y `password_hash` para auth local |
| `tickets` | Tickets con `state` FK→`ticket_states`, `creator_id`, `assigned_to`, `archived`, locking por `version` |
| `ticket_labels` | Etiquetas por ticket (PK compuesta `ticket_id`+`label`, `ON DELETE CASCADE`) |
| `state_transitions` | Audit trail de cambios de estado; `from_state = NULL` indica creación inicial |
| `comments` | Comentarios inmutables por ticket (sin `updated_at`) |

_Schema sin cambios en esta fase — `db-schema.yaml` no requiere actualización._

## Paso 2 — Auth (`auth.service.js` + `auth.routes.js`)
Es el bloqueo de todo lo demás. Orden interno:
1. Registrar `GoogleStrategy` en `initPassport()` usando `config.oauth.google`
2. `deserializeUser` → cargar usuario por `id` desde la DB
3. `GET /login` → `passport.authenticate('google', { scope: [...] })`
4. `GET /callback` → validar dominio corporativo, verificar user existe en DB, setear sesión, redirigir
5. `GET /me` → `res.json(req.user)`
6. `POST /logout` → `req.logout()` + destruir sesión

_Schema sin cambios en esta fase — `db-schema.yaml` no requiere actualización._

## Paso 3 — Usuarios (`users.service.js` + `users.routes.js`)
Depende de auth (necesita `requireAdmin`). Orden:
1. `listUsers()` → `db.select().from(users)`
2. `createUser()` → validar dominio, `crypto.randomUUID()`, insertar
3. `changeRole()` → validar que no es el único admin activo → 422
4. `deactivateUser()` → misma validación (MemoryStore no invalida sesiones activas: limitación conocida)
5. `reactivateUser()` → straightforward

_Schema sin cambios en esta fase — `db-schema.yaml` no requiere actualización._

## Paso 4 — Tickets (`tickets.service.js` + `tickets.routes.js`)
El núcleo. Orden:
1. `listTickets()` → filtros + JOIN con users para `assignedTo`/`createdBy` + regla `showArchived`
2. `createTicket()` → `creatorId` desde sesión, `state = 'por_hacer'`, insertar en `state_transitions` (from_state NULL)
3. `getTicket()` → con `stateTransitions[]` y `labels[]` embebidos
4. `updateTicket()` → optimistic locking por `version` → 409
5. `changeState()` → consultar `allowed_transitions`, actualizar `closed_at`, registrar en `state_transitions`, optimistic locking
6. `assignTicket()` / `archiveTicket()` / `restoreTicket()`
7. Gestión de etiquetas: insertar/borrar filas en `ticket_labels`

_Schema sin cambios en esta fase — `db-schema.yaml` no requiere actualización._

## Paso 5 — Comentarios (`comments.service.js` + `comments.routes.js`)
Sencillo, depende de tickets:
1. `listComments(ticketId)` → verificar que el ticket existe, devolver ordenado ASC
2. `createComment()` → `author` desde sesión, parsear `@menciones` para notificaciones

_Schema sin cambios en esta fase — `db-schema.yaml` no requiere actualización._

## Paso 6 — Dashboard y caché (`dashboard.service.js` + `metricsCache.js`)
1. `getMetrics()` → consultar `metricsCache.isStale()`, si stale recalcular y `set()`
2. Queries: `closedByMonth` (últimos 6 meses), `byStatus`, `byAssignee`

_Schema sin cambios en esta fase — `db-schema.yaml` no requiere actualización._

## Paso 7 — Exportación CSV (`exports.service.js` + `exports.routes.js`)
1. Validar `from <= to` y rango ≤ 12 meses → 400
2. `generateCsv('summary' | 'detail', from, to)` con `csv-stringify`
3. Setear `Content-Type: text/csv` y `Content-Disposition`

_Schema sin cambios en esta fase — `db-schema.yaml` no requiere actualización._

## Paso 8 — Notificaciones email (`mailer.js` + integración en services)
El último porque depende de tickets y comentarios:
1. Implementar `sendMail()` completo en `mailer.js`
2. Cola simple en memoria con reintentos (3 intentos, backoff exponencial)
3. Disparar desde `changeState()`, `assignTicket()`, `createComment()` (para `@menciones`)
4. Agrupar eventos < 60s por ticket+destinatario

_Schema sin cambios en esta fase — `db-schema.yaml` no requiere actualización._
