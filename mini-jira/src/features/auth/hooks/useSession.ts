import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { sessionStore } from '@/features/auth/store/sessionStore'

export function useSession() {
  const user = sessionStore((s) => s.user)

  const { isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const data = await authApi.me()
      sessionStore.getState().setUser(data)
      return data
    },
    staleTime: Infinity,
    retry: false,
  })

  return {
    isLoading,
    isAuthenticated: !!user,
    user,
  }
}
