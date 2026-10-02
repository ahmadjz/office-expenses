import { LoaderCircle, Save } from 'lucide-react'
import { errorTextClass, primaryButtonClass } from './ui'

type SubmitBarProps = { isReady: boolean; isSaving: boolean; error: string | null; incompleteMessage: string; label?: string }

export function SubmitBar({ isReady, isSaving, error, incompleteMessage, label = 'حفظ' }: SubmitBarProps) {
  return (
    <div className="space-y-3">
      <button type="submit" disabled={!isReady || isSaving} className={`${primaryButtonClass} w-full`}>
        {isSaving ? <LoaderCircle aria-hidden="true" size={19} className="animate-spin motion-reduce:animate-none" /> : <Save aria-hidden="true" size={19} />}
        {isSaving ? 'جارٍ الحفظ…' : label}
      </button>
      {!isReady && !isSaving && <p className="text-center text-sm text-[var(--color-muted)]">{incompleteMessage}</p>}
      {error && <p role="alert" className={`rounded-xl border border-[var(--color-negative)] p-3 ${errorTextClass}`}>{error}</p>}
    </div>
  )
}
