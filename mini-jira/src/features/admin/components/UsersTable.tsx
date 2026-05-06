import { useManageUser } from '@/features/admin/hooks/useManageUser'
import { RoleToggleButton } from '@/features/admin/components/RoleToggleButton'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog'
import type { User } from '@/shared/types'

interface Props {
  users: User[]
}

export function UsersTable({ users }: Props) {
  const { deactivate, reactivate } = useManageUser()

  const activeAdmins = users.filter((u) => u.role === 'admin' && u.isActive)
  const isOnlyAdmin = activeAdmins.length === 1

  return (
    <div className="rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-muted-foreground">
            <th className="px-4 py-3 text-left font-medium">Nombre</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Rol</th>
            <th className="px-4 py-3 text-left font-medium">Estado</th>
            <th className="px-4 py-3 text-left font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const blockedDeactivate = user.role === 'admin' && isOnlyAdmin && user.isActive
            return (
              <tr key={user.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{user.displayName}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Admin' : 'Usuario'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.isActive ? 'default' : 'outline'} className={!user.isActive ? 'text-muted-foreground' : ''}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <RoleToggleButton user={user} isOnlyAdmin={isOnlyAdmin} />
                    {user.isActive ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={blockedDeactivate || deactivate.isPending}
                            title={blockedDeactivate ? 'Debe existir al menos un admin activo.' : undefined}
                            className="text-xs text-destructive hover:text-destructive"
                          >
                            Desactivar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Desactivar a {user.displayName}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Su sesión activa quedará invalidada inmediatamente y no podrá acceder al sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deactivate.mutate(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Desactivar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => reactivate.mutate(user.id)}
                        disabled={reactivate.isPending}
                        className="text-xs"
                      >
                        Reactivar
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
