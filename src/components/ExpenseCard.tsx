import { formatAmount, formatDate } from '../lib/format'
import type { Roster } from '../lib/roster'
import type { Expense } from '../lib/schema'
import { splitAmount } from '../lib/split'
import { RecordActions } from './RecordActions'

type ExpenseCardProps = { expense: Expense; roster: Roster; onEdit?: () => void; onDelete?: () => void }

export function ExpenseCard({ expense, roster, onEdit, onDelete }: ExpenseCardProps) {
  const shares = splitAmount(expense.amount, expense.sharers, roster.order)
  const isEven = new Set(shares.values()).size === 1
  const shareText = isEven
    ? `${formatAmount(expense.amount)} ÷ ${shares.size} = ${formatAmount([...shares.values()][0])} للشخص`
    : [...shares].map(([id, share]) => `${roster.name(id)} ${formatAmount(share)}`).join(' · ')

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-xl text-[var(--color-foreground)]">{roster.name(expense.payer)} — {expense.item}</h3>
          <time className="text-sm text-[var(--color-muted)]" dateTime={expense.date}>{formatDate(expense.date)}</time>
        </div>
        {onEdit && onDelete && <RecordActions label={expense.item} onEdit={onEdit} onDelete={onDelete} />}
      </div>
      <p className="mt-3 tabular-nums text-base font-semibold text-[var(--color-foreground)]">{shareText}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{[...shares.keys()].map(roster.name).join(' · ')}</p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">سجّله: {roster.name(expense.createdBy)}</p>
    </article>
  )
}
