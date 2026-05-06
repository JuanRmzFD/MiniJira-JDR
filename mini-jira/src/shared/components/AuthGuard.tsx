import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '@/features/auth/hooks/useSession'

export function AuthGuard() {
  const { isLoading, isAuthenticated } = useSession()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
