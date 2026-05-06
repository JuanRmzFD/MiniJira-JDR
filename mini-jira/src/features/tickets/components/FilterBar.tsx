import { X } from 'lucide-react'
import { filtersStore } from '@/features/tickets/store/filtersStore'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Switch } from '@/shared/components/ui/switch'
import type { TicketPriority, TicketStatus, User } from '@/shared/types'

interface Props {
  users: User[]
}

export function FilterBar({ users }: Props) {
  const { filters, setFilter, resetFilters } = filtersStore()

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.labels.length > 0 ||
    filters.assignedToId !== null ||
    filters.createdFrom !== null ||
    filters.createdTo !== null ||
    filters.showArchived

  const toggleStatus = (s: TicketStatus) => {
    setFilter({
      status: filters.status.includes(s)
        ? filters.status.filter((x) => x !== s)
        : [...filters.status, s],
    })
  }

  const togglePriority = (p: TicketPriority) => {
    setFilter({
      priority: filters.priority.includes(p)
        ? filters.priority.filter((x) => x !== p)
        : [...filters.priority, p],
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
      {/* Estado */}
      <div className="flex items-center gap-1">
        {(['Por hacer', 'En progreso', 'Listo'] as TicketStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              filters.status.includes(s)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Prioridad */}
      <div className="flex items-center gap-1">
        {(['Alta', 'Media', 'Baja'] as TicketPriority[]).map((p) => (
          <button
            key={p}
            onClick={() => togglePriority(p)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              filters.priority.includes(p)
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Asignado a */}
      <Select
        value={filters.assignedToId ?? 'all'}
        onValueChange={(v) => setFilter({ assignedToId: v === 'all' ? null : v })}
      >
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue placeholder="Asignado a" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="unassigned">Sin asignar</SelectItem>
          {users.filter((u) => u.isActive).map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Rango de fechas */}
      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={filters.createdFrom ?? ''}
          onChange={(e) => setFilter({ createdFrom: e.target.value || null })}
          className="h-8 w-[140px] text-xs"
          placeholder="Desde"
        />
        <span className="text-muted-foreground text-xs">—</span>
        <Input
          type="date"
          value={filters.createdTo ?? ''}
          onChange={(e) => setFilter({ createdTo: e.target.value || null })}
          className="h-8 w-[140px] text-xs"
          placeholder="Hasta"
        />
      </div>

      {/* Archivados */}
      <div className="flex items-center gap-1.5">
        <Switch
          id="show-archived"
          checked={filters.showArchived}
          onCheckedChange={(v) => setFilter({ showArchived: v })}
          className="scale-75"
        />
        <label htmlFor="show-archived" className="text-xs text-muted-foreground cursor-pointer">
          Mostrar archivados
        </label>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 gap-1 text-xs ml-auto">
          <X className="h-3 w-3" />
          Limpiar
        </Button>
      )}
    </div>
  )
}
