import { ArrowRight, RotateCcw, CheckCircle } from 'lucide-react'
import { sessionStore } from '@/features/auth/store/sessionStore'
import { useChangeStatus } from '@/features/tickets/hooks/useChangeStatus'
import { Button } from '@/shared/components/ui/button'
import type { Ticket } from '@/shared/types'

interface Props {
  ticket: Ticket
}

export function StatusTransitionButtons({ ticket }: Props) {
  const user = sessionStore((s) => s.user)
  const { mutate: changeStatus, isPending } = useChangeStatus()

  if (!user || ticket.isArchived) return null

  const isAdmin = user.role === 'admin'
  const canAdvance =
    ticket.createdBy.id === user.id ||
    ticket.assignedTo?.id === user.id ||
    isAdmin

  const advance = (status: typeof ticket.status) => {
    changeStatus({ id: ticket.id, status, version: ticket.version })
  }

  return (
    <div className="flex items-center gap-2">
      {ticket.status === 'Por hacer' && canAdvance && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => advance('En progreso')}
          disabled={isPending}
          className="gap-1.5"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Mover a En progreso
        </Button>
      )}
      {ticket.status === 'En progreso' && canAdvance && (
        <Button
          size="sm"
          onClick={() => advance('Listo')}
          disabled={isPending}
          className="gap-1.5"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Marcar como Listo
        </Button>
      )}
      {ticket.status === 'Listo' && isAdmin && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => advance('En progreso')}
          disabled={isPending}
          className="gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Revertir a En progreso
        </Button>
      )}
    </div>
  )
}
