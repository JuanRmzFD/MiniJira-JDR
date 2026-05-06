import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/shared/components/Sidebar'
import { ViewportWarning } from '@/shared/components/ViewportWarning'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-ds-surface">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <ViewportWarning />
    </div>
  )
}
