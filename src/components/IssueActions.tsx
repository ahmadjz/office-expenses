import { Copy, Send } from 'lucide-react'
import { useState } from 'react'

const ACTIONS_URL = 'https://github.com/ahmadjz/office-expenses/actions'

type IssueActionsProps = { url?: string; payload?: string; incompleteMessage: string }

export function IssueActions({ url, payload, incompleteMessage }: IssueActionsProps) {
  const [isSent, setIsSent] = useState(false)
  const isReady = Boolean(url && payload)

  async function copyPayload() {
    if (!payload) return
    try {
      await navigator.clipboard.writeText(payload)
      setIsSent(true)
    } catch {
      window.alert('تعذر النسخ. انسخ البيانات يدويًا من النموذج.')
    }
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          onClick={() => { if (isReady) setIsSent(true) }}
          aria-disabled={!isReady}
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-bold focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${isReady ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'pointer-events-none bg-[var(--color-border)] text-[var(--color-muted)]'}`}
        >
          <Send aria-hidden="true" size={19} />إرسال عبر GitHub
        </a>
        <button
          type="button"
          disabled={!isReady}
          onClick={copyPayload}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-base font-bold text-[var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
        >
          <Copy aria-hidden="true" size={19} />نسخ
        </button>
      </div>
      {!isReady && <p className="text-center text-sm text-[var(--color-muted)]">{incompleteMessage}</p>}
      {isSent && (
        <p className="rounded-xl border border-[var(--color-secondary)] bg-[var(--color-surface)] p-3 text-sm leading-6 text-[var(--color-foreground)]">
          تم إرسال الإدخال. سيظهر على الموقع خلال دقيقة تقريبًا بعد اكتمال البناء.{' '}
          <a className="font-bold text-[var(--color-secondary)] underline" href={ACTIONS_URL} target="_blank" rel="noreferrer">عرض البناء</a>
        </p>
      )}
    </>
  )
}
