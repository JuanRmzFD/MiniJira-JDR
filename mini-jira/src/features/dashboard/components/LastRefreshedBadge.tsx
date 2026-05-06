import { Clock } from 'lucide-react'
import { formatRelativeDate } from '@/shared/lib/utils'

interface Props {
  lastRefreshedAt: string
}

export function LastRefreshedBadge({ lastRefreshedAt }: Props) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      Actualizado {formatRelativeDate(lastRefreshedAt)}
    </span>
  )
}
