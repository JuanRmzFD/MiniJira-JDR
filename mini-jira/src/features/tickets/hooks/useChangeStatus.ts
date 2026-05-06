import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ticketsApi } from '@/lib/api'
import type { ChangeStatusInput } from '@/lib/api'
import type { Ticket } from '@/shared/types'

interface ChangeStatusMutationInput extends ChangeStatusInput {
  id: string
}

export function useChangeStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: ChangeStatusMutationInput) =>
      ticketsApi.changeStatus(id, data),
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
