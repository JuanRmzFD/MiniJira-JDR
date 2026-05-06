# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Tech Lead: estas reglas son **no negociables**. Se aplican a cada archivo que toques,
> sin excepción. Léelas antes de escribir una sola línea de código.

---

## Commands

```bash
npm run dev       # dev server → http://localhost:5173
npm run build     # tsc type-check + Vite production build
npm run lint      # ESLint
```

Vitest está instalado pero no hay un script `test` en `package.json` todavía. Para habilitarlo, añadir `"test": "vitest"` a scripts.

### Mock mode (login bypass)

```bash
VITE_MOCK=true npm run dev
```

Con `VITE_MOCK=true`, `useSession` omite la llamada a `/api/auth/me` e inyecta un usuario admin hardcoded (`dev@empresa.com`, role `admin`). Todas las demás llamadas a la API siguen apuntando al backend real vía `VITE_API_URL`.

---

## Architecture

### Runtime wiring

`main.tsx` monta `QueryClientProvider` → `RouterProvider`. El árbol de rutas vive en `src/app/router.tsx`:

```
/login             → LoginPage (sin autenticación)
/* autenticado */  → AuthGuard → AppLayout
  /board           → BoardPage
  /dashboard       → DashboardPage
  /admin/users     → AdminGuard → AdminUsersPage
*                  → Navigate /board
```

**AuthGuard** llama a `useSession` en mount. `useSession` ejecuta `/api/auth/me` (o inyecta el mock) y escribe el resultado en `sessionStore`. Si `user` es `null` tras la carga, redirige a `/login`.

### State management layers

| Layer | Tool | Qué guarda |
|---|---|---|
| Auth session | Zustand (`sessionStore`) | Objeto `User` del usuario logueado |
| UI / tablero | Zustand (`filtersStore`) | Vista activa (kanban/list), `TicketFilters` |
| Server data | TanStack Query | Tickets, comentarios, usuarios, métricas |
| Form state | react-hook-form | Formularios de creación/edición de ticket |

`sessionStore` y `filtersStore` viven en `src/features/*/store/`, **no** en `shared/`, porque pertenecen a su feature.

### API layer (`src/shared/lib/api.ts`)

Envuelve `fetch` con:
- `credentials: 'include'` (auth por cookie de sesión)
- En `401`: `sessionStore.clearUser()` + `window.location.href = '/login'`
- `Content-Type: text/csv` → devuelve `Blob` (para descarga de CSV)
- HTTP `204` → devuelve `undefined`

`VITE_API_URL` por defecto es `''` (mismo origen).

### Kanban drag-and-drop (`KanbanBoard.tsx`)

Usa `@hello-pangea/dnd`. En `onDragEnd`:
1. Valida permisos: las transiciones inversas requieren `user.role === 'admin'`.
2. Aplica actualización optimista vía `queryClient.setQueryData(['tickets', filters], ...)`.
3. Llama `useChangeStatus` (`PATCH /api/tickets/:id/status` con `version`); en `onError` invalida la query para revertir.

### TanStack Query defaults (`queryClient.ts`)

- Global: `staleTime: 60_000`, `retry: 1`, `refetchOnWindowFocus: true`
- `useSession`: `staleTime: Infinity`, `retry: false`
- `useDashboardMetrics`: `staleTime: 15 * 60 * 1000` (alineado con la caché de 15 min del servidor)

---

## 1. Color — Regla absoluta

**NUNCA uses colores Tailwind genéricos** (`blue-500`, `red-400`, `slate-200`, `green-600`,
`amber-300`, etc.) ni valores hexadecimales directos en ningún `className`.

**SÓLO están permitidos los tokens `ds-*`** definidos en `DESIGN.md` y registrados
en `tailwind.config.js`. Si el color que necesitas no existe en esa lista, el diseño
lo prohíbe: ajusta el componente para usar el token semánticamente más cercano.

### 1.1 Paleta completa y cuándo usar cada token

#### Surfaces (fondos y capas)

