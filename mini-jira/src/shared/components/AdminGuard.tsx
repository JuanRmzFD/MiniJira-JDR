import { Navigate, Outlet } from 'react-router-dom'
import { sessionStore } from '@/features/auth/store/sessionStore'

export function AdminGuard() {
  const user = sessionStore((s) => s.user)

  if (user?.role !== 'admin') {
    return <Navigate to="/board" replace />
  }

  return <Outlet />
}
