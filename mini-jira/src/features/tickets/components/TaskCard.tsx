import { GripVertical, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { PriorityChip } from '@/features/tickets/components/PriorityChip'
import { TagChip } from '@/features/tickets/components/TagChip'
import { cn, formatRelativeDate } from '@/shared/lib/utils'
import type { Ticket } from '@/shared/types'

interface TaskCardProps {
  ticket: Ticket
  onClick: () => void
  isDragging?: boolean
}

export function TaskCard({ ticket, onClick, isDragging = false }: TaskCardProps) {
  const visibleLabels = ticket.labels.slice(0, 2)
  const overflowCount = ticket.labels.length - 2

  return (
    <div
      onClick={onClick}
      className={cn(
        'group bg-ds-surface-container-lowest border border-ds-outline-variant rounded cursor-pointer p-3 space-y-2 transition-shadow',
        isDragging
          ? 'shadow-modal rotate-1 opacity-80'
          : 'shadow-card hover:shadow-modal'
      )}
    >
      {/* Priority + drag handle */}
      <div className="flex items-center justify-between gap-2">
        {ticket.priority ? (
          <PriorityChip priority={ticket.priority} />
        ) : (
          <span />
        )}
        <GripVertical className="h-4 w-4 flex-shrink-0 text-ds-surface-container-highest group-hover:text-ds-on-surface-variant transition-colors" />
      </div>

      {/* Title */}
      <p className="text-ds-on-surface text-body-base leading-snug line-clamp-2">
        {ticket.title}
      </p>

      {/* Labels */}
      {ticket.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleLabels.map((label) => (
            <TagChip key={label} label={label} />
          ))}
          {overflowCount > 0 && <TagChip label={`+${overflowCount}`} />}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-ds-on-surface-variant text-body-sm">
          <MessageSquare className="h-3.5 w-3.5" />
          0
        </span>

        <div className="flex items-center gap-2">
          {ticket.status === 'Listo' && ticket.closedAt && (
            <span className="text-ds-on-surface-variant text-body-sm">
              {formatRelativeDate(ticket.closedAt)}
            </span>
          )}
          {ticket.assignedTo && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-ds-surface-container-high text-ds-on-surface text-body-sm">
                {ticket.assignedTo.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>
  )
}
