# Frontend Specs — Mini Jira MVP

**Versión:** 1.1  
**Fecha:** 2026-05-04  
**Basado en:** spec.md v0.2, backlog.md, mermaid_design_js.md  
**Estado:** Frontend implementado — pendiente de backend

---

## 1. Stack y versiones

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | React | 18.x |
| Lenguaje | TypeScript | 5.x |
| Bundler | Vite | 5.x |
| Estilos | Tailwind CSS | 3.x |
| Componentes UI | shadcn/ui | latest (CLI-managed) |
| Routing | React Router | 6.x |
| Server state / caché | TanStack Query | 5.x |
| Estado global cliente | Zustand | 4.x |
| Formularios | react-hook-form | 7.x |
| Validación | zod | 3.x |
| Gráficas | @tremor/react | 3.x |
| Drag-and-drop | @hello-pangea/dnd | latest |
| Markdown preview | react-markdown + remark-gfm | 9.x / 4.x |
| Toasts | sonner | 1.x (via shadcn/ui) |
| Iconos | lucide-react | latest (via shadcn/ui) |
| Fechas | date-fns | 3.x |
| Tests unitarios | Vitest + @testing-library/react | 1.x |
| Tests e2e | Playwright | 1.x |

> Viewport mínimo soportado: **1024 px** (solo escritorio). No se diseñan breakpoints para móvil o tablet.

---

## 2. Dependencias

### Runtime

| Paquete | Uso |
|---------|-----|
| `react`, `react-dom` | UI framework |
| `react-router-dom` | Routing SPA |
| `@tanstack/react-query` | Caché, fetching, loading/error states |
| `zustand` | Estado global del cliente (sesión, filtros) |
| `react-hook-form` | Gestión de formularios |
| `zod` | Validación de esquemas de formulario |
| `@hookform/resolvers` | Bridge zod ↔ react-hook-form |
| `@tremor/react` | Componentes de gráficas (BarChart, DonutChart, BarList) |
| `react-markdown` | Render de Markdown en la pestaña Preview |
| `remark-gfm` | Soporte de GFM (tablas, tachado, etc.) en react-markdown |
| `sonner` | Sistema de toasts |
| `lucide-react` | Iconos |
| `date-fns` | Formateo de fechas, cálculo de distancias relativas |
| `react-day-picker` | Componente Calendar (DateRangePicker en filtros) |
| `clsx`, `tailwind-merge` | Utilidades de composición de clases CSS |
| `class-variance-authority` | Variantes de componentes (base de shadcn/ui) |
| `@radix-ui/*` | Primitivos accesibles (base de shadcn/ui) |
| `@hello-pangea/dnd` | Drag-and-drop del tablero Kanban |

### Dev

| Paquete | Uso |
|---------|-----|
| `typescript` | Compilador |
| `vite`, `@vitejs/plugin-react` | Bundler + plugin React |
| `tailwindcss`, `autoprefixer`, `postcss` | Pipeline de estilos |
| `vitest`, `jsdom` | Runner de tests unitarios |
| `@testing-library/react`, `@testing-library/user-event` | Utilidades de tests unitarios |
| `@playwright/test` | Tests e2e |
| `@tanstack/react-query-devtools` | Devtools de TanStack Query (solo dev) |
| `eslint`, `@typescript-eslint/*`, `eslint-plugin-react-hooks` | Linting |
| `prettier` | Formateo de código |

---

## 3. Modelo de datos

Tipos TypeScript que el frontend consume de la API REST. No son código de producción; definen el contrato entre cliente y servidor.

### 3.1 Enums

```
TicketStatus  = 'Por hacer' | 'En progreso' | 'Listo'
TicketPriority = 'Baja' | 'Media' | 'Alta'
UserRole      = 'admin' | 'user'
ExportType    = 'summary' | 'detail'
```

### 3.2 Entidades de API

**User**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | string (UUID) | |
| displayName | string | |
| email | string | |
| role | UserRole | |
| isActive | boolean | |
| createdAt | string (ISO 8601 UTC) | |

**Ticket**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | string (UUID) | |
| title | string | máx. 150 chars |
| description | string \| null | texto plano Markdown |
| status | TicketStatus | |
| priority | TicketPriority \| null | |
| assignedTo | User \| null | null = sin asignar |
| labels | string[] | |
| createdBy | User | inmutable |
| createdAt | string (ISO 8601 UTC) | inmutable |
| closedAt | string \| null (ISO 8601 UTC) | automático al pasar a 'Listo' |
| updatedAt | string (ISO 8601 UTC) | |
| version | number | optimistic locking; siempre incluir en mutaciones |
| isArchived | boolean | |

