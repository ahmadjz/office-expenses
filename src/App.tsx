import { Plus, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AddEntrySheet } from './components/AddEntrySheet'
import { AddPaymentSheet, type PaymentDraft } from './components/AddPaymentSheet'
import { WeekGroup } from './components/WeekGroup'
import { entries } from './lib/entries'
import { groupByWeek } from './lib/feed'
import { payments } from './lib/payments'

export default function App() {
  const [isEntrySheetOpen, setIsEntrySheetOpen] = useState(false)
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft | null>(null)
  const weeks = useMemo(() => groupByWeek(entries, payments), [])
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 pb-28 pt-8">
      <header className="mb-8">
        <p className="text-base font-semibold text-[var(--color-secondary)]">سجل مشترك</p>
        <h1 className="font-heading text-4xl font-bold text-[var(--color-foreground)]">مصاريف المكتب</h1>
        <p className="mt-2 text-base leading-7 text-[var(--color-muted)]">تابع المشتريات والحصص والتسديدات أسبوعًا بأسبوع.</p>
      </header>

      {weeks.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <h2 className="font-heading text-2xl font-bold text-[var(--color-foreground)]">لا توجد مصروفات بعد</h2>
          <p className="mt-2 text-base leading-7 text-[var(--color-muted)]">أضف أول مصروف ليظهر هنا.</p>
        </section>
      ) : (
        <div className="space-y-10">
          {weeks.map((week) => (
            <WeekGroup
              key={week.weekStart}
              week={week}
              onRecordSettlement={(transfer, date) => setPaymentDraft({ ...transfer, date })}
            />
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 p-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl gap-3">
          <button
            type="button"
            onClick={() => setIsEntrySheetOpen(true)}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-base font-bold text-[var(--color-on-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            <Plus aria-hidden="true" size={20} />إضافة مصروف
          </button>
          <button
            type="button"
            onClick={() => setPaymentDraft({})}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base font-bold text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            <Wallet aria-hidden="true" size={20} />تسجيل دفعة
          </button>
        </div>
      </div>

      <AddEntrySheet isOpen={isEntrySheetOpen} onClose={() => setIsEntrySheetOpen(false)} />
      {paymentDraft && <AddPaymentSheet draft={paymentDraft} onClose={() => setPaymentDraft(null)} />}
    </main>
  )
}
