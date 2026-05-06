import { useQuery } from '@tanstack/react-query'
import { ticketsApi } from '@/lib/api'
import { filtersStore } from '@/features/tickets/store/filtersStore'

export function useTickets() {
  const filters = filtersStore((s) => s.filters)

  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => ticketsApi.list(filters),
  })
}
