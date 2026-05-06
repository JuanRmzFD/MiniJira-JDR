import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/lib/api'
import type { User } from '@/shared/types'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/api/users'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}
