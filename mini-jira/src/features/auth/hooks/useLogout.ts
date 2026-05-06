import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { sessionStore } from '@/features/auth/store/sessionStore'

export function useLogout() {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      queryClient.clear()
      sessionStore.getState().clearUser()
      window.location.href = '/login'
    },
  })

  return { logout: mutate, isPending }
}
