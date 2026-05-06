# Plan: Componentes reutilizables del Kanban

> **Estado: COMPLETADO** — 2026-05-05

## Contexto

Construir los tres componentes que forman el Kanban de Mini Jira como piezas reutilizables con tokens `ds-*` correctos e integración de drag-and-drop (`@hello-pangea/dnd` ya instalado). Los átomos `PriorityChip` y `TagChip` ya existen. Los tres componentes principales (`TicketCard`, `KanbanColumn`, `KanbanBoard`) violan CLAUDE.md y deben ser reemplazados.

---

## Estado actual

| Archivo | Estado |
|---|---|
| `PriorityChip.tsx` | ✅ Creado |
| `TagChip.tsx` | ✅ Creado |
| `TaskCard.tsx` | ✅ Creado (reemplaza `TicketCard.tsx`) |
| `KanbanColumn.tsx` | ✅ Reescrito con tokens `ds-*` correctos |
| `KanbanBoard.tsx` | ✅ Reescrito con DnD + Optimistic UI |
| `BoardPage.tsx` | ✅ Actualizado |

---

## Árbol de dependencias

```
PriorityChip  ← (ya existe, sin deps propias)
TagChip       ← (ya existe, sin deps propias)
     │
     ▼
TaskCard  ←  PriorityChip + TagChip + Ticket (tipo) + formatRelativeDate (utils)
     │
     ▼
KanbanColumn  ←  TaskCard + TicketStatus (tipo) + children slot (DnD-agnostic)
     │
     ▼
KanbanBoard   ←  KanbanColumn + @hello-pangea/dnd
                              + useChangeStatus + useQueryClient
                              + filtersStore + sessionStore
```

---

## Componente 1 — `TaskCard`

**Archivo:** `src/features/tickets/components/TaskCard.tsx` *(crear)*

### Props
```ts
interface TaskCardProps {
  ticket: Ticket
  onClick: () => void
  isDragging?: boolean
}
```

### Layout visual
```
┌─────────────────────────────────────────┐
│ [HIGH PRIORITY]              ⠿ (grip)  │  PriorityChip + GripVertical decorativo
│                                         │
│ Título del ticket, hasta dos líneas     │  text-body-base, line-clamp-2
│                                         │
│ [Backend]  [Infra]  [+1]               │  TagChip × 2 + overflow "+N"
│                                         │
│ 💬 0                  [AB]  hace 2 días │  footer: comentarios + avatar + fecha
└─────────────────────────────────────────┘
```

### Tokens

| Elemento | Clase |
|---|---|
| Contenedor (reposo) | `bg-ds-surface-container-lowest border border-ds-outline-variant rounded shadow-card cursor-pointer p-3 space-y-2 transition-shadow` |
| Contenedor (`isDragging`) | añade `shadow-modal rotate-1 opacity-80` |
| Grip icon | `h-4 w-4 flex-shrink-0 text-ds-surface-container-highest group-hover:text-ds-on-surface-variant transition-colors` |
| Título | `text-ds-on-surface text-body-base leading-snug line-clamp-2` |
| Labels overflow "+N" | (reutiliza `TagChip`) |
| Footer texto (💬, fecha) | `text-ds-on-surface-variant text-body-sm` |
| Avatar fallback | `bg-ds-surface-container-high text-ds-on-surface` |

### Lógica de negocio
- `labels.slice(0, 2)` → `<TagChip>` + si `length > 2` → `<TagChip label="+N" />`
- `status === 'Listo' && closedAt` → `formatRelativeDate(closedAt)` en el footer
- Comentarios: valor `0` hardcoded (no está en el tipo `Ticket`; se carga solo dentro del modal)

---

## Componente 2 — `KanbanColumn`

**Archivo:** `src/features/tickets/components/KanbanColumn.tsx` *(reescribir)*

### Decisión clave: shell visual puro, sin DnD

`KanbanColumn` no importa `@hello-pangea/dnd`. Recibe `children` (el área droppable + cards que `KanbanBoard` le pasa). Esto la hace reutilizable en contextos sin DnD.

### Props
```ts
interface KanbanColumnProps {
  status: TicketStatus
  count: number
  children: React.ReactNode   // Droppable + Draggable cards, gestionados por KanbanBoard
  isDraggingOver?: boolean
}
```

### Layout visual
```
┌──────────────────────────────────┐
│ TO DO  [1]                  ⋯  │  header: label + badge + ellipsis
├──────────────────────────────────┤
│                                  │
│  {children}  ← droppable area    │  flex-1, tint de fondo si isDraggingOver
│                                  │
├──────────────────────────────────┤
│ + Add task                       │  footer
└──────────────────────────────────┘
```

### Tokens

