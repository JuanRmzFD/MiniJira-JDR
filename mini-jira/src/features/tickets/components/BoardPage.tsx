import { useState } from 'react'
import { Plus } from 'lucide-react'
import { filtersStore } from '@/features/tickets/store/filtersStore'
import { useTickets } from '@/features/tickets/hooks/useTickets'
import { KanbanBoard } from '@/features/tickets/components/KanbanBoard'
import { TicketListView } from '@/features/tickets/components/TicketListView'
import { TicketModal } from '@/features/tickets/components/TicketModal'
import { CreateTicketModal } from '@/features/tickets/components/CreateTicketModal'
import { FilterBar } from '@/features/tickets/components/FilterBar'
import { ViewToggle } from '@/features/tickets/components/ViewToggle'
import { Button } from '@/shared/components/ui/button'
import { useUsers } from '@/features/admin/hooks/useUsers'

export function BoardPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const activeView = filtersStore((s) => s.activeView)

  const { data: tickets = [], isLoading } = useTickets()
  const { data: users = [] } = useUsers()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tablero</h1>
        <div className="flex items-center gap-2">
          <ViewToggle />
          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nuevo ticket
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <FilterBar users={users} />

      {/* Vista */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ds-primary border-t-transparent" />
        </div>
      ) : activeView === 'kanban' ? (
        <KanbanBoard tickets={tickets} onTicketClick={setSelectedTicketId} />
      ) : (
        <TicketListView tickets={tickets} onTicketClick={setSelectedTicketId} />
      )}

      {/* Modales */}
      <TicketModal
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        users={users}
      />
      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        users={users}
      />
    </div>
  )
}
