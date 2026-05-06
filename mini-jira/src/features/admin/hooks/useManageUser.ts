import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/lib/api'
import type { User, UserRole } from '@/shared/types'

export function useManageUser() {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      api.patch<User>(`/api/users/${id}/role`, { role }),
    onSuccess: invalidate,
  })

  const deactivate = useMutation({
    mutationFn: (id: string) => api.patch<User>(`/api/users/${id}/deactivate`),
    onSuccess: invalidate,
  })

  const reactivate = useMutation({
    mutationFn: (id: string) => api.patch<User>(`/api/users/${id}/reactivate`),
    onSuccess: invalidate,
  })

  return { changeRole, deactivate, reactivate }
}
