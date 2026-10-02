import { Plus, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useToday } from '../hooks/useToday'
import { deleteRecord, type Ledger } from '../lib/api'
import { splitArchive } from '../lib/archive'
import { groupByWeek } from '../lib/feed'
import { formatAmount } from '../lib/format'
import type { Roster } from '../lib/roster'
import type { Expense, Member, Payment } from '../lib/schema'
import { ArchiveSection } from './ArchiveSection'
import { ConfirmSheet } from './ConfirmSheet'
import { ExpenseSheet } from './ExpenseSheet'
import { PaymentSheet, type PaymentDraft } from './PaymentSheet'
import { WeekGroup, type AdminActions } from './WeekGroup'
import { primaryButtonClass, secondaryButtonClass } from './ui'

type OpenSheet =
  | { kind: 'expense'; expense?: Expense }
  | { kind: 'payment'; draft: PaymentDraft; payment?: Payment }
  | { kind: 'delete-expense'; expense: Expense }
  | { kind: 'delete-payment'; payment: Payment }

type FeedViewProps = { ledger: Ledger; roster: Roster; member: Member; onChanged: () => void }

export function FeedView({ ledger, roster, member, onChanged }: FeedViewProps) {
  const [sheet, setSheet] = useState<OpenSheet | null>(null)
  const today = useToday()
  const { shown, archived } = useMemo(
    () => splitArchive(groupByWeek(ledger.expenses, ledger.payments, roster.order), today),
    [ledger, roster, today],
  )
  const admin: AdminActions | undefined = member.isAdmin
    ? {
        editExpense: (expense) => setSheet({ kind: 'expense', expense }),
        deleteExpense: (expense) => setSheet({ kind: 'delete-expense', expense }),
        editPayment: (payment) => setSheet({ kind: 'payment', draft: {}, payment }),
        deletePayment: (payment) => setSheet({ kind: 'delete-payment', payment }),
      }
    : undefined
  const recordSettlement = (transfer: PaymentDraft, date: string) => setSheet({ kind: 'payment', draft: { ...transfer, date } })
  const close = () => setSheet(null)

  return (
    <>
      {shown.length === 0 && archived.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <h2 className="font-heading text-2xl font-bold text-[var(--color-foreground)]">لا توجد مصروفات بعد</h2>
          <p className="mt-2 text-base leading-7 text-[var(--color-muted)]">أضف أول مصروف ليظهر هنا.</p>
        </section>
      ) : (
        <div className="space-y-10">
          {shown.length === 0 && <p className="text-base text-[var(--color-muted)]">لا شيء في الأسابيع الثلاثة الأخيرة.</p>}
          {shown.map((week) => <WeekGroup key={week.weekStart} week={week} roster={roster} isUnsettledArchive={week.isUnsettledArchive} admin={admin} onRecordSettlement={recordSettlement} />)}
          <ArchiveSection weekCount={archived.length}>
            {archived.map((week) => <WeekGroup key={week.weekStart} week={week} roster={roster} admin={admin} onRecordSettlement={recordSettlement} />)}
          </ArchiveSection>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 p-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl gap-3">
          <button type="button" onClick={() => setSheet({ kind: 'expense' })} className={`${primaryButtonClass} flex-1`}>
            <Plus aria-hidden="true" size={20} />إضافة مصروف
          </button>
          <button type="button" onClick={() => setSheet({ kind: 'payment', draft: {} })} className={`${secondaryButtonClass} flex-1`}>
            <Wallet aria-hidden="true" size={20} />تسجيل دفعة
          </button>
        </div>
      </div>

      {sheet?.kind === 'expense' && <ExpenseSheet roster={roster} signedInId={member.id} expense={sheet.expense} onClose={close} onSaved={onChanged} />}
      {sheet?.kind === 'payment' && <PaymentSheet roster={roster} draft={sheet.draft} payment={sheet.payment} onClose={close} onSaved={onChanged} />}
      {sheet?.kind === 'delete-expense' && (
        <ConfirmSheet
          title="حذف هذا السجل؟"
          description={`${roster.name(sheet.expense.payer)} — ${sheet.expense.item} — ${formatAmount(sheet.expense.amount)}. لا يمكن التراجع عن الحذف.`}
          confirmLabel="حذف"
          onConfirm={async () => { await deleteRecord('expenses', sheet.expense.id); onChanged() }}
          onClose={close}
        />
      )}
      {sheet?.kind === 'delete-payment' && (
        <ConfirmSheet
          title="حذف هذا السجل؟"
          description={`دفعة من ${roster.name(sheet.payment.from)} إلى ${roster.name(sheet.payment.to)} — ${formatAmount(sheet.payment.amount)}. لا يمكن التراجع عن الحذف.`}
          confirmLabel="حذف"
          onConfirm={async () => { await deleteRecord('payments', sheet.payment.id); onChanged() }}
          onClose={close}
        />
      )}
    </>
  )
}
