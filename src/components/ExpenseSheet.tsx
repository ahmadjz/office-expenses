import { useMemo, useState, type SubmitEvent } from 'react'
import { errorMessage, saveExpense } from '../lib/api'
import { todayInDamascus } from '../lib/dates'
import { formatAmount } from '../lib/format'
import { firstErrors } from '../lib/forms'
import { selectableMembers, type Roster } from '../lib/roster'
import { expenseInputSchema, type Expense, type MemberId } from '../lib/schema'
import { splitAmount } from '../lib/split'
import { MemberChip } from './MemberChip'
import { Sheet } from './Sheet'
import { SubmitBar } from './SubmitBar'
import { errorTextClass, inputClass } from './ui'

type FormState = { date: string; payer: MemberId; item: string; amount: string; sharers: MemberId[] }
type FieldName = keyof FormState

type ExpenseSheetProps = { roster: Roster; signedInId: MemberId; expense?: Expense; onClose: () => void; onSaved: () => void }

function initialForm(signedInId: MemberId, expense?: Expense): FormState {
  return expense
    ? { date: expense.date, payer: expense.payer, item: expense.item, amount: String(expense.amount), sharers: expense.sharers }
    : { date: todayInDamascus(), payer: signedInId, item: '', amount: '', sharers: [] }
}

export function ExpenseSheet({ roster, signedInId, expense, onClose, onSaved }: ExpenseSheetProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(signedInId, expense))
  const [touched, setTouched] = useState<Set<FieldName>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const result = useMemo(() => expenseInputSchema.safeParse({ ...form, amount: Number(form.amount) }), [form])
  const errors = firstErrors<FieldName>(result)
  const input = result.success ? result.data : null
  const choices = selectableMembers(roster, expense ? [expense.payer, ...expense.sharers] : [])
  const isAllSelected = choices.every((member) => form.sharers.includes(member.id))
  const preview = input ? splitAmount(input.amount, input.sharers, roster.order) : null
  const isEvenSplit = preview ? new Set(preview.values()).size === 1 : false

  const setField = <K extends FieldName>(field: K, value: FormState[K]) => setForm((current) => ({ ...current, [field]: value }))
  const touch = (field: FieldName) => setTouched((fields) => new Set([...fields, field]))
  const showError = (field: FieldName) => (touched.has(field) ? errors[field] : undefined)
  const toggleSharer = (id: MemberId) => setField('sharers', form.sharers.includes(id) ? form.sharers.filter((member) => member !== id) : [...form.sharers, id])
  const toggleAll = () => setField('sharers', isAllSelected ? [] : choices.map(({ id }) => id))

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!input) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await saveExpense(input, expense?.id)
      onSaved()
      onClose()
    } catch (error) {
      setSaveError(errorMessage(error))
      setIsSaving(false)
    }
  }

  return (
    <Sheet title={expense ? 'تعديل مصروف' : 'إضافة مصروف'} titleId="expense-sheet-title" onClose={onClose}>
      <form className="space-y-6" onSubmit={submit} noValidate>
        <fieldset>
          <legend className="mb-3 text-base font-bold text-[var(--color-foreground)]">من دفع؟</legend>
          <div className="flex flex-wrap gap-2">
            {choices.map((member) => <MemberChip key={member.id} name={member.name} isInactive={!member.active} isSelected={form.payer === member.id} onClick={() => { setField('payer', member.id); touch('payer') }} />)}
          </div>
          {showError('payer') && <p className={`mt-2 ${errorTextClass}`}>{errors.payer}</p>}
        </fieldset>

        <label className="block text-base font-bold text-[var(--color-foreground)]">
          ماذا اشترى؟
          <input value={form.item} onChange={(event) => setField('item', event.target.value)} onBlur={() => touch('item')} maxLength={80} aria-invalid={Boolean(showError('item'))} className={inputClass} />
        </label>
        {showError('item') && <p className={`-mt-4 ${errorTextClass}`}>{errors.item}</p>}

        <label className="block text-base font-bold text-[var(--color-foreground)]">
          المبلغ
          <input value={form.amount} onChange={(event) => setField('amount', event.target.value.replace(/[^0-9]/g, ''))} onBlur={() => touch('amount')} inputMode="numeric" aria-invalid={Boolean(showError('amount'))} className={`${inputClass} tabular-nums`} />
        </label>
        {showError('amount') && <p className={`-mt-4 ${errorTextClass}`}>{errors.amount}</p>}

        <label className="block text-base font-bold text-[var(--color-foreground)]">
          التاريخ
          <input type="date" value={form.date} onChange={(event) => setField('date', event.target.value)} onBlur={() => touch('date')} aria-invalid={Boolean(showError('date'))} className={inputClass} />
        </label>
        {showError('date') && <p className={`-mt-4 ${errorTextClass}`}>{errors.date}</p>}

        <fieldset>
          <div className="mb-3 flex items-center justify-between gap-3">
            <legend className="text-base font-bold text-[var(--color-foreground)]">من شارك؟</legend>
            <button type="button" onClick={() => { toggleAll(); touch('sharers') }} className="min-h-11 rounded-full px-3 text-base font-semibold text-[var(--color-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]" aria-pressed={isAllSelected}>الكل</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {choices.map((member) => <MemberChip key={member.id} name={member.name} isInactive={!member.active} isSelected={form.sharers.includes(member.id)} onClick={() => { toggleSharer(member.id); touch('sharers') }} />)}
          </div>
          {showError('sharers') && <p className={`mt-2 ${errorTextClass}`}>{errors.sharers}</p>}
        </fieldset>

        <aside className="rounded-2xl bg-[var(--color-surface)] p-4 text-center text-base text-[var(--color-foreground)]" aria-live="polite">
          {preview
            ? isEvenSplit
              ? <><strong>{preview.size} أشخاص</strong> · <span className="tabular-nums">{formatAmount([...preview.values()][0])}</span> للشخص</>
              : <><strong>{preview.size} أشخاص</strong> · حصص متفاوتة: {[...preview.values()].map(formatAmount).join('، ')}</>
            : 'أكمل الحقول لمعاينة القسمة'}
        </aside>

        <SubmitBar isReady={input !== null} isSaving={isSaving} error={saveError} incompleteMessage="أكمل الحقول المطلوبة لحفظ المصروف." />
      </form>
    </Sheet>
  )
}
