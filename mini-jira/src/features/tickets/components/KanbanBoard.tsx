import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { KanbanColumn } from '@/features/tickets/components/KanbanColumn'
import { TaskCard } from '@/features/tickets/components/TaskCard'
import { useChangeStatus } from '@/features/tickets/hooks/useChangeStatus'
import { filtersStore } from '@/features/tickets/store/filtersStore'
import { sessionStore } from '@/features/auth/store/sessionStore'
import type { Ticket, TicketStatus } from '@/shared/types'

const STATUSES: TicketStatus[] = ['Por hacer', 'En progreso', 'Listo']

const STATUS_ORDER: Record<TicketStatus, number> = {
  'Por hacer':   0,
  'En progreso': 1,
  'Listo':       2,
}

interface KanbanBoardProps {
  tickets: Ticket[]
  onTicketClick: (id: string) => void
}

export function KanbanBoard({ tickets, onTicketClick }: KanbanBoardProps) {
  const queryClient = useQueryClient()
  const filters = filtersStore((s) => s.filters)
  const user = sessionStore((s) => s.user)
  const changeStatus = useChangeStatus()

  const byStatus = STATUSES.reduce<Record<TicketStatus, Ticket[]>>(
    (acc, status) => {
      acc[status] = tickets.filter((t) => t.status === status)
      return acc
    },
    { 'Por hacer': [], 'En progreso': [], 'Listo': [] }
  )

  function handleDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result

    if (!destination) return
    if (source.droppableId === destination.droppableId) return

    const toStatus = destination.droppableId as TicketStatus
    const ticket = tickets.find((t) => t.id === draggableId)
    if (!ticket) return

    if (STATUS_ORDER[toStatus] < STATUS_ORDER[ticket.status] && user?.role !== 'admin') {
      toast.error('Solo los administradores pueden revertir el estado de un ticket.')
      return
    }

    // Actualización optimista
    queryClient.setQueryData(
      ['tickets', filters],
      (old: Ticket[] | undefined) =>
        old?.map((t) => (t.id === draggableId ? { ...t, status: toStatus } : t)) ?? old
    )

    changeStatus.mutate(
      { id: ticket.id, status: toStatus, version: ticket.version },
      {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: ['tickets'] })
        },
      }
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-gutter px-container-px pb-8">
        {STATUSES.map((status) => (
          <Droppable droppableId={status} key={status}>
            {(provided, snapshot) => (
              <KanbanColumn
                status={status}
                count={byStatus[status].length}
                isDraggingOver={snapshot.isDraggingOver}
              >
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-h-[200px] space-y-2"
                >
                  {byStatus[status].map((ticket, index) => (
                    <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <TaskCard
                            ticket={ticket}
                            onClick={() => onTicketClick(ticket.id)}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </KanbanColumn>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  )
}
