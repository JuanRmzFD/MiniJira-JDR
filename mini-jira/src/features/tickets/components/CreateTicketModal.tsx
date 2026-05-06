import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { sessionStore } from '@/features/auth/store/sessionStore'
import { useCreateTicket } from '@/features/tickets/hooks/useCreateTicket'
import { MarkdownField } from '@/features/tickets/components/MarkdownField'
import { TagInput } from '@/features/tickets/components/TagInput'
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
import type { User } from '@/shared/types'

const schema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(150, 'Máximo 150 caracteres'),
  description: z.string().optional(),
  priority: z.enum(['Baja', 'Media', 'Alta', 'none']).optional(),
  assignedToId: z.string().optional().nullable(),
  labels: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  users: User[]
}

export function CreateTicketModal({ open, onClose, users }: Props) {
  const user = sessionStore((s) => s.user)
  const { mutate: createTicket, isPending } = useCreateTicket()

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'none',
      assignedToId: null,
      labels: [],
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = (values: FormValues) => {
    createTicket(
      {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority === 'none' ? undefined : values.priority,
        assignedToId: user?.role === 'admin' ? values.assignedToId : undefined,
        labels: values.labels,
      },
      { onSuccess: handleClose },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nuevo ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Título *</label>
            <Input {...register('title')} maxLength={150} placeholder="Qué hay que hacer..." autoFocus />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Descripción</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <MarkdownField value={field.value ?? ''} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Prioridad</label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? 'none'} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin prioridad</SelectItem>
                      <SelectItem value="Baja">Baja</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {user?.role === 'admin' && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Asignado a</label>
                <Controller
                  name="assignedToId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? 'unassigned'}
                      onValueChange={(v) => field.onChange(v === 'unassigned' ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Sin asignar</SelectItem>
                        {users.filter((u) => u.isActive).map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Etiquetas</label>
            <Controller
              name="labels"
              control={control}
              render={({ field }) => (
                <TagInput value={field.value ?? []} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creando...' : 'Crear ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
