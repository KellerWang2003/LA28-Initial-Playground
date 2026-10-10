import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { X } from 'lucide-react'
import { BatonGlyph } from '@/components/baton-art'
import { dismissToast, useToasts, type Toast } from '@/lib/toasts'

const SHOW_MS = 7000

// Notification banners at the top of the screen, over everything. They stand in
// for push notifications; tapping one opens where it points.
export function Toasts() {
  const toasts = useToasts()
  if (!toasts.length) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),8px)] z-[70] flex flex-col items-center gap-2 px-3">
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastRow({ toast }: { toast: Toast }) {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = window.setTimeout(() => dismissToast(toast.id), SHOW_MS)
    return () => window.clearTimeout(timer)
  }, [toast.id])

  function open() {
    dismissToast(toast.id)
    if (toast.to) navigate(toast.to)
  }

  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-sm animate-in items-center gap-3 rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur duration-300 slide-in-from-top-4 fade-in"
    >
      <button type="button" onClick={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <BatonGlyph />
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-tight font-semibold">{toast.title}</span>
          {toast.body && <span className="mt-0.5 block text-xs text-muted-foreground">{toast.body}</span>}
        </span>
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dismissToast(toast.id)}
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
