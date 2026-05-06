import { Link, NavLink } from 'react-router-dom'
import { LogOut, Users, LayoutDashboard, Kanban } from 'lucide-react'
import { sessionStore } from '@/features/auth/store/sessionStore'
import { Button } from '@/shared/components/ui/button'
import { authApi } from '@/lib/api'

export function TopNav() {
  const user = sessionStore((s) => s.user)
  const clearUser = sessionStore((s) => s.clearUser)

  const handleLogout = async () => {
    await authApi.logout().catch(() => null)
    clearUser()
    window.location.href = '/login'
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center gap-4 px-6">
        <Link to="/board" className="flex items-center gap-2 font-semibold text-foreground">
          <Kanban className="h-5 w-5" />
          Mini Jira
        </Link>

        <nav className="flex items-center gap-1 ml-4">
          <NavLink to="/board" className={navLinkClass}>
            <Kanban className="h-4 w-4" />
            Tablero
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin/users" className={navLinkClass}>
              <Users className="h-4 w-4" />
              Usuarios
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.displayName}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  )
}
