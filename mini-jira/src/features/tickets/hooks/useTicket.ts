import { useQuery } from '@tanstack/react-query'
import { ticketsApi } from '@/lib/api'

export function useTicket(id: string | null) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.get(id!),
    enabled: !!id,
  })
}
