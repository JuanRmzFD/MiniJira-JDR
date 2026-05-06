# Backend Spec — Mini Jira

**Versión:** 1.1
**Fecha:** 2026-05-04
**Basado en:** frontend-specs.md v1.1

---

## Stack

| Capa | Tecnología |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| ORM | Drizzle ORM |
| Base de datos | SQLite |
| Sesiones | express-session con MemoryStore (desarrollo) |
| Autenticación | OAuth 2.0 (Google Workspace o Azure AD, configurable por variables de entorno) |

---

## Roles

| Rol | Permisos clave |
|---|---|
| `admin` | Crea usuarios, realiza transiciones `admin_only`, gestiona roles y estados de cuenta |
| `user` | Opera sobre tickets y comentarios; transiciones de avance de estado |

No existe auto-registro. Solo un `admin` puede crear nuevos usuarios.

---

## Convenciones de API

- **Base path**: `/api`
- **Formato de respuesta**: JSON directo (sin envelope `{ data, meta }`)
- **Listas**: arrays JSON planos; sin paginación en esta versión
- **Errores**: `{ "error": "string", "details"?: any }`
- **Códigos HTTP**: 200, 201, 204, 400, 401, 403, 404, 409, 422, 500
- **Nombres de campos**: camelCase en todos los cuerpos JSON de request y response

---

## Modelo de datos

### Enums

```
TicketStatus   = 'Por hacer' | 'En progreso' | 'Listo'
TicketPriority = 'Baja' | 'Media' | 'Alta'
UserRole       = 'admin' | 'user'
```

### Entidades JSON de respuesta

**User**
```json
{
  "id": "uuid",
  "displayName": "string",
  "email": "string",
  "role": "admin|user",
  "isActive": true,
  "createdAt": "ISO 8601 UTC"
}
```

