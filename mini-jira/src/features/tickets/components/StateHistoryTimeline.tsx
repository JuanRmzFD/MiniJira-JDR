import { ArrowRight } from 'lucide-react'
import { formatRelativeDate } from '@/shared/lib/utils'
import type { StateTransition } from '@/shared/types'

interface Props {
  history: StateTransition[]
}

const statusColors: Record<string, string> = {
  'Por hacer': 'bg-slate-100 text-slate-700',
  'En progreso': 'bg-blue-100 text-blue-700',
  'Listo': 'bg-green-100 text-green-700',
}

export function StateHistoryTimeline({ history }: Props) {
  if (history.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Historial de estados
      </h4>
      <ol className="space-y-1.5">
        {[...history].reverse().map((transition) => (
          <li key={transition.id} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-foreground font-medium">{transition.changedBy.displayName}</span>
            {transition.fromStatus && (
              <>
                <span className={`rounded px-1.5 py-0.5 ${statusColors[transition.fromStatus]}`}>
                  {transition.fromStatus}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0" />
              </>
            )}
            <span className={`rounded px-1.5 py-0.5 ${statusColors[transition.toStatus]}`}>
              {transition.toStatus}
            </span>
            <span className="ml-auto shrink-0">{formatRelativeDate(transition.changedAt)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
