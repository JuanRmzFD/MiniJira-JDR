import { useState } from 'react'
import { Download } from 'lucide-react'
import { useDashboardMetrics } from '@/features/dashboard/hooks/useDashboardMetrics'
import { ClosedByMonthChart } from '@/features/dashboard/components/ClosedByMonthChart'
import { ByStatusChart } from '@/features/dashboard/components/ByStatusChart'
import { ByAssigneeList } from '@/features/dashboard/components/ByAssigneeList'
import { LastRefreshedBadge } from '@/features/dashboard/components/LastRefreshedBadge'
import { ExportCSVModal } from '@/features/dashboard/components/ExportCSVModal'
import { Button } from '@/shared/components/ui/button'

export function DashboardPage() {
  const [exportOpen, setExportOpen] = useState(false)
  const { data: metrics, isLoading } = useDashboardMetrics()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          {metrics && <LastRefreshedBadge lastRefreshedAt={metrics.lastRefreshedAt} />}
        </div>
        <Button onClick={() => setExportOpen(true)} variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ClosedByMonthChart data={metrics.closedByMonth} />
          <ByStatusChart data={metrics.byStatus} />
          <ByAssigneeList data={metrics.byAssignee} />
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-16">
          No se pudieron cargar las métricas.
        </p>
      )}

      <ExportCSVModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  )
}
