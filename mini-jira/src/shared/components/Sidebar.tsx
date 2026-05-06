import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Kanban, ListTodo, Settings, HelpCircle, Plus, LogOut } from 'lucide-react'
import { sessionStore } from '@/features/auth/store/sessionStore'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { cn } from '@/shared/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' as string | null },
  { label: 'Board', icon: Kanban, to: '/board' as string | null },
  { label: 'Tasks', icon: ListTodo, to: null },
  { label: 'Settings', icon: Settings, to: null },
]

export function Sidebar() {
  const user = sessionStore((s) => s.user)
  const { logout, isPending } = useLogout()

  return (
    <aside className="w-[168px] flex-shrink-0 bg-ds-surface-container-low border-r border-ds-outline-variant flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-ds-primary flex items-center justify-center flex-shrink-0">
            <Kanban className="h-3.5 w-3.5 text-ds-on-primary" />
          </div>
          <span className="text-btn font-semibold text-ds-on-surface leading-none">Mini Jira</span>
        </div>
        <span className="text-body-sm text-ds-on-surface-variant pl-8">
          {user?.displayName?.split(' ').slice(0, 2).join(' ') ?? 'Engineering Team'}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) =>
          to ? (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded px-3 py-2 text-body-sm transition-colors',
                  isActive
                    ? 'bg-ds-primary-fixed text-ds-on-primary-fixed font-medium'
                    : 'text-ds-on-surface-variant hover:bg-ds-surface-container'
                )
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </NavLink>
          ) : (
            <span
              key={label}
              className="flex items-center gap-3 rounded px-3 py-2 text-body-sm text-ds-on-surface-variant opacity-40 cursor-not-allowed select-none"
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </span>
          )
        )}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-2 px-2 pb-4">
        <button
          type="button"
          className="flex items-center gap-3 rounded px-3 py-2 text-body-sm text-ds-on-surface-variant hover:bg-ds-surface-container transition-colors w-full text-left"
        >
          <HelpCircle className="h-4 w-4 flex-shrink-0" />
          Help Center
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded bg-ds-primary text-ds-on-primary text-btn w-full px-3 py-2 hover:bg-ds-primary-container transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>

        {/* Divider + usuario + logout */}
        <div className="border-t border-ds-outline-variant mt-1 pt-3 flex flex-col gap-1">
          <div className="px-3 py-1">
            <p className="text-body-sm font-medium text-ds-on-surface truncate">
              {user?.displayName ?? ''}
            </p>
            <p className="text-label-caps uppercase tracking-[0.05em] text-ds-on-surface-variant truncate">
              {user?.role === 'admin' ? 'Admin' : 'Usuario'}
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => logout()}
            className="flex items-center gap-3 rounded px-3 py-2 text-body-sm text-ds-error hover:bg-ds-error-container transition-colors w-full text-left disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {isPending ? 'Cerrando...' : 'Cerrar sesión'}
          </button>
        </div>
      </div>
    </aside>
  )
}
