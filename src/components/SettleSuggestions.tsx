import { ArrowLeft, Check } from 'lucide-react'
import { formatAmount } from '../lib/format'
import type { Roster } from '../lib/roster'
import type { Transfer } from '../lib/settle'
import { focusRing } from './ui'

type SettleSuggestionsProps = { headingId: string; transfers: readonly Transfer[]; roster: Roster; onRecord: (transfer: Transfer) => void }

export function SettleSuggestions({ headingId, transfers, roster, onRecord }: SettleSuggestionsProps) {
  if (transfers.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-base text-[var(--color-positive)]">
        <Check aria-hidden="true" size={18} />الحسابات مسواة لهذا الأسبوع.
      </p>
    )
  }
  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 id={headingId} className="mb-3 text-base font-bold text-[var(--color-foreground)]">التسوية المقترحة</h3>
      <ul className="space-y-2">
        {transfers.map((transfer) => (
          <li key={`${transfer.from}-${transfer.to}`}>
            <button
              type="button"
              onClick={() => onRecord(transfer)}
              className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-3 text-start text-base text-[var(--color-foreground)] ${focusRing}`}
            >
              <span className="flex items-center gap-2">
                {roster.name(transfer.from)}
                <ArrowLeft aria-hidden="true" size={16} className="shrink-0 text-[var(--color-muted)]" />
                {roster.name(transfer.to)}
              </span>
              <span className="flex items-center gap-3">
                <span className="tabular-nums font-semibold">{formatAmount(transfer.amount)}</span>
                <span className="shrink-0 text-sm font-bold text-[var(--color-secondary)]">تسجيل</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