**Comment**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | string (UUID) | |
| ticketId | string | |
| content | string | texto plano, puede contener @displayName |
| author | User | |
| createdAt | string (ISO 8601 UTC) | inmutable |

**StateTransition**
| Campo | Tipo | Notas |
|-------|------|-------|
| id | string (UUID) | |
| ticketId | string | |
| fromStatus | TicketStatus \| null | null en la creación inicial |
| toStatus | TicketStatus | |
| changedBy | User | |
| changedAt | string (ISO 8601 UTC) | |

**DashboardMetrics**
| Campo | Tipo | Notas |
|-------|------|-------|
| closedByMonth | `{ month: string; count: number }[]` | month = 'YYYY-MM', últimos 6 meses |
| byStatus | `{ status: TicketStatus; count: number }[]` | tickets activos actuales |
| byAssignee | `{ user: User; count: number }[]` | ordenado desc por count |
| lastRefreshedAt | string (ISO 8601 UTC) | timestamp del último refresco del caché |

### 3.3 Estado global (Zustand)

**sessionStore** — usuario en sesión activa
```
user: User | null
setUser(user: User): void
clearUser(): void
```

**filtersStore** — estado del tablero
```
filters: {
  status:       TicketStatus[]
  priority:     TicketPriority[]
  labels:       string[]
  assignedToId: string | null   // userId
  createdFrom:  string | null   // 'YYYY-MM-DD'
  createdTo:    string | null   // 'YYYY-MM-DD'
  showArchived: boolean
}
activeView: 'kanban' | 'list'
setFilter(partial: Partial<filters>): void
resetFilters(): void
setActiveView(view: 'kanban' | 'list'): void
```

### 3.4 Configuración de QueryClient

```
defaultOptions:
  queries:
    retry: 1
    staleTime: 60_000        // 1 minuto (default)
    refetchOnWindowFocus: true
  mutations:
    retry: 0
```

Overrides por hook:

| Hook | staleTime | retry |
|------|-----------|-------|
| useSession | Infinity | false |
| useDashboardMetrics | 15 × 60 × 1000 (15 min) | 1 |
| useUsers | 5 × 60 × 1000 (5 min) | 1 |

---

## 4. Arquitectura de componentes

### 4.1 Rutas (React Router v6)

| Ruta | Componente | Guard |
|------|-----------|-------|
| `/login` | LoginPage | Público; redirige a /board si ya hay sesión |
| `/` | `<Navigate to="/board" />` | AuthGuard |
| `/board` | BoardPage | AuthGuard |
| `/dashboard` | DashboardPage | AuthGuard |
| `/admin/users` | AdminUsersPage | AuthGuard + AdminGuard |
| `*` | `<Navigate to="/board" />` | — |

### 4.2 Guards y Layout global

**AuthGuard**  
Envuelve todas las rutas protegidas. Al montar, llama `useSession` (GET /api/auth/me). Si la respuesta es 401 → redirige a `/login`.

**AdminGuard**  
Envuelve `/admin/users`. Si `sessionStore.user.role !== 'admin'` → redirige a `/board`.

**AppLayout**
```
AppLayout
├── Sidebar
│   ├── Logo (icono Kanban + "Mini Jira" + team name del usuario en sesión)
│   ├── Nav items: [Dashboard] [Board] [Tasks (deshabilitado)] [Settings (deshabilitado)]
│   ├── Button "Help Center"
│   └── Button "+ New Project"
├── <main> con <Outlet />
└── ViewportWarning (banner fijo en la parte inferior si viewport < 1024 px)
```

### 4.3 LoginPage

```
LoginPage
└── Card centrado en pantalla
    ├── Logo / nombre "Mini Jira"
    ├── Descripción: "Herramienta interna de gestión de tickets"
    ├── Button "Iniciar sesión con cuenta corporativa"
    │   └── href → GET /api/auth/login  (backend inicia flujo OAuth)
    └── Alert de error (visible si ?error=domain_rejected en la URL)
        └── "Debes usar una cuenta del dominio corporativo para acceder."
```

El proveedor OAuth (Google Workspace o Azure AD) se configura exclusivamente en el backend vía variables de entorno. El botón no muestra logo específico de proveedor.

