import { ArrowDown, ArrowUp } from 'lucide-react'
import { memberName } from '../data/members'
import { formatAmount, formatDate } from '../lib/format'
import type { Entry } from '../lib/schema'
import { summarizeWeek } from '../lib/summary'
import { getWeekEnd } from '../lib/week'
import { EntryCard } from './EntryCard'

export function WeekGroup({ weekStart, entries }: { weekStart: string; entries: Entry[] }) {
  const summary = summarizeWeek(entries)
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0)
  return (
    <section aria-labelledby={`week-${weekStart}`} className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`week-${weekStart}`} className="font-heading text-2xl font-bold text-[var(--color-foreground)]">
          أسبوع {formatDate(weekStart)} — {formatDate(getWeekEnd(weekStart))}
        </h2>
        <p className="tabular-nums text-base font-semibold text-[var(--color-foreground)]">المجموع {formatAmount(total)}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-start text-sm">
          <thead className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
            <tr><th className="p-3 text-start font-medium">الاسم</th><th className="p-3 text-start font-medium">دفع</th><th className="p-3 text-start font-medium">عليه</th><th className="p-3 text-start font-medium">الصافي</th></tr>
          </thead>
          <tbody>
            {summary.map((member) => {
              const isPositive = member.net >= 0
              const Icon = isPositive ? ArrowUp : ArrowDown
              return <tr key={member.id} className="border-b border-[var(--color-border)] last:border-0"><td className="p-3 font-medium text-[var(--color-foreground)]">{memberName(member.id)}</td><td className="p-3 tabular-nums text-[var(--color-foreground)]">{formatAmount(member.paid)}</td><td className="p-3 tabular-nums text-[var(--color-foreground)]">{formatAmount(member.owed)}</td><td className={`p-3 tabular-nums font-semibold ${isPositive ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'} `}><span className="inline-flex items-center gap-1"><Icon aria-hidden="true" size={16}/>{isPositive ? '+' : '−'}{formatAmount(Math.abs(member.net))}</span></td></tr>
            })}
          </tbody>
        </table>
      </div>
      <div className="space-y-3">{entries.map((entry) => <EntryCard key={entry.id} entry={entry} />)}</div>
    </section>
  )
}
