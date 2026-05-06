import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateUser } from '@/features/admin/hooks/useCreateUser'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

const schema = z.object({
  email: z.string().email('Email inválido'),
  displayName: z.string().min(1, 'El nombre es obligatorio'),
  role: z.enum(['admin', 'user']),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateUserModal({ open, onClose }: Props) {
  const { mutate: createUser, isPending } = useCreateUser()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', displayName: '', role: 'user' },
  })

  const handleClose = () => { reset(); onClose() }

  const onSubmit = (values: FormValues) => {
    createUser(values, { onSuccess: handleClose })
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Email corporativo *</label>
            <Input {...register('email')} type="email" placeholder="nombre@empresa.com" autoFocus />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Nombre de display *</label>
            <Input {...register('displayName')} placeholder="Nombre Apellido" />
            {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Rol</label>
            <Select value={watch('role')} onValueChange={(v) => setValue('role', v as 'admin' | 'user')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Creando...' : 'Crear usuario'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
