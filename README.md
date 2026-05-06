# Mini Jira

Herramienta interna de gestión de tickets estilo Kanban. Desarrollada con un flujo **spec-driven**: las especificaciones de frontend y backend se redactaron antes de escribir código.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS + sistema de tokens `ds-*` |
| Componentes UI | shadcn/ui |
| Server state | TanStack Query v5 |
| Estado global | Zustand |
| Formularios | react-hook-form + zod |
| Gráficas | @tremor/react |
| Drag and drop | @hello-pangea/dnd |
| Backend | Node.js + Express |
| ORM | Drizzle ORM |
| Base de datos | SQLite (libsql) |
| Autenticación | Sesiones HTTP + bcrypt |

---

## Funcionalidades

- **Tablero Kanban** con columnas Por hacer / En progreso / Listo y drag-and-drop entre columnas
- **Vista lista** de tickets con tabla ordenable
- **Gestión de tickets**: crear, editar, archivar, restaurar, cambiar estado, asignar, etiquetar
- **Optimistic locking**: previene sobrescritura de cambios concurrentes (HTTP 409)
- **Máquina de estados**: transiciones controladas; solo admins pueden revertir `Listo → En progreso`
- **Comentarios** con soporte de @menciones
- **Dashboard** con métricas: tickets cerrados por mes, por estado y por asignado (caché 15 min)
- **Exportación CSV** en formato resumen o detalle con rango de fechas
- **Gestión de usuarios** (solo admin): crear, promover/degradar rol, activar/desactivar
- **Control de acceso por rol**: `admin` y `user` con permisos diferenciados en UI y API

---

## Estructura del proyecto

```
spec-driven/
├── mini-jira/          # Frontend React
│   ├── src/
│   │   ├── app/        # Router
│   │   ├── features/   # auth, tickets, comments, dashboard, admin
│   │   └── shared/     # Layout, guards, api client, tipos globales
│   └── .env.local
├── backend/            # API Express
│   ├── src/
│   │   ├── routes/     # auth, tickets, users, comments, dashboard, exports
│   │   ├── services/   # lógica de negocio
│   │   ├── db/         # schema Drizzle + migraciones
│   │   └── middleware/ # requireSession, requireAdmin, errorHandler
│   ├── scripts/
│   │   └── seed.js     # datos de prueba
│   └── .env
├── frontend-specs.md   # Especificación frontend v1.2
└── backend/specs.md    # Especificación backend v1.1
```

---

## Instalación y puesta en marcha

### Requisitos

- Node.js >= 20

### 1. Backend

```bash
cd backend
npm install

# Crear archivo de entorno
cp .env.example .env   # o copiar la plantilla de abajo

# Aplicar migraciones y cargar datos de prueba
node -e "require('dotenv').config(); require('./src/db/migrate').runMigrations()"
npm run db:seed

# Iniciar servidor (puerto 3000)
npm run dev
```

**Variables de entorno requeridas (`backend/.env`):**

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=./data/minijira.db
SESSION_SECRET=cambia-esto-por-un-secreto-largo-y-aleatorio
SESSION_MAX_AGE=28800000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

### 2. Frontend

```bash
cd mini-jira
npm install

# Iniciar servidor de desarrollo (puerto 5173)
npm run dev
```

**Variables de entorno (`mini-jira/.env.local`):**

```env
VITE_API_URL=http://localhost:3000
```

---

## Credenciales de prueba

| Email | Contraseña | Rol |
|---|---|---|
| laura.garcia@empresa.com | admin123 | Admin |
| marcos.ruiz@empresa.com | admin123 | Admin |
| sofia.delgado@empresa.com | user123 | Usuario |

---

## Scripts disponibles

### Backend

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor con hot-reload |
| `npm run start` | Servidor producción |
| `npm run db:migrate` | Aplicar migraciones pendientes |
| `npm run db:seed` | Insertar datos de prueba (idempotente) |
| `npm run db:generate` | Generar migraciones desde el schema |

### Frontend

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (tsc + vite) |
| `npm run lint` | ESLint |

---

## API

Base path: `/api`. Todas las respuestas son JSON. Errores con forma `{ "error": "string" }`.

| Método | Endpoint | Guard | Descripción |
|---|---|---|---|
| POST | `/auth/login` | — | Iniciar sesión (email + contraseña) |
| GET | `/auth/me` | — | Usuario de la sesión activa |
| POST | `/auth/logout` | sesión | Cerrar sesión |
| GET | `/tickets` | sesión | Listar tickets con filtros |
| POST | `/tickets` | sesión | Crear ticket |
| GET | `/tickets/:id` | sesión | Detalle de ticket + historial |
| PATCH | `/tickets/:id` | sesión | Editar ticket (optimistic lock) |
| PATCH | `/tickets/:id/status` | sesión | Cambiar estado (optimistic lock) |
| PATCH | `/tickets/:id/assign` | admin | Asignar ticket |
| POST | `/tickets/:id/archive` | sesión | Archivar ticket |
| POST | `/tickets/:id/restore` | admin | Restaurar ticket |
| GET | `/tickets/:id/comments` | sesión | Listar comentarios |
| POST | `/tickets/:id/comments` | sesión | Añadir comentario |
| GET | `/dashboard/metrics` | sesión | Métricas agregadas (caché 15 min) |
| GET | `/exports/metrics` | sesión | Exportar CSV (summary o detail) |
| GET | `/users` | sesión | Listar usuarios |
| POST | `/users` | admin | Crear usuario |
| PATCH | `/users/:id/role` | admin | Cambiar rol |
| PATCH | `/users/:id/deactivate` | admin | Desactivar usuario |
| PATCH | `/users/:id/reactivate` | admin | Reactivar usuario |

---

## Reglas de negocio destacadas

- El flujo de estados es `Por hacer → En progreso → Listo`. La transición inversa `Listo → En progreso` es exclusiva de admins.
- Las mutaciones de ticket incluyen `version` para optimistic locking. Un conflicto devuelve HTTP 409.
- Los tickets no se eliminan; se archivan (`isArchived = true`).
- No existe auto-registro. Solo un admin puede crear usuarios.
- El único admin activo no puede ser degradado ni desactivado.
