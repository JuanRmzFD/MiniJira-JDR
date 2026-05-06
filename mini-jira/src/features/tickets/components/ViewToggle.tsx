import { LayoutGrid, List } from 'lucide-react'
import { filtersStore } from '@/features/tickets/store/filtersStore'
import { Button } from '@/shared/components/ui/button'

export function ViewToggle() {
  const { activeView, setActiveView } = filtersStore()

  return (
    <div className="flex items-center rounded-md border">
      <Button
        variant={activeView === 'kanban' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setActiveView('kanban')}
        className="rounded-r-none gap-1.5 h-8"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Kanban
      </Button>
      <Button
        variant={activeView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setActiveView('list')}
        className="rounded-l-none gap-1.5 h-8"
      >
        <List className="h-3.5 w-3.5" />
        Lista
      </Button>
    </div>
  )
}
