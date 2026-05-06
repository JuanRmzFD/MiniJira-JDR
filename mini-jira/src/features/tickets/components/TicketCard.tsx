import { MessageSquare } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import type { Ticket } from '@/shared/types'

const priorityVariant: Record<string, 'destructive' | 'default' | 'secondary'> = {
  Alta: 'destructive',
  Media: 'default',
  Baja: 'secondary',
}

interface Props {
  ticket: Ticket
  onClick: () => void
}

export function TicketCard({ ticket, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border bg-card p-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all space-y-2"
    >
      <p className="text-sm font-medium leading-snug line-clamp-2">{ticket.title}</p>

      <div className="flex flex-wrap gap-1">
        {ticket.labels.slice(0, 2).map((label) => (
          <Badge key={label} variant="outline" className="text-xs px-1.5 py-0">
            {label}
          </Badge>
        ))}
        {ticket.labels.length > 2 && (
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            +{ticket.labels.length - 2}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {ticket.priority && (
            <Badge variant={priorityVariant[ticket.priority]} className="text-xs px-1.5 py-0">
              {ticket.priority}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {ticket.assignedTo && (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">
                {ticket.assignedTo.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            0
          </span>
        </div>
      </div>
    </div>
  )
}
