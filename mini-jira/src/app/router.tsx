import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGuard } from '@/shared/components/AuthGuard'
import { AdminGuard } from '@/shared/components/AdminGuard'
import { AppLayout } from '@/shared/components/AppLayout'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { BoardPage } from '@/features/tickets/components/BoardPage'
import { DashboardPage } from '@/features/dashboard/components/DashboardPage'
import { AdminUsersPage } from '@/features/admin/components/AdminUsersPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/board" replace /> },
          { path: '/board', element: <BoardPage /> },
          { path: '/dashboard', element: <DashboardPage /> },
          {
            element: <AdminGuard />,
            children: [{ path: '/admin/users', element: <AdminUsersPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/board" replace /> },
])