### 4.4 BoardPage

```
BoardPage
├── PageHeader
│   ├── Título "Tablero"
│   ├── ViewToggle (Kanban | Lista)
│   └── Button "Nuevo ticket" → abre CreateTicketModal
├── FilterBar
│   ├── MultiSelect "Estado"         (Por hacer / En progreso / Listo)
│   ├── MultiSelect "Prioridad"      (Baja / Media / Alta)
│   ├── MultiSelect "Etiquetas"      (valores únicos del servidor)
│   ├── Select "Asignado a"          (usuarios activos + "Sin asignar")
│   ├── DateRangePicker "Creación"   (from / to con día de precisión)
│   └── Switch "Mostrar archivados"  (ver §6.6 para regla de visibilidad)
├── [activeView === 'kanban'] KanbanBoard (DragDropContext de @hello-pangea/dnd)
│   ├── KanbanColumn "TO DO" (Por hacer)
│   │   ├── Badge contador + labels en mayúsculas con tracking
│   │   ├── TaskCard[] → click → TicketModal (cada una es un Draggable)
│   │   └── Button "+ Add task"
│   ├── KanbanColumn "IN PROGRESS" (En progreso)
│   │   └── TaskCard[]
│   └── KanbanColumn "DONE" (Listo)
│       └── TaskCard[]
└── [activeView === 'list'] TicketListView
    └── DataTable (@tanstack/react-table)
        └── columnas: #ID, Título, Estado, Prioridad, Asignado a, Creado por, Fecha creación
```

**TaskCard** (Kanban) — muestra: `PriorityChip`, ícono drag handle (visible en hover), título (máx. 2 líneas), `TagChip[]` (máx. 2 + badge de overflow), ícono de comentarios con conteo, fecha relativa de cierre (si estado = Listo), avatar del asignado.

**Drag-and-drop (`KanbanBoard.onDragEnd`):** las transiciones inversas (`Listo → En progreso`) requieren `role === 'admin'`; si no, toast de error y el drag se descarta. Se aplica actualización optimista via `queryClient.setQueryData`; en `onError` se invalida la query para revertir.

### 4.5 TicketModal (shadcn Dialog)

El modal tiene dos modos: **lectura** y **edición**. El modo edición reemplaza in-place los campos editables sin abrir otro modal.

```
TicketModal
├── Header
│   ├── ID del ticket (ej. "#42")
│   └── Título (texto en modo lectura; Input en modo edición)
├── StatusTransitionButtons (ver árbol en §4.5.1)
├── [modo lectura]
│   ├── Descripción → react-markdown render
│   ├── Prioridad (badge de color)
│   ├── Asignado a (avatar + displayName, o "Sin asignar")
│   ├── Etiquetas (chips)
│   ├── Creado por + fecha formateada
│   ├── Fecha de cierre (si closedAt !== null)
│   └── [si puede editar] Button "Editar" → cambia a modo edición
├── [modo edición] TicketEditForm
│   ├── Input título (máx. 150 chars, requerido)
│   ├── MarkdownField descripción (tabs Editar / Preview)
│   ├── Select prioridad (Baja / Media / Alta / Sin prioridad)
│   ├── [solo admin] Select "Asignado a" (usuarios activos + "Sin asignar")
│   ├── TagInput etiquetas
│   ├── Button "Guardar" — body incluye campo `version`
│   └── Button "Cancelar"
├── StateHistoryTimeline
│   └── Lista cronológica de StateTransition (changedBy, fromStatus → toStatus, changedAt)
├── CommentSection
│   ├── CommentList (autor, fecha relativa, contenido con @mentions destacados)
│   └── CommentInput (textarea + autocomplete de @mentions + Button "Comentar")
└── Footer
    └── [si puede archivar] Button "Eliminar" → AlertDialog de confirmación
        └── Texto: "¿Archivar este ticket? Permanecerá en el sistema pero quedará oculto."
            Acciones: [Cancelar] [Archivar]
```

**Tickets archivados**: el modal muestra el mismo contenido en modo solo-lectura. Todos los botones de acción están deshabilitados excepto [si admin] Button "Restaurar".

#### 4.5.1 StatusTransitionButtons

| Estado actual | Quién ve el botón | Texto del botón |
|--------------|-------------------|-----------------|
| 'Por hacer' | creador, asignado, admin | "Mover a En progreso" |
| 'En progreso' | creador, asignado, admin | "Marcar como Listo" |
| 'Listo' | solo admin | "Revertir a En progreso" |
| Cualquiera (isArchived) | nadie | botones ocultos |