| Elemento | Clase |
|---|---|
| Wrapper columna | `flex flex-col min-h-[480px]` |
| Header | `flex items-center gap-2 px-1 py-3` |
| Nombre estado | `flex-1 text-ds-on-surface text-body-base font-semibold uppercase tracking-[0.05em]` |
| Ellipsis | `text-ds-on-surface-variant hover:text-ds-on-surface` |
| Área children (normal) | `flex-1 px-1 transition-colors` |
| Área children (drag-over) | añade `bg-ds-primary-fixed/20 rounded-lg` |
| Footer "+ Add task" | `flex items-center gap-1.5 px-1 py-2 text-ds-on-surface-variant text-body-sm hover:text-ds-on-surface transition-colors` |

### Count badge por estado

| Estado | bg | texto |
|---|---|---|
| `Por hacer` | `bg-ds-surface-container-highest` | `text-ds-on-surface-variant` |
| `En progreso` | `bg-ds-primary-fixed` | `text-ds-on-primary-fixed` |
| `Listo` | `bg-ds-secondary-container` | `text-ds-on-secondary-container` |

**Clases badge:** `text-label-caps uppercase rounded-full px-1.5 py-0.5`

### Labels de cabecera
```ts
const STATUS_LABELS: Record<TicketStatus, string> = {
  'Por hacer':   'TO DO',
  'En progreso': 'IN PROGRESS',
  'Listo':       'DONE',
}
```

---

## Componente 3 — `KanbanBoard`

**Archivo:** `src/features/tickets/components/KanbanBoard.tsx` *(reescribir)*

### Props
```ts
interface KanbanBoardProps {
  tickets: Ticket[]
  onTicketClick: (id: string) => void
}
```

### Hooks internos
| Hook | Uso |
|---|---|
| `useChangeStatus()` | PATCH de estado con 409 handling |
| `useQueryClient()` | Actualización optimista de cache |
| `filtersStore(s => s.filters)` | Clave del queryKey para el setQueryData |
| `sessionStore(s => s.user)` | Validar si puede revertir estado |

### Lógica `handleDragEnd`
```
1. Sin destination              → return
2. misma columna                → return
3. Buscar ticket por draggableId
4. Validar máquina de estados:
     STATUS_ORDER = { 'Por hacer': 0, 'En progreso': 1, 'Listo': 2 }
     si toIdx < fromIdx && user.role !== 'admin'
       → toast.error('Solo los admins pueden revertir el estado.')  → return
5. Actualización optimista:
     queryClient.setQueryData(['tickets', filters],
       old => old.map(t => t.id === id ? { ...t, status: toStatus } : t)
     )
6. changeStatus.mutate(
     { id, status: toStatus, version: ticket.version },
     { onError: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }) }
   )
```

### Estructura JSX
```tsx
<DragDropContext onDragEnd={handleDragEnd}>
  <div className="grid grid-cols-3 gap-gutter px-container-px pb-8">
    {STATUSES.map(status => (
      <Droppable droppableId={status} key={status}>
        {(provided, snapshot) => (
          <KanbanColumn status={status} count={byStatus[status].length}
                        isDraggingOver={snapshot.isDraggingOver}>
            <div ref={provided.innerRef} {...provided.droppableProps}
                 className="min-h-[200px] space-y-2">
              {byStatus[status].map((ticket, i) => (
                <Draggable key={ticket.id} draggableId={ticket.id} index={i}>
                  {(p, s) => (
                    <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
                      <TaskCard ticket={ticket} onClick={() => onTicketClick(ticket.id)}
                                isDragging={s.isDragging} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          </KanbanColumn>
        )}
      </Droppable>
    ))}
  </div>
</DragDropContext>
```

---

## Archivos generados

| Archivo | Acción |
|---|---|
| `src/features/tickets/components/TaskCard.tsx` | ✅ Creado |
| `src/features/tickets/components/KanbanColumn.tsx` | ✅ Reescrito |
| `src/features/tickets/components/KanbanBoard.tsx` | ✅ Reescrito |
| `src/features/tickets/components/BoardPage.tsx` | ✅ Actualizado |

*(PriorityChip.tsx y TagChip.tsx ya existían y no se tocaron)*

---

## Verificación post-generación

1. `npx tsc --noEmit` → 0 errores
2. `npm run dev` → board carga con 3 columnas y tarjetas visibles
3. Priority chips: rojo (Alta), ámbar (Media), azul (Baja)
4. Tag chips: gris neutro, overflow "+N" si hay más de 2 labels
5. Hover card → sombra sube de `shadow-card` a `shadow-modal`
6. Drag tarjeta entre columnas → mueve al instante (optimista) → PATCH enviado
7. Drag inverso (ej. Listo → Por hacer) con usuario no-admin → toast + rollback
