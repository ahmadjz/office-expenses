import { ArrowDown, ArrowUp } from 'lucide-react'
import { memberName } from '../data/members'
import type { FeedWeek } from '../lib/feed'
import { formatAmount, formatDate, formatNumber, formatSigned } from '../lib/format'
import { suggestSettlements, type Transfer } from '../lib/settle'
import { summarizeWeek } from '../lib/summary'
import { getWeekEnd } from '../lib/week'
import { EntryCard } from './EntryCard'
import { PaymentCard } from './PaymentCard'
import { SettleSuggestions } from './SettleSuggestions'

type WeekGroupProps = { week: FeedWeek; onRecordSettlement: (transfer: Transfer, date: string) => void }

function settlementDate(weekStart: string): string {
  const weekEnd = getWeekEnd(weekStart)
  const today = new Date().toISOString().slice(0, 10)
  return weekEnd > today ? today : weekEnd
}

export function WeekGroup({ week, onRecordSettlement }: WeekGroupProps) {
  const summary = summarizeWeek(week.entries, week.payments)
  const total = week.entries.reduce((sum, entry) => sum + entry.amount, 0)
  const date = settlementDate(week.weekStart)
  return (
    <section aria-labelledby={`week-${week.weekStart}`} className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`week-${week.weekStart}`} className="font-heading text-2xl font-bold text-[var(--color-foreground)]">
          أسبوع {formatDate(week.weekStart)} — {formatDate(getWeekEnd(week.weekStart))}
        </h2>
        <p className="tabular-nums text-base font-semibold text-[var(--color-foreground)]">المجموع {formatAmount(total)}</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-start text-sm">
          <caption className="px-2 pt-3 text-start text-sm text-[var(--color-muted)]">المبالغ بالليرة السورية</caption>
          <thead className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
            <tr>
              <th className="px-2 py-3 text-start font-medium">الاسم</th>
              <th className="px-2 py-3 text-start font-medium">دفع</th>
              <th className="px-2 py-3 text-start font-medium">عليه</th>
              <th className="px-2 py-3 text-start font-medium">سدّد</th>
              <th className="px-2 py-3 text-start font-medium">الصافي</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((member) => {
              const isPositive = member.net >= 0
              const Icon = isPositive ? ArrowUp : ArrowDown
              return (
                <tr key={member.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-2 py-3 font-medium text-[var(--color-foreground)]">{memberName(member.id)}</td>
                  <td className="px-2 py-3 tabular-nums text-[var(--color-foreground)]" dir="ltr">{formatNumber(member.paid)}</td>
                  <td className="px-2 py-3 tabular-nums text-[var(--color-foreground)]" dir="ltr">{formatNumber(member.owed)}</td>
                  <td className="px-2 py-3 tabular-nums text-[var(--color-muted)]" dir="ltr">{member.settled === 0 ? formatNumber(0) : formatSigned(member.settled)}</td>
                  <td className={`px-2 py-3 tabular-nums font-semibold ${isPositive ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                    <span className="inline-flex items-center gap-1">
                      <Icon aria-hidden="true" size={16} /><span dir="ltr">{formatSigned(member.net)}</span>
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <SettleSuggestions
        headingId={`settle-${week.weekStart}`}
        transfers={suggestSettlements(summary)}
        onRecord={(transfer) => onRecordSettlement(transfer, date)}
      />
      <div className="space-y-3">
        {week.items.map((item) => item.kind === 'expense'
          ? <EntryCard key={item.entry.id} entry={item.entry} />
          : <PaymentCard key={item.payment.id} payment={item.payment} />)}
      </div>
    </section>
  )
}
