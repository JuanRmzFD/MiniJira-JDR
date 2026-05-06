import { BarList, Card, Title } from '@tremor/react'
import type { User } from '@/shared/types'

interface Props {
  data: { user: User; count: number }[]
}

export function ByAssigneeList({ data }: Props) {
  const listData = data.map((d) => ({
    name: d.user.displayName,
    value: d.count,
  }))

  return (
    <Card>
      <Title>Tickets por usuario asignado</Title>
      {listData.length > 0 ? (
        <BarList className="mt-4" data={listData} color="blue" />
      ) : (
        <p className="mt-4 text-sm text-muted-foreground text-center py-8">
          Sin datos de asignaciones.
        </p>
      )}
    </Card>
  )
}
