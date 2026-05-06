import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { sessionStore } from '@/features/auth/store/sessionStore'
import { useUpdateTicket } from '@/features/tickets/hooks/useUpdateTicket'
import { MarkdownField } from '@/features/tickets/components/MarkdownField'
import { TagInput } from '@/features/tickets/components/TagInput'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import type { TicketDetail, User } from '@/shared/types'

const schema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(150, 'Máximo 150 caracteres'),
  description: z.string().optional(),
  priority: z.enum(['Baja', 'Media', 'Alta', 'none']).optional(),
  assignedToId: z.string().optional().nullable(),
  labels: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  ticket: TicketDetail
  users: User[]
  onCancel: () => void
  onSuccess: () => void
}

export function TicketEditForm({ ticket, users, onCancel, onSuccess }: Props) {
  const user = sessionStore((s) => s.user)
  const queryClient = useQueryClient()
  const { mutate: updateTicket, isPending } = useUpdateTicket()

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: ticket.title,
      description: ticket.description ?? '',
      priority: ticket.priority ?? 'none',
      assignedToId: ticket.assignedTo?.id ?? null,
      labels: ticket.labels,
    },
  })

  const onSubmit = (values: FormValues) => {
    updateTicket(
      {
        id: ticket.id,
        version: ticket.version,
        title: values.title,
        description: values.description || null,
        priority: values.priority === 'none' ? null : values.priority,
        labels: values.labels,
        ...(user?.role === 'admin' && {
          assignedToId: values.assignedToId ?? null,
        }),
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] })
          onSuccess()
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Título *</label>
        <Input {...register('title')} maxLength={150} />
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
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
