import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/lib/api'
import type { DashboardMetrics } from '@/shared/types'

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.get<DashboardMetrics>('/api/dashboard/metrics'),
    staleTime: 15 * 60 * 1000,
    retry: 1,
  })
}
