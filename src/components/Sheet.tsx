import { X } from 'lucide-react'
import { useRef, type ReactNode } from 'react'

const DISMISS_DISTANCE_PX = 100

type SheetProps = { title: string; titleId: string; onClose: () => void; children: ReactNode }

export function Sheet({ title, titleId, onClose, children }: SheetProps) {
  const touchStartY = useRef<number | null>(null)
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby={titleId}
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => { touchStartY.current = event.touches[0].clientY }}
        onTouchEnd={(event) => { if (touchStartY.current !== null && event.changedTouches[0].clientY - touchStartY.current > DISMISS_DISTANCE_PX) onClose(); touchStartY.current = null }}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--color-border)]" aria-hidden="true" />
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id={titleId} className="font-heading text-3xl font-bold text-[var(--color-foreground)]">{title}</h2>
          <button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-full text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]" aria-label="إغلاق">
            <X aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
