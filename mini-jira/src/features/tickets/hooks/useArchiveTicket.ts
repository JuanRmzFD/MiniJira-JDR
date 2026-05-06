import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketsApi } from '@/lib/api'

export function useArchiveTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, restore }: { id: string; restore?: boolean }) =>
      restore ? ticketsApi.restore(id) : ticketsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
