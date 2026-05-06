import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Pencil } from 'lucide-react'
import { sessionStore } from '@/features/auth/store/sessionStore'
import { useTicket } from '@/features/tickets/hooks/useTicket'
import { TicketEditForm } from '@/features/tickets/components/TicketEditForm'
import { StatusTransitionButtons } from '@/features/tickets/components/StatusTransitionButtons'
import { ArchiveButton } from '@/features/tickets/components/ArchiveButton'
import { StateHistoryTimeline } from '@/features/tickets/components/StateHistoryTimeline'
import { CommentSection } from '@/features/comments/components/CommentSection'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { formatDate } from '@/shared/lib/utils'
import type { User } from '@/shared/types'

const priorityColor: Record<string, string> = {
  Alta: 'destructive',
  Media: 'default',
  Baja: 'secondary',
}

interface Props {
  ticketId: string | null
  onClose: () => void
  users: User[]
}

export function TicketModal({ ticketId, onClose, users }: Props) {
  const [editing, setEditing] = useState(false)
  const { data: ticket, isLoading } = useTicket(ticketId)
  const user = sessionStore((s) => s.user)

  const handleClose = () => {
    setEditing(false)
    onClose()
  }

  const canEdit =
    user &&
    ticket &&
    (ticket.createdBy.id === user.id || user.role === 'admin')

  return (
    <Dialog open={!!ticketId} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading || !ticket ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-2">
                <DialogTitle className="text-base leading-snug pr-4">
                  <span className="text-muted-foreground font-normal text-sm mr-2">#{ticket.id.slice(0, 8)}</span>
                  {ticket.title}
                  {ticket.isArchived && (
                    <Badge variant="outline" className="ml-2 text-xs">Archivado</Badge>
                  )}
                </DialogTitle>
                {canEdit && !editing && !ticket.isArchived && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="shrink-0 gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-5">
              {/* Estado */}
              {!editing && (
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusTransitionButtons ticket={ticket} />
                </div>
              )}

              {/* Formulario de edición o vista de lectura */}
              {editing ? (
                <TicketEditForm
                  ticket={ticket}
                  users={users}
                  onCancel={() => setEditing(false)}
                  onSuccess={() => setEditing(false)}
                />
              ) : (
                <div className="grid gap-4">
                  {/* Descripción */}
                  {ticket.description && (
                    <div className="prose prose-sm max-w-none rounded-md bg-muted/40 p-3">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {ticket.description}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Metadatos */}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Prioridad</dt>
                      <dd>
                        {ticket.priority ? (
                          <Badge variant={priorityColor[ticket.priority] as 'destructive' | 'default' | 'secondary'}>
                            {ticket.priority}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Asignado a</dt>
                      <dd className="flex items-center gap-1.5">
                        {ticket.assignedTo ? (
                          <>
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px]">
                                {ticket.assignedTo.displayName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {ticket.assignedTo.displayName}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Sin asignar</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Creado por</dt>
                      <dd>{ticket.createdBy.displayName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Fecha de creación</dt>
                      <dd>{formatDate(ticket.createdAt)}</dd>
                    </div>
                    {ticket.closedAt && (
                      <div>
                        <dt className="text-muted-foreground">Fecha de cierre</dt>
                        <dd>{formatDate(ticket.closedAt)}</dd>
                      </div>
                    )}
                  </dl>

                  {/* Etiquetas */}
                  {ticket.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {ticket.labels.map((label) => (
                        <Badge key={label} variant="outline" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <hr />

              {/* Historial */}
              <StateHistoryTimeline history={ticket.history} />

              <hr />

              {/* Comentarios */}
              <CommentSection ticketId={ticket.id} isArchived={ticket.isArchived} />

              {/* Footer: archivar */}
              {!editing && (
                <div className="flex justify-start pt-1">
                  <ArchiveButton ticket={ticket} onSuccess={handleClose} />
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
