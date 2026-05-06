# API Contract — Mini Jira

**Versión:** 1.0  
**Fecha:** 2026-05-05  
**Base URL:** `http://localhost:3000/api`

---

## Convenciones generales

| Aspecto | Detalle |
|---|---|
| Formato | JSON en body y respuesta |
| Nombres de campos | camelCase |
| Listas | Arrays planos, sin paginación ni envelope |
| Errores | `{ "error": "string" }` |
| Sesión | Cookie httpOnly gestionada por el servidor — el cliente no maneja tokens |

### Códigos HTTP utilizados

| Código | Cuándo |
|---|---|
| `200` | OK |
| `201` | Recurso creado |
| `204` | OK sin body (logout) |
| `400` | Parámetro o body inválido |
| `401` | Sin sesión activa |
| `403` | Sesión activa pero sin permiso |
| `404` | Recurso no encontrado |
| `409` | Conflicto de versión (optimistic locking) |
| `422` | Regla de negocio violada |
| `500` | Error interno |

---

## Tipos y enumeraciones

```
UserRole       = "admin" | "user"
TicketStatus   = "Por hacer" | "En progreso" | "Listo"
TicketPriority = "Baja" | "Media" | "Alta"
```

---

## Shapes de respuesta

### User
```json
{
  "id": "uuid",
  "displayName": "string",
  "email": "string",
  "role": "admin | user",
  "isActive": true,
  "createdAt": "ISO 8601 UTC"
}
```

