import { Archive, ArchiveRestore } from 'lucide-react'
import { sessionStore } from '@/features/auth/store/sessionStore'
import { useArchiveTicket } from '@/features/tickets/hooks/useArchiveTicket'
import { Button } from '@/shared/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog'
import type { Ticket } from '@/shared/types'

interface Props {
  ticket: Ticket
  onSuccess?: () => void
}

export function ArchiveButton({ ticket, onSuccess }: Props) {
  const user = sessionStore((s) => s.user)
  const { mutate: archiveTicket, isPending } = useArchiveTicket()

  if (!user) return null

  const isAdmin = user.role === 'admin'
  const isCreator = ticket.createdBy.id === user.id

  if (ticket.isArchived) {
    if (!isAdmin) return null
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => archiveTicket({ id: ticket.id, restore: true }, { onSuccess })}
        disabled={isPending}
        className="gap-1.5"
      >
        <ArchiveRestore className="h-3.5 w-3.5" />
        Restaurar
      </Button>
    )
  }

  if (!isCreator && !isAdmin) return null

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
          <Archive className="h-3.5 w-3.5" />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Archivar este ticket?</AlertDialogTitle>
          <AlertDialogDescription>
            Permanecerá en el sistema pero quedará oculto del tablero. Un admin puede restaurarlo en cualquier momento.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => archiveTicket({ id: ticket.id }, { onSuccess })}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Archivar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