| Token Tailwind | Hex | Usar para |
|---|---|---|
| `bg-ds-surface` | `#faf8fe` | Fondo de página (`<body>`, `<main>`) |
| `bg-ds-surface-container-lowest` | `#ffffff` | Cards, modales, inputs |
| `bg-ds-surface-container-low` | `#f4f3f8` | Sidebar, panel de filtros |
| `bg-ds-surface-container` | `#eeedf3` | Cabecera de columna Kanban |
| `bg-ds-surface-container-high` | `#e9e7ed` | Hover sobre filas de tabla |
| `bg-ds-surface-container-highest` | `#e3e2e7` | Separadores, dividers visuales |
| `bg-ds-surface-dim` | `#dad9df` | Overlays de deshabilitado |
| `bg-ds-surface-variant` | `#e3e2e7` | Chips sin color semántico |
| `bg-ds-inverse-surface` | `#2f3034` | Tooltips, snackbars oscuros |

#### Texto

| Token Tailwind | Hex | Usar para |
|---|---|---|
| `text-ds-on-surface` | `#1a1b1f` | Texto principal, títulos |
| `text-ds-on-surface-variant` | `#414755` | Texto secundario, metadatos |
| `text-ds-inverse-on-surface` | `#f1f0f5` | Texto sobre fondos oscuros (`inverse-surface`) |
| `text-ds-on-background` | `#1a1b1f` | Alias de `on-surface` para uso en `<body>` |

#### Bordes y separadores

| Token Tailwind | Hex | Usar para |
|---|---|---|
| `border-ds-outline` | `#717786` | Bordes de inputs en foco, separadores fuertes |
| `border-ds-outline-variant` | `#c1c6d7` | Bordes por defecto de cards e inputs |

#### Primary — Azul (acción principal, estado "En progreso", prioridad Baja)

| Token Tailwind | Hex | Usar para |
|---|---|---|
| `bg-ds-primary` | `#0058bc` | Botón primario sólido |
| `text-ds-on-primary` | `#ffffff` | Texto sobre botón primario |
| `bg-ds-primary-container` | `#0070eb` | Hover del botón primario |
| `text-ds-on-primary-container` | `#fefcff` | Texto sobre `primary-container` |
| `bg-ds-primary-fixed` | `#d8e2ff` | Badge estado "En progreso", chip prioridad Baja |
| `text-ds-on-primary-fixed` | `#001a41` | Texto sobre `primary-fixed` |
| `text-ds-on-primary-fixed-variant` | `#004493` | Texto alternativo sobre `primary-fixed` |
| `text-ds-primary` | `#0058bc` | Links, íconos de acción activa |
| `bg-ds-inverse-primary` | `#adc6ff` | Indicador activo sobre fondo oscuro |

#### Secondary — Gris neutro (estado "Listo", elementos neutros)

| Token Tailwind | Hex | Usar para |
|---|---|---|
| `bg-ds-secondary-container` | `#dfdfe1` | Badge estado "Listo" |
| `text-ds-on-secondary-container` | `#616365` | Texto sobre `secondary-container` |
| `bg-ds-secondary-fixed` | `#e2e2e4` | Fondo de chips neutros |
| `text-ds-on-secondary-fixed-variant` | `#454749` | Texto sobre chips neutros |
| `text-ds-secondary` | `#5d5e60` | Texto terciario, placeholders |

#### Tertiary — Ámbar/naranja (prioridad Media)

| Token Tailwind | Hex | Usar para |
|---|---|---|
| `bg-ds-tertiary-fixed` | `#ffdbcc` | Chip prioridad Media |
| `text-ds-on-tertiary-fixed-variant` | `#7c2e00` | Texto en chip prioridad Media |
| `bg-ds-tertiary` | `#9e3d00` | Ícono de prioridad Media |
| `text-ds-on-tertiary` | `#ffffff` | Texto sobre fondo `tertiary` |

#### Error — Rojo (prioridad Alta, acciones destructivas)

| Token Tailwind | Hex | Usar para |
|---|---|---|
| `bg-ds-error-container` | `#ffdad6` | Chip prioridad Alta |
| `text-ds-on-error-container` | `#93000a` | Texto en chip prioridad Alta |
| `text-ds-error` | `#ba1a1a` | Mensajes de error, icono destructivo |
| `bg-ds-error` | `#ba1a1a` | Botón destructivo sólido |
| `text-ds-on-error` | `#ffffff` | Texto sobre botón destructivo |

### 1.2 Mapeo semántico obligatorio

