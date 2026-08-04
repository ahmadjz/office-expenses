import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AddEntrySheet } from './components/AddEntrySheet'
import { WeekGroup } from './components/WeekGroup'
import { entries } from './lib/entries'
import { getWeekStart } from './lib/week'

export default function App() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const groups = useMemo(() => Object.entries(Object.groupBy(entries, (entry) => getWeekStart(entry.date)))
    .map(([weekStart, groupEntries]) => [weekStart, groupEntries ?? []] as const)
    .toSorted(([first], [second]) => second.localeCompare(first)), [])
  return <main className="mx-auto min-h-dvh max-w-3xl px-4 pb-28 pt-8"><header className="mb-8"><p className="text-base font-semibold text-[var(--color-secondary)]">سجل مشترك</p><h1 className="font-heading text-4xl font-bold text-[var(--color-foreground)]">مصاريف المكتب</h1><p className="mt-2 text-base leading-7 text-[var(--color-muted)]">تابع المشتريات والحصص أسبوعًا بأسبوع.</p></header>{groups.length === 0 ? <section className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center"><h2 className="font-heading text-2xl font-bold text-[var(--color-foreground)]">لا توجد مصروفات بعد</h2><p className="mt-2 text-base leading-7 text-[var(--color-muted)]">أضف أول مصروف ليظهر هنا.</p></section> : <div className="space-y-10">{groups.map(([weekStart, groupEntries]) => <WeekGroup key={weekStart} weekStart={weekStart} entries={groupEntries} />)}</div>}<div className="fixed inset-x-0 bottom-0 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 p-3 backdrop-blur"><button type="button" onClick={() => setIsSheetOpen(true)} className="mx-auto flex min-h-12 w-full max-w-3xl items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-base font-bold text-[var(--color-on-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"><Plus aria-hidden="true" size={20}/>إضافة مصروف</button></div><AddEntrySheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} /></main>
}
