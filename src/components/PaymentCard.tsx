import { ArrowLeft } from 'lucide-react'
import { memberName } from '../data/members'
import { formatAmount, formatDate } from '../lib/format'
import type { Payment } from '../lib/schema'

export function PaymentCard({ payment }: { payment: Payment }) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="flex items-center gap-2 font-heading text-xl text-[var(--color-foreground)]">
          {memberName(payment.from)}
          <ArrowLeft aria-hidden="true" size={18} className="shrink-0 text-[var(--color-positive)]" />
          {memberName(payment.to)}
        </h3>
        <time className="shrink-0 text-sm text-[var(--color-muted)]" dateTime={payment.date}>{formatDate(payment.date)}</time>
      </div>
      <p className="mt-3 tabular-nums text-base font-semibold text-[var(--color-positive)]">تسديد {formatAmount(payment.amount)}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
        سدّد {memberName(payment.from)} مبلغًا لـ {memberName(payment.to)} من حسابه.
      </p>
    </article>
  )
}