```
Prioridad Alta    → bg-ds-error-container    + text-ds-on-error-container
Prioridad Media   → bg-ds-tertiary-fixed     + text-ds-on-tertiary-fixed-variant
Prioridad Baja    → bg-ds-primary-fixed      + text-ds-on-primary-fixed

Estado Por hacer  → bg-ds-surface-container  + text-ds-on-surface-variant
Estado En progreso→ bg-ds-primary-fixed      + text-ds-on-primary-fixed
Estado Listo      → bg-ds-secondary-container+ text-ds-on-secondary-container

Acción primaria   → bg-ds-primary            + text-ds-on-primary
Acción destructiva→ bg-ds-error              + text-ds-on-error
Acción secundaria → bg-ds-surface-container-low + text-ds-on-surface (sin borde)
```

> **No existe verde en esta paleta.** No añadas tokens de verde bajo ningún concepto.
> El estado "Listo" se expresa con el token secondary (gris neutro), no con verde.

---

## 2. Tipografía

Fuente única: **Inter** (declarada en `tailwind.config.js` bajo `fontFamily.sans`).

Usa exclusivamente las escalas registradas. Nunca uses `text-sm`, `text-base`, `text-lg`
de Tailwind directamente; usa los tokens semánticos:

| Token Tailwind | Equivalencia | Usar para |
|---|---|---|
| `text-h1` | 24px/600/lh32 | Títulos de página |
| `text-h2` | 20px/600/lh28 | Títulos de sección / modal |
| `text-body-base` | 14px/400/lh20 | Texto de contenido general |
| `text-body-sm` | 13px/400/lh18 | Metadatos, timestamps, labels |
| `text-label-caps` | 11px/600/ls0.05em | Etiquetas en MAYÚSCULAS (IDs, fechas) |
| `text-btn` | 14px/500/lh20 | Texto de botones |

Las clases `text-label-caps` deben ir siempre acompañadas de `uppercase tracking-[0.05em]`.

---

## 3. Espaciado

La unidad base es **4 px**. Todos los espaciados deben ser múltiplos de 4.
Preferir las utilidades semánticas registradas:

| Token Tailwind | Valor | Usar para |
|---|---|---|
| `px-container-px` / `p-container-px` | 24px | Padding de contenedores de página |
| `gap-element-gap` | 12px | Gap entre elementos relacionados |
| `mb-section-gap` / `mt-section-gap` | 32px | Separación entre secciones |
| `gap-gutter` | 16px | Columnas de grid |

Múltiplos permitidos de la escala por defecto de Tailwind: `1` (4px), `2` (8px),
`3` (12px), `4` (16px), `6` (24px), `8` (32px), `10` (40px), `12` (48px).

---

## 4. Radios de esquina

| Clase Tailwind | Valor | Usar para |
|---|---|---|
| `rounded-sm` | 4px | Detalles internos mínimos |
| `rounded` | 8px | Botones, inputs, TicketCard |
| `rounded-md` | 12px | Elementos medianos |
| `rounded-lg` | 16px | Modales, paneles principales, TicketModal |
| `rounded-xl` | 24px | Contenedores grandes de primer nivel |
| `rounded-full` | 9999px | Chips, badges, avatars |

---

## 5. Sombras y elevación

Usar las sombras semánticas del `tailwind.config.js`:

| Clase Tailwind | Usar para |
|---|---|
| `shadow-card` | Ticket cards (hover: aumentar a `shadow-modal`) |
| `shadow-modal` | Modales y dropdowns |

No uses `shadow-sm`, `shadow-md`, `shadow-lg` ni valores arbitrarios.

---

## 6. Estructura de archivos — dónde crear cada cosa

```
src/
├── features/<feature>/
│   ├── components/   ← componentes de UI de esa feature
│   ├── hooks/        ← TanStack Query (useQuery/useMutation)
│   └── store/        ← Zustand slices propios de la feature
├── shared/
│   ├── components/ui/  ← SÓLO componentes shadcn/ui (no tocar a mano)
│   ├── components/     ← guards, layout, componentes transversales
│   ├── lib/            ← api.ts, queryClient.ts, utils.ts, mock.ts
│   └── types/          ← tipos TypeScript compartidos (index.ts)
└── app/
    └── router.tsx      ← única fuente de verdad del routing
```

Reglas de ubicación:
- Un componente sólo puede importar de su propia feature o de `shared/`.
- Prohibido que `shared/` importe de ninguna `feature/`.
- Los hooks de datos usan **siempre** TanStack Query; nunca `useState` + `useEffect` para llamadas a la API.
- El estado global de UI (filtros, vista activa) va en **Zustand**. El estado local de formularios va en **react-hook-form**.

---

## 7. Reglas de negocio críticas (backlog.md + spec.md)

