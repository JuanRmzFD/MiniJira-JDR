import { useMutation, useQueryClient } from '@tanstack/react-query'
import { commentsApi } from '@/lib/api'

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => commentsApi.create(ticketId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] })
    },
  })
}
