import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/shared/lib/api'
import type { ExportType } from '@/shared/types'

interface ExportParams {
  type: ExportType
  from: string // YYYY-MM
  to: string   // YYYY-MM
}

export function useExportCSV() {
  return useMutation({
    mutationFn: async ({ type, from, to }: ExportParams) => {
      const blob = await api.get<Blob>(
        `/api/exports/metrics?type=${type}&from=${from}&to=${to}`,
      )

      const text = await blob.text()
      const lines = text.split('\n').filter((l) => l.trim().length > 0)

      if (lines.length <= 1) {
        toast.info('No hay datos para el rango seleccionado.')
        return
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `minijira_${type === 'summary' ? 'metricas' : 'tickets'}_${to}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
  })
}