### 4.6 CreateTicketModal (shadcn Dialog)

```
CreateTicketModal
└── CreateTicketForm
    ├── Input título (requerido, máx. 150 chars)
    ├── MarkdownField descripción (opcional, tabs Editar / Preview)
    ├── Select prioridad (opcional)
    ├── [solo admin] Select "Asignado a" (opcional)
    ├── TagInput etiquetas (opcional)
    └── Button "Crear ticket"
```

### 4.7 MarkdownField (componente compartido)

```
MarkdownField
├── Tabs: [Editar] [Preview]
├── [tab activa = Editar] <textarea> nativo con estilos Tailwind
│   └── value ligado a react-hook-form
└── [tab activa = Preview]
    └── <div> con react-markdown (plugins: remark-gfm)
        └── render del contenido actual del textarea
```

La descripción se persiste como texto plano Markdown. Nunca se convierte a HTML antes de enviarse a la API.

### 4.8 CommentInput

```
CommentInput
├── <textarea> con listener onKeyUp
├── [al escribir '@'] MentionDropdown
│   ├── Filtra usuarios activos (caché TanStack Query, sin request adicional)
│   ├── Muestra: avatar + displayName
│   └── Al seleccionar: inserta '@displayName' en el cursor y cierra dropdown
│       Teclas: Enter/Tab para seleccionar, Escape para cerrar
└── Button "Comentar" (deshabilitado si textarea vacío)
```

### 4.9 DashboardPage

```
DashboardPage
├── PageHeader
│   ├── Título "Dashboard"
│   ├── LastRefreshedBadge
│   │   └── "Actualizado hace X minutos" (date-fns formatDistanceToNow en español)
│   └── Button "Exportar CSV" → abre ExportCSVModal
└── MetricsGrid (3 tarjetas Tremor <Card>)
    ├── ClosedByMonthChart
    │   └── Tremor <BarChart>
    │       eje X: mes ('YYYY-MM' formateado como 'nov 2025')
    │       eje Y: tickets cerrados
    │       datos: DashboardMetrics.closedByMonth (últimos 6 meses)
    ├── ByStatusChart
    │   └── Tremor <DonutChart>
    │       segmentos: Por hacer, En progreso, Listo
    │       datos: DashboardMetrics.byStatus
    └── ByAssigneeList
        └── Tremor <BarList>
            filas: displayName → conteo de tickets asignados
            datos: DashboardMetrics.byAssignee (ordenado desc)
```

### 4.10 ExportCSVModal (shadcn Dialog)

```
ExportCSVModal
├── Select "Tipo de exportación"
│   ├── Resumen de métricas
│   └── Detalle de tickets
├── MonthPicker "Desde"
│   └── Selects de mes + año (rango: últimos 12 meses — mes actual)
├── MonthPicker "Hasta"
│   └── Selects de mes + año (≥ valor de "Desde")
├── Texto informativo: "Datos exactos al momento de la descarga."
└── Button "Descargar"
    └── Invoca useExportCSV (ver §6.7)
```

MonthPicker implementado con dos shadcn `<Select>` (mes y año). No usa Calendar; no requiere react-day-picker.

### 4.11 AdminUsersPage

```
AdminUsersPage
├── PageHeader "Gestión de usuarios"
│   └── Button "Crear usuario" → abre CreateUserModal
└── UsersTable
    ├── columnas: Nombre, Email, Rol, Estado, Acciones
    └── por fila:
        ├── RoleToggleButton
        │   ├── Si role = 'user': Button "Promover a Admin"
        │   ├── Si role = 'admin': Button "Degradar a Usuario"
        │   └── Deshabilitado + tooltip si es el único admin activo
        ├── [isActive = true] Button "Desactivar"
        │   ├── AlertDialog de confirmación
        │   └── Deshabilitado + tooltip si es el único admin activo
        └── [isActive = false] Button "Reactivar"
```

**CreateUserModal**
```
CreateUserModal (shadcn Dialog)
└── Form
    ├── Input "Email" (el backend valida que sea del dominio corporativo)
    ├── Input "Nombre de display"
    └── Select "Rol" (Admin / Usuario)
```

---

## 5. Estructura de carpetas

