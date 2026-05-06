import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketsApi } from '@/lib/api'
import type { CreateTicketInput } from '@/lib/api'

export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTicketInput) => ticketsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
