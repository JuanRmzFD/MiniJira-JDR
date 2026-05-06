import { useQuery } from '@tanstack/react-query'
import { commentsApi } from '@/lib/api'

export function useComments(ticketId: string) {
  return useQuery({
    queryKey: ['comments', ticketId],
    queryFn: () => commentsApi.list(ticketId),
    enabled: !!ticketId,
  })
}