```
src/
├── main.tsx                        # Entry point: ReactDOM.createRoot + Providers
├── app/
│   └── router.tsx                  # createBrowserRouter + rutas con guards
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   └── LoginPage.tsx
│   │   ├── hooks/
│   │   │   └── useSession.ts       # TanStack Query → GET /api/auth/me
│   │   └── store/
│   │       └── sessionStore.ts     # Zustand: { user, setUser, clearUser }
│   ├── tickets/
│   │   ├── components/
│   │   │   ├── BoardPage.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── ViewToggle.tsx
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   ├── TaskCard.tsx          # Card para el Kanban (con drag handle)
│   │   │   ├── TicketCard.tsx        # Card para la vista lista
│   │   │   ├── PriorityChip.tsx      # Chip de prioridad (Alta/Media/Baja)
│   │   │   ├── TagChip.tsx           # Chip de etiqueta
│   │   │   ├── TicketModal.tsx
│   │   │   ├── TicketEditForm.tsx
│   │   │   ├── CreateTicketModal.tsx
│   │   │   ├── StatusTransitionButtons.tsx
│   │   │   ├── ArchiveButton.tsx
│   │   │   ├── StateHistoryTimeline.tsx
│   │   │   ├── MarkdownField.tsx
│   │   │   └── TagInput.tsx
│   │   ├── hooks/
│   │   │   ├── useTickets.ts       # GET /api/tickets (filtros via query params)
│   │   │   ├── useTicket.ts        # GET /api/tickets/:id
│   │   │   ├── useCreateTicket.ts  # POST /api/tickets
│   │   │   ├── useUpdateTicket.ts  # PATCH /api/tickets/:id (incluye version)
│   │   │   ├── useChangeStatus.ts  # PATCH /api/tickets/:id/status (incluye version)
│   │   │   └── useArchiveTicket.ts # POST /api/tickets/:id/archive|restore
│   │   ├── store/
│   │   │   └── filtersStore.ts     # Zustand: { filters, activeView, ... }
│   │   └── types.ts                # Ticket, TicketStatus, TicketFilters, etc.
│   ├── comments/
│   │   ├── components/
│   │   │   ├── CommentSection.tsx
│   │   │   ├── CommentList.tsx
│   │   │   └── CommentInput.tsx
│   │   └── hooks/
│   │       ├── useComments.ts      # GET /api/tickets/:id/comments
│   │       └── useAddComment.ts    # POST /api/tickets/:id/comments
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ClosedByMonthChart.tsx
│   │   │   ├── ByStatusChart.tsx
│   │   │   ├── ByAssigneeList.tsx
│   │   │   ├── LastRefreshedBadge.tsx
│   │   │   └── ExportCSVModal.tsx
│   │   └── hooks/
│   │       ├── useDashboardMetrics.ts  # GET /api/dashboard/metrics, staleTime: 15min
│   │       └── useExportCSV.ts         # GET /api/exports/metrics → Blob → descarga
│   └── admin/
│       ├── components/
│       │   ├── AdminUsersPage.tsx
│       │   ├── UsersTable.tsx
│       │   ├── CreateUserModal.tsx
│       │   └── RoleToggleButton.tsx
│       └── hooks/
│           ├── useUsers.ts             # GET /api/users
│           ├── useCreateUser.ts        # POST /api/users
│           └── useManageUser.ts        # PATCH role / deactivate / reactivate
├── shared/
│   ├── components/
│   │   ├── AppLayout.tsx
│   │   ├── TopNav.tsx
│   │   ├── AuthGuard.tsx
│   │   ├── AdminGuard.tsx
│   │   ├── ViewportWarning.tsx
│   │   └── ui/                         # Generado y gestionado por shadcn/ui CLI
│   │       ├── alert-dialog.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── popover.tsx
│   │       ├── select.tsx
│   │       ├── sonner.tsx
│   │       ├── switch.tsx
│   │       ├── tabs.tsx
│   │       └── textarea.tsx
│   ├── lib/
│   │   ├── queryClient.ts              # QueryClient con defaultOptions
│   │   ├── api.ts                      # fetch wrapper: auth header, manejo 401 y 409
│   │   └── utils.ts                    # cn(), formatDate(), formatRelativeDate()
│   └── types/
│       └── index.ts                    # User, Comment, StateTransition, DashboardMetrics
└── test/
    ├── unit/                           # Vitest: lógica de permisos, validaciones zod
    └── e2e/                            # Playwright: auth, cambio de estado, conflicto 409
```

