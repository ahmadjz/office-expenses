import { useMemo, useState, type SubmitEvent } from 'react'
import { errorMessage, savePayment } from '../lib/api'
import { todayInDamascus } from '../lib/dates'
import { formatAmount } from '../lib/format'
import { firstErrors } from '../lib/forms'
import { selectableMembers, type Roster } from '../lib/roster'
import { paymentInputSchema, type MemberId, type Payment } from '../lib/schema'
import { MemberChip } from './MemberChip'
import { Sheet } from './Sheet'
import { SubmitBar } from './SubmitBar'
import { errorTextClass, inputClass } from './ui'

export type PaymentDraft = { from?: MemberId; to?: MemberId; amount?: number; date?: string }

type FormState = { date: string; from: MemberId; to: MemberId; amount: string }
type FieldName = keyof FormState

type PaymentSheetProps = { roster: Roster; draft: PaymentDraft; payment?: Payment; onClose: () => void; onSaved: () => void }

function initialForm(roster: Roster, draft: PaymentDraft, payment?: Payment): FormState {
  if (payment) return { date: payment.date, from: payment.from, to: payment.to, amount: String(payment.amount) }
  const activeOrEmpty = (id?: MemberId) => (id && roster.active.some((member) => member.id === id) ? id : '')
  return { date: draft.date ?? todayInDamascus(), from: activeOrEmpty(draft.from), to: activeOrEmpty(draft.to), amount: draft.amount ? String(draft.amount) : '' }
}

export function PaymentSheet({ roster, draft, payment, onClose, onSaved }: PaymentSheetProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(roster, draft, payment))
  const [touched, setTouched] = useState<Set<FieldName>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const result = useMemo(() => paymentInputSchema.safeParse({ ...form, amount: Number(form.amount) }), [form])
  const errors = firstErrors<FieldName>(result)
  const input = result.success ? result.data : null
  const choices = selectableMembers(roster, payment ? [payment.from, payment.to] : [])

  const setField = <K extends FieldName>(field: K, value: FormState[K]) => setForm((current) => ({ ...current, [field]: value }))
  const touch = (field: FieldName) => setTouched((fields) => new Set([...fields, field]))
  const showError = (field: FieldName) => (touched.has(field) ? errors[field] : undefined)
  const selectPayer = (id: MemberId) => setForm((current) => ({ ...current, from: id, to: current.to === id ? '' : current.to }))

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!input) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await savePayment(input, payment?.id)
      onSaved()
      onClose()
    } catch (error) {
      setSaveError(errorMessage(error))
      setIsSaving(false)
    }
  }

  return (
    <Sheet title={payment ? 'تعديل دفعة' : 'تسجيل دفعة'} titleId="payment-sheet-title" onClose={onClose}>
      <form className="space-y-6" onSubmit={submit} noValidate>
        <fieldset>
          <legend className="mb-3 text-base font-bold text-[var(--color-foreground)]">من دفع؟</legend>
          <div className="flex flex-wrap gap-2">
            {choices.map((member) => <MemberChip key={member.id} name={member.name} isInactive={!member.active} isSelected={form.from === member.id} onClick={() => { selectPayer(member.id); touch('from') }} />)}
          </div>
          {showError('from') && <p className={`mt-2 ${errorTextClass}`}>{errors.from}</p>}
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-base font-bold text-[var(--color-foreground)]">لمن دفع؟</legend>
          <div className="flex flex-wrap gap-2">
            {choices.filter((member) => member.id !== form.from).map((member) => <MemberChip key={member.id} name={member.name} isInactive={!member.active} isSelected={form.to === member.id} onClick={() => { setField('to', member.id); touch('to') }} />)}
          </div>
          {showError('to') && <p className={`mt-2 ${errorTextClass}`}>{errors.to}</p>}
        </fieldset>

        <label className="block text-base font-bold text-[var(--color-foreground)]">
          المبلغ
          <input value={form.amount} onChange={(event) => setField('amount', event.target.value.replace(/[^0-9]/g, ''))} onBlur={() => touch('amount')} inputMode="numeric" aria-invalid={Boolean(showError('amount'))} className={`${inputClass} tabular-nums`} />
        </label>
        {showError('amount') && <p className={`-mt-4 ${errorTextClass}`}>{errors.amount}</p>}

        <label className="block text-base font-bold text-[var(--color-foreground)]">
          التاريخ
          <input type="date" value={form.date} onChange={(event) => setField('date', event.target.value)} onBlur={() => touch('date')} aria-invalid={Boolean(showError('date'))} className={inputClass} />
        </label>
        {showError('date')
          ? <p className={`-mt-4 ${errorTextClass}`}>{errors.date}</p>
          : <p className="-mt-4 text-sm leading-6 text-[var(--color-muted)]">الحسابات تُجمع أسبوعًا بأسبوع، فاختر تاريخًا داخل الأسبوع الذي تسدّد عنه.</p>}

        <aside className="rounded-2xl bg-[var(--color-surface)] p-4 text-center text-base text-[var(--color-foreground)]" aria-live="polite">
          {input
            ? <><strong>{roster.name(input.from)}</strong> سدّد لـ <strong>{roster.name(input.to)}</strong> · <span className="tabular-nums">{formatAmount(input.amount)}</span></>
            : 'أكمل الحقول لمعاينة الدفعة'}
        </aside>

        <SubmitBar isReady={input !== null} isSaving={isSaving} error={saveError} incompleteMessage="اختر الدافع والمستلم والمبلغ لحفظ الدفعة." />
      </form>
    </Sheet>
  )
}
