import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useUsers } from '@/features/admin/hooks/useUsers'
import { UsersTable } from '@/features/admin/components/UsersTable'
import { CreateUserModal } from '@/features/admin/components/CreateUserModal'
import { Button } from '@/shared/components/ui/button'

export function AdminUsersPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: users = [], isLoading } = useUsers()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Gestión de usuarios</h1>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Crear usuario
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <UsersTable users={users} />
      )}

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
