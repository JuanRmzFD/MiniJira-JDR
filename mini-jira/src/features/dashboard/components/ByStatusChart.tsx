import { DonutChart, Card, Title, Legend } from '@tremor/react'
import type { TicketStatus } from '@/shared/types'

const STATUS_COLORS: Record<TicketStatus, string> = {
  'Por hacer': 'slate',
  'En progreso': 'blue',
  'Listo': 'green',
}

interface Props {
  data: { status: TicketStatus; count: number }[]
}

export function ByStatusChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: d.status,
    value: d.count,
  }))

  const colors = data.map((d) => STATUS_COLORS[d.status])

  return (
    <Card>
      <Title>Tickets por estado (activos)</Title>
      <DonutChart
        className="mt-4 h-48"
        data={chartData}
        index="name"
        category="value"
        colors={colors}
        showLabel={true}
      />
      <Legend
        className="mt-2"
        categories={data.map((d) => d.status)}
        colors={colors}
      />
    </Card>
  )
}