**Ticket** (en listados y mutaciones)
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string|null",
  "status": "Por hacer|En progreso|Listo",
  "priority": "Baja|Media|Alta|null",
  "assignedTo": { "...User" } | null,
  "labels": ["string"],
  "createdBy": { "...User" },
  "createdAt": "ISO 8601 UTC",
  "closedAt": "ISO 8601 UTC|null",
  "updatedAt": "ISO 8601 UTC",
  "version": "number",
  "isArchived": "boolean"
}
```

**Ticket detalle** (`GET /api/tickets/:id`) — igual que Ticket más:
```json
{
  "stateTransitions": [
    {
      "id": "uuid",
      "ticketId": "uuid",
      "fromStatus": "Por hacer|En progreso|Listo|null",
      "toStatus": "Por hacer|En progreso|Listo",
      "changedBy": { "...User" },
      "changedAt": "ISO 8601 UTC"
    }
  ]
}
```

**Comment**
```json
{
  "id": "uuid",
  "ticketId": "uuid",
  "content": "string",
  "author": { "...User" },
  "createdAt": "ISO 8601 UTC"
}
```

**DashboardMetrics**
```json
{
  "closedByMonth": [{ "month": "YYYY-MM", "count": "number" }],
  "byStatus": [{ "status": "TicketStatus", "count": "number" }],
  "byAssignee": [{ "user": { "...User" }, "count": "number" }],
  "lastRefreshedAt": "ISO 8601 UTC"
}
```

---

## Autenticación

### `GET /api/auth/login`
Inicia el flujo OAuth redirigiendo al proveedor configurado (Google Workspace o Azure AD). Sin body.

**Respuesta**: `302 Redirect` al proveedor OAuth.

### `GET /api/auth/callback`
Callback OAuth. El backend valida el código de autorización, crea o actualiza la sesión y redirige al frontend.

Lógica:
- Si el dominio del email no es el corporativo configurado → redirige a `/login?error=domain_rejected`.
- Si el usuario no existe en la base de datos → 403 (debe ser creado por un admin).
- Si `isActive = false` → 403.
- Si todo es válido → establece cookie de sesión y redirige a `/board`.

### `GET /api/auth/me`
Devuelve el usuario de la sesión activa. Sin guard de sesión (el frontend lo usa para detectar si hay sesión).

**Respuesta 200** — objeto User.

**Respuesta 401** — si no hay sesión activa.

### `POST /api/auth/logout`
Destruye la sesión activa. Guard: sesión.

**Respuesta 204** — sin body.

---

## Usuarios

### `GET /api/users`
Lista todos los usuarios. Guard: sesión.

**Respuesta 200** — `User[]`

### `POST /api/users`
Crea un usuario. Guard: admin.

El backend valida que el email pertenezca al dominio corporativo configurado → 422 si no.

**Body**
```json
{ "email": "string", "displayName": "string", "role": "admin|user" }
```

**Respuesta 201** — objeto User creado.

### `PATCH /api/users/:id/role`
Cambia el rol de un usuario. Guard: admin.

Si el usuario a degradar es el único `admin` activo → 422.

**Body**
```json
{ "role": "admin|user" }
```

**Respuesta 200** — objeto User actualizado.

### `PATCH /api/users/:id/deactivate`
Desactiva un usuario (`isActive = false`). Guard: admin.

Si el usuario es el único `admin` activo → 422.

**Respuesta 200** — objeto User actualizado.

### `PATCH /api/users/:id/reactivate`
Reactiva un usuario (`isActive = true`). Guard: admin.

**Respuesta 200** — objeto User actualizado.

---

## Tickets

### `GET /api/tickets`
Lista tickets. Guard: sesión.

**Query params**

| Param | Tipo | Descripción |
|-------|------|-------------|
| `status` | `string[]` | Filtro multi-valor por estado |
| `priority` | `string[]` | Filtro multi-valor por prioridad |
| `labels` | `string[]` | Filtro multi-valor por etiqueta |
| `assignedToId` | `string` (UUID) | Filtro por usuario asignado |
| `createdFrom` | `string` (YYYY-MM-DD) | Fecha de creación desde (inclusive) |
| `createdTo` | `string` (YYYY-MM-DD) | Fecha de creación hasta (inclusive) |
| `showArchived` | `boolean` | Default `false`. Con `true`: admin ve todos los archivados; user ve solo sus propios archivados |

**Respuesta 200** — `Ticket[]` (con `assignedTo` y `createdBy` embebidos como User)

### `POST /api/tickets`
Crea un ticket. Guard: sesión. `createdBy` se toma de la sesión. Estado inicial: `'Por hacer'`.

**Body**
```json
{
  "title": "string (máx. 150 chars, requerido)",
  "description": "string|null",
  "priority": "Baja|Media|Alta|null",
  "assignedToId": "uuid|null",
  "labels": ["string"]
}
```

**Respuesta 201** — objeto Ticket completo.

### `GET /api/tickets/:id`
Detalle de un ticket. Guard: sesión.

**Respuesta 200** — objeto Ticket con `stateTransitions: StateTransition[]` (cronológico ascendente).

### `PATCH /api/tickets/:id`
Edita `title`, `description`, `priority`, `labels`. Guard: sesión (solo creador o admin).

Requiere `version` para optimistic locking. Si `version` no coincide → 409.

**Body**
```json
{
  "title": "string",
  "description": "string|null",
  "priority": "Baja|Media|Alta|null",
  "labels": ["string"],
  "version": "number"
}
```

**Respuesta 200** — objeto Ticket actualizado.

**Respuesta 403** — si el usuario no es creador ni admin.

**Respuesta 409** — `{ "error": "El ticket fue modificado por otro usuario. Recarga para ver los cambios." }`

### `PATCH /api/tickets/:id/status`
Cambia el estado del ticket. Guard: sesión.

**Transiciones permitidas**

| Transición | Quién puede |
|---|---|
| `'Por hacer' → 'En progreso'` | creador, asignado, admin |
| `'En progreso' → 'Listo'` | creador, asignado, admin |
| `'Listo' → 'En progreso'` | solo admin |

- Cualquier otra transición → 400.
- Transición no permitida para el rol → 403.
- Al pasar a `'Listo'`: setea `closedAt` automáticamente.
- Al salir de `'Listo'`: limpia `closedAt`.
- Registra entrada en `stateTransitions`.
- Requiere `version` para optimistic locking → 409 si no coincide.

**Body**
```json
{ "status": "Por hacer|En progreso|Listo", "version": "number" }
```

**Respuesta 200** — objeto Ticket actualizado.

### `PATCH /api/tickets/:id/assign`
Asigna o desasigna el ticket. Guard: admin.

**Body**
```json
{ "assignedToId": "uuid|null" }
```

**Respuesta 200** — objeto Ticket actualizado.

### `POST /api/tickets/:id/archive`
Archiva el ticket (`isArchived = true`). Guard: sesión (solo creador o admin).

**Respuesta 200** — objeto Ticket actualizado.

### `POST /api/tickets/:id/restore`
Restaura un ticket archivado (`isArchived = false`). Guard: admin.

**Respuesta 200** — objeto Ticket actualizado.

---

## Comentarios

### `GET /api/tickets/:id/comments`
Lista comentarios de un ticket. Guard: sesión.

**Respuesta 200** — `Comment[]` (cronológico ascendente)

### `POST /api/tickets/:id/comments`
Crea un comentario. Guard: sesión. `author` se toma de la sesión.

**Body**
```json
{ "content": "string (requerido, no vacío)" }
```

**Respuesta 201** — objeto Comment.

---

## Dashboard

### `GET /api/dashboard/metrics`
Métricas agregadas. Guard: sesión.

El resultado puede estar cacheado en memoria hasta 15 minutos (alineado con `staleTime` del frontend). `lastRefreshedAt` indica el timestamp del último cálculo real.

**Respuesta 200** — objeto DashboardMetrics:
- `closedByMonth`: tickets con `closedAt` en cada uno de los últimos 6 meses naturales completos.
- `byStatus`: conteo de tickets activos (no archivados) agrupado por estado.
- `byAssignee`: conteo de tickets activos con asignado, agrupado por usuario, ordenado desc por conteo.

---

## Exportación

### `GET /api/exports/metrics`
Genera y descarga un CSV. Guard: sesión.

**Query params**

| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `type` | `'summary' \| 'detail'` | sí | Tipo de exportación |
| `from` | `string` (YYYY-MM) | sí | Mes de inicio (inclusive) |
| `to` | `string` (YYYY-MM) | sí | Mes de fin (inclusive) |

Restricciones: `from <= to`; rango máximo 12 meses → 400 si se incumple.

**Respuesta 200**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="export-{type}-{from}-{to}.csv"`
- Body: CSV con fila de cabeceras siempre presente. Si no hay datos de contenido, el body contiene solo la fila de cabeceras.

