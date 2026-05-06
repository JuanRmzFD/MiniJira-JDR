import { useEffect, useState } from 'react'
import { MonitorX } from 'lucide-react'

export function ViewportWarning() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const check = () => setShow(window.innerWidth < 1024)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 flex items-center gap-2 bg-amber-50 border-t border-amber-200 px-4 py-2 text-sm text-amber-800">
      <MonitorX className="h-4 w-4 shrink-0" />
      Esta herramienta está optimizada para pantallas de escritorio (mínimo 1024 px).
    </div>
  )
}
