import { cn } from '@/shared/lib/utils'
import type { TicketPriority } from '@/shared/types'

const STYLES: Record<TicketPriority, string> = {
  Alta: 'bg-ds-error-container text-ds-on-error-container',
  Media: 'bg-ds-tertiary-fixed text-ds-on-tertiary-fixed-variant',
  Baja: 'bg-ds-primary-fixed text-ds-on-primary-fixed',
}

const LABELS: Record<TicketPriority, string> = {
  Alta: 'HIGH PRIORITY',
  Media: 'MEDIUM PRIORITY',
  Baja: 'LOW PRIORITY',
}

interface PriorityChipProps {
  priority: TicketPriority
}

export function PriorityChip({ priority }: PriorityChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-label-caps uppercase',
        STYLES[priority]
      )}
    >
      {LABELS[priority]}
    </span>
  )
}
