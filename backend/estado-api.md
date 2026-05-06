# Estado de la API — MiniJira Backend

## Completado

### Infraestructura base
- `src/app.js` — Express con CORS, session, Passport, JSON middleware y error handler
- `src/server.js` — Arranque del servidor
- `src/config/index.js` — Variables de entorno centralizadas (`corsOrigin`, `frontendUrl` añadidos)
- `src/db/schema.ts` — Esquema Drizzle completo y sincronizado con la BD
- `src/db/client.js` — Cliente libsql/Drizzle
- `src/db/migrate.js` — Runner de migraciones
- `src/middleware/requireSession.js` — Guard de sesión activa
- `src/middleware/requireAdmin.js` — Guard de rol admin
- `src/middleware/errorHandler.js` — Manejador global de errores
- `src/lib/mailer.js` — Configuración Nodemailer
- `src/lib/metricsCache.js` — Cache en memoria para métricas del dashboard (TTL configurable)

### Servicios implementados

#### `auth.service.js` ✅
- [x] Estrategia Google OAuth (passport-google-oauth20) con `hd` para dominio corporativo
- [x] `deserializeUser` — lookup real en BD
- [x] Upsert de `displayName` en callback de OAuth
- [x] Validación: dominio no corporativo → `domain_rejected`; email no registrado → `not_registered`; usuario inactivo → `inactive`

#### `users.service.js` ✅
- [x] `listUsers` — todos los usuarios ordenados por `createdAt`
- [x] `createUser` — alta manual con validación de dominio corporativo y email único
- [x] `changeRole` — cambio de rol con guard "último admin activo"
- [x] `deactivateUser` — desactivación con guard "último admin activo"
- [x] `reactivateUser`

#### `tickets.service.js` ✅
- [x] `listTickets` — filtros por estado, prioridad, labels (OR), asignado, rango de fechas, archivados
- [x] `createTicket` — inserta + registra transición inicial en `state_transitions`
- [x] `getTicket` — detalle con labels, usuario embebido y `history` (transiciones con usuario embebido)
- [x] `updateTicket` — edición de title/description/priority/labels con optimistic locking (`version`)
- [x] `changeStatus` — validación via tabla `allowed_transitions`, guard `adminOnly`, optimistic locking
- [x] `assignTicket`
- [x] `archiveTicket` — guard creador o admin
- [x] `restoreTicket`

#### `comments.service.js` ✅
- [x] `listComments` — ordenados por `createdAt` ASC con autor embebido
- [x] `createComment` — con validación de contenido no vacío

#### `dashboard.service.js` ✅
- [x] `getMetrics` — `closedByMonth` (últimos 6 meses), `byStatus` (tickets activos), `byAssignee` (desc por count); integrado con `metricsCache`

#### `exports.service.js` ✅
- [x] `generateCsv` — summary (month/closedCount/openCount/inProgressCount) y detail (todos los campos); validación de rango max 12 meses

### Rutas cableadas ✅

Todos los endpoints están declarados, protegidos con los middlewares correctos y conectados a sus servicios:

| Método | Ruta | Guard | Servicio |
|--------|------|-------|---------|
| GET | `/api/auth/login` | — | passport.authenticate google |
| GET | `/api/auth/callback` | — | passport callback custom |
| GET | `/api/auth/me` | session | `req.user` directo |
| POST | `/api/auth/logout` | session | `req.logout()` |
| GET | `/api/users` | session | `listUsers` |
| POST | `/api/users` | admin | `createUser` |
| PATCH | `/api/users/:id/role` | admin | `changeRole` |
| PATCH | `/api/users/:id/deactivate` | admin | `deactivateUser` |
| PATCH | `/api/users/:id/reactivate` | admin | `reactivateUser` |
| GET | `/api/tickets` | session | `listTickets` |
| POST | `/api/tickets` | session | `createTicket` |
| GET | `/api/tickets/:id` | session | `getTicket` |
| PATCH | `/api/tickets/:id` | session | `updateTicket` |
| PATCH | `/api/tickets/:id/status` | session | `changeStatus` |
| PATCH | `/api/tickets/:id/assign` | admin | `assignTicket` |
| POST | `/api/tickets/:id/archive` | session | `archiveTicket` |
| POST | `/api/tickets/:id/restore` | admin | `restoreTicket` |
| GET | `/api/tickets/:ticketId/comments` | session | `listComments` |
| POST | `/api/tickets/:ticketId/comments` | session | `createComment` |
| GET | `/api/dashboard/metrics` | session | `getMetrics` |
| GET | `/api/exports/metrics` | session | `generateCsv` |

---

## Pendiente

### Variables de entorno requeridas en producción
- `SESSION_SECRET` — requerido
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth Google
- `GOOGLE_HOSTED_DOMAIN` — restricción de dominio corporativo
- `OAUTH_CALLBACK_URL` — URL de callback en producción
- `CORS_ORIGIN` — origen del frontend en producción (default: `http://localhost:5173`)
- `FRONTEND_URL` — URL del frontend para redirects OAuth (default: `http://localhost:5173`)
- `DATABASE_URL` — ruta a la BD SQLite (default: `./data/minijira.db`)

### Nota de implementación
- `GET /api/tickets/:id` devuelve el campo `history` (no `stateTransitions` como indica el contrato)
  para mantener compatibilidad con el tipo `TicketDetail` del frontend.