---

## 6. Reglas de negocio

### 6.1 Tabla de permisos de UI

| Acción | Creador | Asignado | Admin | Componente afectado |
|--------|---------|---------|-------|---------------------|
| Editar título / descripción | ✅ | ❌ | ✅ | Button "Editar" en TicketModal |
| Cambiar estado (avance) | ✅ | ✅ | ✅ | StatusTransitionButtons |
| Revertir estado (Listo → En progreso) | ❌ | ❌ | ✅ | StatusTransitionButtons |
| Editar campo "Asignado a" | ❌ | ❌ | ✅ | Select en TicketEditForm |
| Archivar ticket | ✅ | ❌ | ✅ | ArchiveButton |
| Restaurar ticket archivado | ❌ | ❌ | ✅ | Button "Restaurar" en TicketModal |
| Ver /admin/users | ❌ | ❌ | ✅ | AdminGuard + TopNav link |

Fuente de verdad del rol y la identidad del usuario: `sessionStore.user`.  
Fuente de verdad del creador y asignado: `ticket.createdBy.id` y `ticket.assignedTo?.id`.

### 6.2 Flujo de estados (StatusTransitionButtons)

```
canAdvance = ticket.createdBy.id === currentUser.id
          || ticket.assignedTo?.id === currentUser.id
          || currentUser.role === 'admin'

canRevert = currentUser.role === 'admin'

Botones mostrados:
  'Por hacer'   + canAdvance → "Mover a En progreso"
  'En progreso' + canAdvance → "Marcar como Listo"
  'Listo'       + canRevert  → "Revertir a En progreso"
  isArchived = true          → ningún botón visible
```

### 6.3 Manejo del conflicto de concurrencia (HTTP 409)

1. Toda mutación de ticket incluye `version: number` en el body.
2. Al recibir respuesta 409 de la API:
   - Mostrar toast de error (Sonner): _"Otro usuario modificó este ticket mientras lo editabas. Recarga para ver los cambios."_
   - Llamar `queryClient.invalidateQueries({ queryKey: ['ticket', id] })`.
   - El TicketModal vuelve automáticamente al modo lectura con los datos frescos.
3. El botón "Guardar" permanece habilitado; el usuario puede editar de nuevo con el dato recargado.

### 6.4 Manejo de sesión expirada o cuenta desactivada (HTTP 401)

El wrapper `api.ts` intercepta cualquier respuesta 401 de cualquier endpoint:
1. Llama `sessionStore.clearUser()`.
2. Ejecuta `window.location.href = '/login'` (hard redirect, limpia todo el estado de React).
3. No muestra toast previo; la redirección es inmediata.

### 6.5 Validación de formularios (zod)

**CreateTicketForm / TicketEditForm:**
```
title:        string, min 1 ("El título es obligatorio"), max 150 ("Máximo 150 caracteres")
description:  string, opcional
priority:     'Baja' | 'Media' | 'Alta', opcional
assignedToId: UUID string, opcional, nullable
labels:       string[], opcional
```

**CreateUserModal:**
```
email:       string, email válido, requerido
displayName: string, min 1, requerido
role:        'admin' | 'user', requerido
```

### 6.6 Visibilidad del filtro "Mostrar archivados"

- El Switch "Mostrar archivados" es visible para **todos** los usuarios autenticados.
- La lista de tickets devuelta por la API cuando `showArchived = true`:
  - Admin: todos los tickets archivados del sistema.
  - Usuario estándar: solo los tickets archivados de los que es creador.
- El frontend no filtra; confía íntegramente en la respuesta de la API.

### 6.7 Exportación de CSV (useExportCSV)

```
1. Request: GET /api/exports/metrics?type={type}&from={YYYY-MM}&to={YYYY-MM}
2. Recibir: Blob con Content-Type text/csv
3. Leer el texto del blob y contar saltos de línea
4. Si líneas <= 1 (solo la fila de cabeceras):
     → mostrar toast informativo: "No hay datos para el rango seleccionado."
     → no iniciar descarga
5. Si líneas > 1:
     → URL.createObjectURL(blob)
     → crear <a> con atributo download y el nombre de archivo del header
       Content-Disposition, hacer .click(), revocar URL
```

Rango permitido en el modal: mínimo 1 mes, máximo 12 meses hacia atrás. Default al abrir el modal: últimos 6 meses.

### 6.8 Actualización del dashboard

