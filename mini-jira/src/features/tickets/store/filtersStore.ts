import { create } from 'zustand'
import type { TicketFilters } from '@/shared/types'

const DEFAULT_FILTERS: TicketFilters = {
  status: [],
  priority: [],
  labels: [],
  assignedToId: null,
  createdFrom: null,
  createdTo: null,
  showArchived: false,
}

interface FiltersStore {
  filters: TicketFilters
  activeView: 'kanban' | 'list'
  setFilter: (partial: Partial<TicketFilters>) => void
  resetFilters: () => void
  setActiveView: (view: 'kanban' | 'list') => void
}

export const filtersStore = create<FiltersStore>((set) => ({
  filters: DEFAULT_FILTERS,
  activeView: 'kanban',
  setFilter: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
  setActiveView: (view) => set({ activeView: view }),
}))
