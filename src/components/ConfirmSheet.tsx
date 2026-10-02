import { useState } from 'react'
import { errorMessage } from '../lib/api'
import { Sheet } from './Sheet'
import { destructiveButtonClass, errorTextClass, secondaryButtonClass } from './ui'

type ConfirmSheetProps = { title: string; description: string; confirmLabel: string; onConfirm: () => Promise<void>; onClose: () => void }

export function ConfirmSheet({ title, description, confirmLabel, onConfirm, onClose }: ConfirmSheetProps) {
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setIsWorking(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (caught) {
      setError(errorMessage(caught))
      setIsWorking(false)
    }
  }

  return (
    <Sheet title={title} titleId="confirm-sheet-title" onClose={onClose}>
      <p className="text-base leading-7 text-[var(--color-foreground)]">{description}</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" onClick={confirm} disabled={isWorking} className={destructiveButtonClass}>{isWorking ? 'جارٍ التنفيذ…' : confirmLabel}</button>
        <button type="button" onClick={onClose} className={secondaryButtonClass}>إلغاء</button>
      </div>
      {error && <p role="alert" className={`mt-3 ${errorTextClass}`}>{error}</p>}
    </Sheet>
  )
}