### Ticket
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "status": "Por hacer | En progreso | Listo",
  "priority": "Baja | Media | Alta | null",
  "assignedTo": { "...User" },
  "labels": ["string"],
  "createdBy": { "...User" },
  "createdAt": "ISO 8601 UTC",
  "closedAt": "ISO 8601 UTC | null",
  "updatedAt": "ISO 8601 UTC",
  "version": 1,
  "isArchived": false
}
```

> `assignedTo` es `null` si no hay asignado. `createdBy` siempre está presente.

### Ticket detalle (solo `GET /tickets/:id`)
Igual que Ticket, más:
```json
{
  "stateTransitions": [
    {
      "id": "uuid",
      "ticketId": "uuid",
      "fromStatus": "Por hacer | En progreso | Listo | null",
      "toStatus": "Por hacer | En progreso | Listo",
      "changedBy": { "...User" },
      "changedAt": "ISO 8601 UTC"
    }
  ]
}
```

> `fromStatus: null` indica la creación inicial del ticket.  
> Array en orden cronológico ascendente.

### Comment
```json
{
  "id": "uuid",
  "ticketId": "uuid",
  "content": "string",
  "author": { "...User" },
  "createdAt": "ISO 8601 UTC"
}
```

### DashboardMetrics
```json
{
  "closedByMonth": [
    { "month": "YYYY-MM", "count": 12 }
  ],
  "byStatus": [
    { "status": "Por hacer | En progreso | Listo", "count": 5 }
  ],
  "byAssignee": [
    { "user": { "...User" }, "count": 3 }
  ],
  "lastRefreshedAt": "ISO 8601 UTC"
}
```

> `closedByMonth`: últimos 6 meses naturales completos.  
> `byAssignee`: solo tickets activos con asignado, ordenado desc por count.  
> El resultado puede tener hasta 15 minutos de cache — usar `lastRefreshedAt` para mostrarlo en UI.

---

## Autenticación

### `GET /auth/login`
Inicia el flujo OAuth. El frontend redirige al navegador a esta URL.

**Respuesta:** `302` → proveedor OAuth (Google Workspace o Azure AD según config).

---

### `GET /auth/callback`
El proveedor redirige aquí. El backend valida y establece la cookie de sesión.

**Redirects del backend al frontend:**

| Condición | Redirect |
|---|---|
| Dominio del email no corporativo | `/login?error=domain_rejected` |
| Email no registrado en el sistema | `403` (debe ser dado de alta por admin) |
| Usuario inactivo | `403` |
| Todo OK | `/board` |

> El frontend no llama a este endpoint directamente — el navegador llega aquí desde el proveedor OAuth.

---

### `GET /auth/me`
Detecta si hay sesión activa. Llamar al cargar la app para saber si el usuario ya está autenticado.

**Sin guard** — retorna 401 si no hay sesión (no redirige).

**200**
```json
{ "...User" }
```

**401**
```json
{ "error": "No hay sesión activa." }
```

---

### `POST /auth/logout`
Destruye la sesión activa. Guard: sesión.

**204** — sin body.

---

## Usuarios

### `GET /users`
Lista todos los usuarios. Guard: sesión.

**200** — `User[]`

---

### `POST /users`
Crea un usuario. Guard: admin.

**Body**
```json
{
  "email": "string",
  "displayName": "string",
  "role": "admin | user"
}
```

**201** — `User` creado.

**422** — si el email no pertenece al dominio corporativo.

---

### `PATCH /users/:id/role`
Cambia el rol de un usuario. Guard: admin.

**Body**
```json
{ "role": "admin | user" }
```

**200** — `User` actualizado.

**422** — si el usuario es el único admin activo y se intenta degradar.

---

### `PATCH /users/:id/deactivate`
Desactiva un usuario. Guard: admin.

**200** — `User` actualizado (`isActive: false`).

**422** — si el usuario es el único admin activo.

---

### `PATCH /users/:id/reactivate`
Reactiva un usuario. Guard: admin.

**200** — `User` actualizado (`isActive: true`).

---

## Tickets

### `GET /tickets`
Lista tickets. Guard: sesión.

**Query params**

| Param | Tipo | Descripción |
|---|---|---|
| `status` | `string \| string[]` | Filtro por estado. Ej: `?status=Por hacer&status=Listo` |
| `priority` | `string \| string[]` | Filtro por prioridad |
| `labels` | `string \| string[]` | Filtro por etiqueta (OR) |
| `assignedToId` | `uuid` | Filtro por usuario asignado |
| `createdFrom` | `YYYY-MM-DD` | Fecha de creación desde (inclusive) |
| `createdTo` | `YYYY-MM-DD` | Fecha de creación hasta (inclusive) |
| `showArchived` | `"true" \| "false"` | Default `"false"`. Con `"true"`: admin ve todos los archivados; usuario solo los propios |

> `showArchived=false` → tickets activos. `showArchived=true` → tickets archivados (no mezcla ambos).

**200** — `Ticket[]`

---

### `POST /tickets`
Crea un ticket. Guard: sesión. `createdBy` se toma de la sesión. Estado inicial siempre `"Por hacer"`.

**Body**
```json
{
  "title": "string (requerido, máx. 150 chars)",
  "description": "string | null",
  "priority": "Baja | Media | Alta | null",
  "assignedToId": "uuid | null",
  "labels": ["string"]
}
```

**201** — `Ticket` completo.

**400** — title vacío, supera 150 chars, o priority/labels con formato inválido.

---

### `GET /tickets/:id`
Detalle de un ticket. Guard: sesión.

**200** — `Ticket` + `stateTransitions[]`.

**404** — ticket no encontrado.

---

### `PATCH /tickets/:id`
Edita `title`, `description`, `priority`, `labels`. Guard: sesión (solo creador o admin).

Requiere `version` del ticket actual para detectar ediciones concurrentes.

**Body**
```json
{
  "title": "string",
  "description": "string | null",
  "priority": "Baja | Media | Alta | null",
  "labels": ["string"],
  "version": 1
}
```

**200** — `Ticket` actualizado.

**403** — el usuario no es creador ni admin.

**409** — `{ "error": "El ticket fue modificado por otro usuario. Recarga para ver los cambios." }`

---

### `PATCH /tickets/:id/status`
Cambia el estado del ticket. Guard: sesión.

**Transiciones permitidas**

| De → A | Quién puede |
|---|---|
| `Por hacer → En progreso` | creador, asignado, admin |
| `En progreso → Listo` | creador, asignado, admin |
| `Listo → En progreso` | **solo admin** |

Cualquier otra combinación → `400`.  
Transición válida pero sin permiso de rol → `403`.

> Al pasar a `Listo`, `closedAt` se setea automáticamente.  
> Al salir de `Listo`, `closedAt` se limpia.

**Body**
```json
{ "status": "Por hacer | En progreso | Listo", "version": 1 }
```

**200** — `Ticket` actualizado.

**409** — versión desactualizada.

---

### `PATCH /tickets/:id/assign`
Asigna o desasigna el ticket. Guard: admin.

**Body**
```json
{ "assignedToId": "uuid | null" }
```

**200** — `Ticket` actualizado.

---

### `POST /tickets/:id/archive`
Archiva el ticket. Guard: sesión (solo creador o admin).

**200** — `Ticket` actualizado (`isArchived: true`).

---

### `POST /tickets/:id/restore`
Restaura un ticket archivado. Guard: admin.

**200** — `Ticket` actualizado (`isArchived: false`).

---

## Comentarios

### `GET /tickets/:ticketId/comments`
Lista comentarios del ticket. Guard: sesión.

**200** — `Comment[]` en orden cronológico ascendente.

---

### `POST /tickets/:ticketId/comments`
Crea un comentario. Guard: sesión. `author` se toma de la sesión.

**Body**
```json
{ "content": "string (requerido, no vacío)" }
```

**201** — `Comment`.

**400** — content vacío o ausente.

---

## Dashboard

### `GET /dashboard/metrics`
Métricas agregadas. Guard: sesión.

**200** — `DashboardMetrics` (puede estar cacheado hasta 15 minutos).

---

## Exportación

### `GET /exports/metrics`
Genera y descarga un CSV. Guard: sesión.

**Query params**

| Param | Tipo | Requerido | Descripción |
|---|---|---|---|
| `type` | `"summary" \| "detail"` | sí | Tipo de reporte |
| `from` | `YYYY-MM` | sí | Mes inicio (inclusive) |
| `to` | `YYYY-MM` | sí | Mes fin (inclusive) |

Restricciones: `from ≤ to`, rango máximo 12 meses.

**200**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="export-{type}-{from}-{to}.csv"
```

