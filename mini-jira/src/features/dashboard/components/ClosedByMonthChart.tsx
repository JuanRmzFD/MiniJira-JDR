import { BarChart, Card, Title } from '@tremor/react'
import { formatMonth } from '@/shared/lib/utils'

interface Props {
  data: { month: string; count: number }[]
}

export function ClosedByMonthChart({ data }: Props) {
  const chartData = data.map((d) => ({
    mes: formatMonth(d.month),
    'Tickets cerrados': d.count,
  }))

  return (
    <Card>
      <Title>Tickets cerrados por mes</Title>
      <BarChart
        className="mt-4 h-48"
        data={chartData}
        index="mes"
        categories={['Tickets cerrados']}
        colors={['blue']}
        showLegend={false}
        showGridLines={false}
      />
    </Card>
  )
}
