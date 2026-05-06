import { formatDate } from '@/shared/lib/utils'
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import type { Ticket } from '@/shared/types'

const statusColor: Record<string, string> = {
  'Por hacer': 'bg-slate-100 text-slate-700',
  'En progreso': 'bg-blue-100 text-blue-700',
  'Listo': 'bg-green-100 text-green-700',
}

const priorityVariant: Record<string, 'destructive' | 'default' | 'secondary'> = {
  Alta: 'destructive',
  Media: 'default',
  Baja: 'secondary',
}

interface Props {
  tickets: Ticket[]
  onTicketClick: (id: string) => void
}

export function TicketListView({ tickets, onTicketClick }: Props) {
  return (
    <div className="rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-muted-foreground">
            <th className="px-4 py-3 text-left font-medium">ID</th>
            <th className="px-4 py-3 text-left font-medium">Título</th>
            <th className="px-4 py-3 text-left font-medium">Estado</th>
            <th className="px-4 py-3 text-left font-medium">Prioridad</th>
            <th className="px-4 py-3 text-left font-medium">Asignado a</th>
            <th className="px-4 py-3 text-left font-medium">Creado por</th>
            <th className="px-4 py-3 text-left font-medium">Fecha creación</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                No hay tickets que mostrar.
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => onTicketClick(ticket.id)}
                className="border-b cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  #{ticket.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 font-medium max-w-xs truncate">{ticket.title}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColor[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {ticket.priority ? (
                    <Badge variant={priorityVariant[ticket.priority]} className="text-xs">
                      {ticket.priority}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {ticket.assignedTo ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">
                          {ticket.assignedTo.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {ticket.assignedTo.displayName}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sin asignar</span>
                  )}
                </td>
                <td className="px-4 py-3">{ticket.createdBy.displayName}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(ticket.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