### Autenticación (HU-01)
- Sesión expira tras **8 horas** de inactividad (gestionado por el backend via Redis TTL).
- Al recibir un `401`, el wrapper `api.ts` llama `sessionStore.clearUser()` y redirige a `/login` inmediatamente, sin toast previo.
- No existe auto-registro. El botón de login solo apunta a `GET /api/auth/login`.

### Tickets (HU-02)
- El flujo de estados es **unidireccional**: `Por hacer → En progreso → Listo`.
- Las transiciones inversas (`Listo → En progreso`) **solo** las puede hacer un admin.
- Toda mutación de ticket debe incluir el campo `version` en el body (optimistic locking).
- Al recibir `409`: toast de error + `invalidateQueries(['ticket', id])` + salir del modo edición. Nunca sobreescribir silenciosamente.
- El botón de la UI dice **"Eliminar"** pero ejecuta un archivado lógico (`isArchived = true`). Nunca borrar registros físicamente.
- Toda acción destructiva (archivar) **requiere** `AlertDialog` de confirmación. Prohibido usar `window.confirm`.

### Permisos en UI (spec.md §2.2)
```
Editar título/descripción  → creador O admin
Cambiar estado (avance)    → creador O asignado O admin
Revertir estado            → SÓLO admin
Reasignar ticket           → SÓLO admin (campo visible solo para admins)
Archivar                   → creador O admin
Restaurar                  → SÓLO admin
Crear/desactivar usuarios  → SÓLO admin
```

### Edge cases críticos (backlog.md)
- **EC-01**: Título vacío al crear ticket → zod rechaza antes de hacer fetch. El botón "Crear ticket" permanece bloqueado mientras `errors.title` exista.
- **EC-02**: El único admin activo **no puede** degradarse ni desactivarse. El botón aparece `disabled` con `title` tooltip explicativo. El backend también valida y devuelve `422`.

### Dashboard (spec.md §2.6)
- Los datos tienen una antigüedad máxima de **15 minutos** (`staleTime: 15 * 60 * 1000` en `useDashboardMetrics`).
- Mostrar siempre `LastRefreshedBadge` con el `lastRefreshedAt` que devuelve la API.
- Rango visible: últimos **6 meses**.

### Exportación CSV (spec.md §2.7)
- Si el CSV tiene ≤ 1 línea (solo cabeceras), mostrar `toast.info('No hay datos para el rango seleccionado.')` y **no iniciar** la descarga.
- La descarga es programática: `URL.createObjectURL` → `<a>.click()` → `revokeObjectURL`. Sin pantalla de carga intermedia.

---

## 8. Convenciones de código

- **TypeScript strict**: todos los tipos del dominio viven en `src/shared/types/index.ts`. No duplicar tipos entre features.
- **Sin comentarios** salvo que el WHY sea no obvio (invariante oculta, workaround de bug concreto).
- **Sin `any`**. Si TanStack Query o una librería de terceros fuerza un tipo difícil, usar `unknown` + type guard.
- Los hooks de mutación exponen `isPending`, no `isLoading` (TanStack Query v5).
- Imports con alias `@/` siempre; nunca rutas relativas con `../`.
- Los componentes de `src/shared/components/ui/` son generados por shadcn/ui CLI. **No editarlos a mano** salvo corrección de imports de path.

---

## 9. Lo que está prohibido hacer

| Prohibido | Motivo |
|---|---|
| Usar `text-blue-*`, `bg-red-*`, `text-green-*`, etc. | Sólo tokens `ds-*` |
| Usar `#hex` o `rgb()` directamente en className | Idem |
| Usar `shadow-sm/md/lg` | Sólo `shadow-card` / `shadow-modal` |
| Crear estados de color que no estén en DESIGN.md | Inventar fuera del sistema |
| `window.confirm()` para confirmar acciones | Usar `AlertDialog` de shadcn/ui |
| `useState` + `useEffect` para llamadas a la API | Usar `useQuery` / `useMutation` |
| Importar desde otra `feature/` que no sea la propia | Rompe encapsulación |
| `import` de `shared/` que dependa de una `feature/` | Dependencia circular |
| Modificar archivos en `src/shared/components/ui/` manualmente | Son artefactos de shadcn |
| Paginar tickets en v1 | El volumen es trivial (10 usuarios); carga total |
| Implementar modo oscuro | Out-of-scope v1 (spec.md §3) |