Columnas **summary**: `month`, `closedCount`, `openCount`, `inProgressCount`

Columnas **detail**: `id`, `title`, `status`, `priority`, `createdBy`, `assignedTo`, `labels`, `createdAt`, `closedAt`

> Si no hay datos, el CSV contiene solo la fila de cabeceras.

**400** — params ausentes, `from > to`, o rango mayor a 12 meses.

---

## Optimistic locking

Los endpoints `PATCH /tickets/:id` y `PATCH /tickets/:id/status` usan `version` para control de concurrencia.

**Flujo esperado en el frontend:**
1. Leer el ticket → guardar `version`.
2. Enviar el PATCH incluyendo ese `version`.
3. Si el backend responde `409`, notificar al usuario y recargar el ticket antes de reintentar.

---

## Visibilidad de archivados

| Rol | `showArchived=false` | `showArchived=true` |
|---|---|---|
| admin | Todos los activos | Todos los archivados |
| user | Todos los activos | Solo los propios archivados (`createdBy = yo`) |

---

## Notas de implementación para el frontend

- **Cookie de sesión**: el navegador la envía automáticamente — no se necesita header `Authorization`.
- **CSRF**: no aplica en este stack (MemoryStore + cookie httpOnly, sin SameSite issues en desarrollo).
- **`/auth/me` al arrancar**: llamar una vez para saber el usuario en sesión. `401` significa que hay que redirigir a `/login`.
- **Roles en UI**: `req.user.role === "admin"` habilita acciones como asignar, restaurar, transición `Listo → En progreso`, gestión de usuarios.
- **`version` en formularios de edición**: guardarlo desde el GET y reenviarlo en el PATCH. Si llega un `409`, descartar el formulario y recargar los datos.
- **Export CSV**: usar `window.location` o un `<a download>` — no `fetch`, ya que la respuesta es un stream de archivo.
