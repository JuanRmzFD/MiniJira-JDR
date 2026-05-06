import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ticketsApi } from '@/lib/api'
import type { UpdateTicketInput } from '@/lib/api'
import type { Ticket } from '@/shared/types'

interface UpdateTicketMutationInput extends UpdateTicketInput {
  id: string
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTicketMutationInput) =>
      ticketsApi.update(id, data),
    onSuccess: (ticket: Ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.setQueryData(['ticket', ticket.id], (old: unknown) =>
        old ? { ...(old as object), ...ticket } : ticket,
      )
    },
    onError: (err: Error & { statusCode?: number }) => {
      if (err.statusCode === 409) {
        toast.error(
          'Otro usuario modificó este ticket mientras lo editabas. Recarga para ver los cambios.',
        )
      }
    },
  })
}
