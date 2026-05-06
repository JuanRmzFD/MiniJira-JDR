import { ShieldCheck, User as UserIcon } from 'lucide-react'
import { useManageUser } from '@/features/admin/hooks/useManageUser'
import { Button } from '@/shared/components/ui/button'
import type { User } from '@/shared/types'

interface Props {
  user: User
  isOnlyAdmin: boolean
}

export function RoleToggleButton({ user, isOnlyAdmin }: Props) {
  const { changeRole } = useManageUser()
  const blocked = user.role === 'admin' && isOnlyAdmin

  return (
    <Button
      variant="ghost"
      size="sm"
      title={blocked ? 'Debe existir al menos un admin activo en el sistema.' : undefined}
      disabled={blocked || changeRole.isPending}
      onClick={() =>
        changeRole.mutate({
          id: user.id,
          role: user.role === 'admin' ? 'user' : 'admin',
        })
      }
      className="gap-1.5 text-xs"
    >
      {user.role === 'admin' ? (
        <>
          <UserIcon className="h-3.5 w-3.5" />
          Degradar
        </>
      ) : (
        <>
          <ShieldCheck className="h-3.5 w-3.5" />
          Promover
        </>
      )}
    </Button>
  )
}
