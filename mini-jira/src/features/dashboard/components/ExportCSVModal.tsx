import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { useExportCSV } from '@/features/dashboard/hooks/useExportCSV'
import { Button } from '@/shared/components/ui/button'
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
import type { ExportType } from '@/shared/types'

interface Props {
  open: boolean
  onClose: () => void
}

const MONTHS = Array.from({ length: 13 }, (_, i) => {
  const d = subMonths(new Date(), i)
  return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') }
})

export function ExportCSVModal({ open, onClose }: Props) {
  const [type, setType] = useState<ExportType>('summary')
  const [from, setFrom] = useState(MONTHS[5].value)
  const [to, setTo] = useState(MONTHS[0].value)

  const { mutate: exportCSV, isPending } = useExportCSV()

  const handleDownload = () => {
    exportCSV({ type, from, to }, { onSuccess: onClose })
  }

  const fromIndex = MONTHS.findIndex((m) => m.value === from)
  const toOptions = MONTHS.slice(0, fromIndex + 1)

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Exportar CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Tipo de exportación</label>
            <Select value={type} onValueChange={(v) => setType(v as ExportType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Resumen de métricas</SelectItem>
                <SelectItem value="detail">Detalle de tickets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Desde</label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Hasta</label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Datos exactos al momento de la descarga. Máximo 12 meses.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button onClick={handleDownload} disabled={isPending}>
              {isPending ? 'Descargando...' : 'Descargar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
