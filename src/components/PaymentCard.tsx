import { ArrowLeft } from 'lucide-react'
import { formatAmount, formatDate } from '../lib/format'
import type { Roster } from '../lib/roster'
import type { Payment } from '../lib/schema'
import { RecordActions } from './RecordActions'

type PaymentCardProps = { payment: Payment; roster: Roster; onEdit?: () => void; onDelete?: () => void }

export function PaymentCard({ payment, roster, onEdit, onDelete }: PaymentCardProps) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 font-heading text-xl text-[var(--color-foreground)]">
            {roster.name(payment.from)}
            <ArrowLeft aria-hidden="true" size={18} className="shrink-0 text-[var(--color-positive)]" />
            {roster.name(payment.to)}
          </h3>
          <time className="text-sm text-[var(--color-muted)]" dateTime={payment.date}>{formatDate(payment.date)}</time>
        </div>
        {onEdit && onDelete && <RecordActions label={`دفعة ${roster.name(payment.from)}`} onEdit={onEdit} onDelete={onDelete} />}
      </div>
      <p className="mt-3 tabular-nums text-base font-semibold text-[var(--color-positive)]">تسديد {formatAmount(payment.amount)}</p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">سجّله: {roster.name(payment.createdBy)}</p>
    </article>
  )
}