**Columnas CSV `summary`**: `month`, `closedCount`, `openCount`, `inProgressCount`

**Columnas CSV `detail`**: `id`, `title`, `status`, `priority`, `createdBy`, `assignedTo`, `labels`, `createdAt`, `closedAt`

---

## Reglas de negocio

| Regla | Descripción |
|---|---|
| Optimistic locking | `PATCH /tickets/:id` y `PATCH /tickets/:id/status` rechazan con 409 si `version` del body no coincide con el valor en la fila |
| Máquina de estados fija | Solo 3 estados: `'Por hacer'`, `'En progreso'`, `'Listo'`. No hay CRUD de estados |
| Transiciones admin_only | `'Listo' → 'En progreso'` requiere `role = 'admin'` → 403 si no |
| `closedAt` | Se setea automáticamente al entrar en `'Listo'`; se limpia al salir de `'Listo'` |
| Borrado lógico | Los tickets no se eliminan; se archivan con `isArchived = true` |
| `createdBy` | Se asigna desde la sesión al crear el ticket; inmutable |
| `author` (comentario) | Se asigna desde la sesión al crear el comentario; inmutable |
| Admin único | No se puede degradar ni desactivar al único `admin` activo → 422 |
| Visibilidad archivados | `showArchived=true`: admin ve todos; user ve solo sus propios (`createdBy = session.user`) |
| Dominio corporativo | Solo emails del dominio configurado (variable de entorno) pueden autenticarse o ser creados |
| Sesiones | MemoryStore de express-session; solo para entorno de desarrollo |