- `useDashboardMetrics` usa `staleTime: 15 * 60 * 1000`. TanStack Query no hará refetch antes de que expire.
- `LastRefreshedBadge` muestra `formatDistanceToNow(metrics.lastRefreshedAt, { locale: es, addSuffix: true })` (date-fns).

### 6.9 @mentions en comentarios

Al escribir `@` en CommentInput:
1. Se muestra un dropdown con los usuarios activos (cargados desde caché TanStack Query; no se lanza un nuevo request).
2. El dropdown filtra por `displayName` que empiece por el texto escrito tras `@`.
3. Al seleccionar (click, Enter o Tab): se inserta `@displayName` en la posición del cursor.
4. Se cierra con Escape o click fuera del dropdown.

Al mostrar un comentario en CommentList:
- Regex aplicada sobre el texto: `/@[\w\-]+(?:\s[\w\-]+)*/g`
- Los matches se envuelven en `<span className="font-medium text-ds-primary">`.

### 6.10 Degradación de admin único

**RoleToggleButton / DeactivateButton:**
- Si el usuario a degradar o desactivar es el único usuario con `role = 'admin'` e `isActive = true`, el botón aparece deshabilitado con tooltip: _"Debe existir al menos un admin activo en el sistema."_
- La comprobación se hace en el frontend con la lista de usuarios en caché. El backend valida igualmente y devuelve 422 si la condición se incumple.

### 6.11 Viewport warning

`ViewportWarning` usa un `ResizeObserver` montado en `AppLayout`.  
Si el ancho del viewport es < 1024 px, muestra un banner fijo en la parte inferior de la pantalla, no dismissible:  
_"Esta herramienta está optimizada para pantallas de escritorio (mínimo 1024 px)."_

---

## 7. Endpoints API consumidos por el frontend

| Método | Endpoint | Body / Params | Respuesta | Guard |
|--------|----------|--------------|-----------|-------|
| GET | `/api/auth/me` | — | User | — |
| GET | `/api/auth/login` | — | redirect OAuth | — |
| POST | `/api/auth/logout` | — | 204 | sesión |
| GET | `/api/tickets` | query: status[], priority[], labels[], assignedToId, createdFrom, createdTo, showArchived | Ticket[] | sesión |
| POST | `/api/tickets` | { title, description?, priority?, assignedToId?, labels? } | Ticket | sesión |
| GET | `/api/tickets/:id` | — | Ticket + StateTransition[] | sesión |
| PATCH | `/api/tickets/:id` | { title?, description?, priority?, labels?, version } | Ticket | sesión |
| PATCH | `/api/tickets/:id/status` | { status, version } | Ticket | sesión |
| PATCH | `/api/tickets/:id/assign` | { assignedToId: string \| null } | Ticket | admin |
| POST | `/api/tickets/:id/archive` | — | Ticket | sesión |
| POST | `/api/tickets/:id/restore` | — | Ticket | admin |
| GET | `/api/tickets/:id/comments` | — | Comment[] | sesión |
| POST | `/api/tickets/:id/comments` | { content } | Comment | sesión |
| GET | `/api/dashboard/metrics` | — | DashboardMetrics | sesión |
| GET | `/api/exports/metrics` | query: type, from (YYYY-MM), to (YYYY-MM) | Blob (text/csv) | sesión |
| GET | `/api/users` | — | User[] | sesión |
| POST | `/api/users` | { email, displayName, role } | User | admin |
| PATCH | `/api/users/:id/role` | { role } | User | admin |
| PATCH | `/api/users/:id/deactivate` | — | User | admin |
| PATCH | `/api/users/:id/reactivate` | — | User | admin |

---

## 8. Cobertura de tests

### Vitest (unitarios)
- Lógica de permisos de `StatusTransitionButtons` (todos los casos de la tabla §6.2)
- Validaciones zod de `CreateTicketForm` y `CreateUserModal`
- `useExportCSV`: lógica de detección de CSV vacío y descarga programática
- Lógica de degradación de admin único (§6.10)

### Playwright (e2e críticos)
- Flujo de autenticación: login exitoso, rechazo por dominio incorrecto, expiración de sesión
- Creación y avance de estado de un ticket (Por hacer → En progreso → Listo)
- Conflicto de edición concurrente (409): dos sesiones simultáneas sobre el mismo ticket
- Exportación de CSV: descarga y verificación de cabeceras

---

*Documento listo para revisión. Confirmar para iniciar implementación.*
