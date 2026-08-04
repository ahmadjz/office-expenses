import { memberName, type MemberId } from '../data/members'
import type { Entry } from '../lib/schema'
import { formatAmount, formatDate } from '../lib/format'
import { splitAmount } from '../lib/split'

export function EntryCard({ entry }: { entry: Entry }) {
  const shares = splitAmount(entry.amount, entry.sharers)
  const isEven = new Set(shares.values()).size === 1
  const shareText = isEven
    ? `${formatAmount(entry.amount)} ÷ ${entry.sharers.length} = ${formatAmount([...shares.values()][0])} للشخص`
    : [...shares].map(([id, share]) => `${memberName(id)} ${formatAmount(share)}`).join(' · ')

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-xl text-[var(--color-foreground)]">{memberName(entry.payer)} — {entry.item}</h3>
        <time className="shrink-0 text-sm text-[var(--color-muted)]" dateTime={entry.date}>{formatDate(entry.date)}</time>
      </div>
      <p className="mt-3 tabular-nums text-base font-semibold text-[var(--color-foreground)]">{shareText}</p>
      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
        {entry.sharers.map((id: MemberId) => memberName(id)).join(' · ')}
      </p>
    </article>
  )
}
