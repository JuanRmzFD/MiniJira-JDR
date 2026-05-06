import type { ReactNode } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { TicketStatus } from '@/shared/types'

const STATUS_LABELS: Record<TicketStatus, string> = {
  'Por hacer':   'TO DO',
  'En progreso': 'IN PROGRESS',
  'Listo':       'DONE',
}

const BADGE_STYLES: Record<TicketStatus, string> = {
  'Por hacer':   'bg-ds-surface-container-highest text-ds-on-surface-variant',
  'En progreso': 'bg-ds-primary-fixed text-ds-on-primary-fixed',
  'Listo':       'bg-ds-secondary-container text-ds-on-secondary-container',
}

interface KanbanColumnProps {
  status: TicketStatus
  count: number
  /** Droppable area + Draggable cards — gestionados por KanbanBoard */
  children: ReactNode
  isDraggingOver?: boolean
}

export function KanbanColumn({ status, count, children, isDraggingOver = false }: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-h-[480px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-1 py-3">
        <span className="flex-1 text-ds-on-surface text-body-base font-semibold uppercase tracking-[0.05em]">
          {STATUS_LABELS[status]}
        </span>
        <span
          className={cn(
            'text-label-caps uppercase rounded-full px-1.5 py-0.5',
            BADGE_STYLES[status]
          )}
        >
          {count}
        </span>
        <button
          type="button"
          className="text-ds-on-surface-variant hover:text-ds-on-surface transition-colors p-0.5 rounded"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Droppable content slot */}
      <div
        className={cn(
          'flex-1 px-1 transition-colors rounded-lg',
          isDraggingOver && 'bg-ds-primary-fixed/20'
        )}
      >
        {children}
      </div>

      {/* Footer */}
      <button
        type="button"
        className="flex items-center gap-1.5 px-1 py-2 mt-1 text-ds-on-surface-variant text-body-sm hover:text-ds-on-surface transition-colors w-full"
      >
        <Plus className="h-4 w-4" />
        Add task
      </button>
    </div>
  )
}
