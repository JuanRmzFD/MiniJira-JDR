import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import type { User } from '@/shared/types'

export function useLogin() {
  const mutation = useMutation<User, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => authApi.login(email, password),
  })

  return {
    login: (email: string, password: string) =>
      mutation.mutateAsync({ email, password }),
    isPending: mutation.isPending,
  }
}
