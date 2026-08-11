import { useMemo, useState } from 'react'
import { MEMBERS, type MemberId } from '../data/members'
import { formatAmount } from '../lib/format'
import { createIssuePayload, createIssueUrl } from '../lib/issue-url'
import { entryInputSchema, type EntryInput } from '../lib/schema'
import { splitAmount } from '../lib/split'
import { IssueActions } from './IssueActions'
import { MemberChip } from './MemberChip'
import { Sheet } from './Sheet'

type FormState = { date: string; payer: MemberId | ''; item: string; amount: string; sharers: MemberId[] }
type FieldName = keyof FormState
const today = new Date().toISOString().slice(0, 10)
const INITIAL_FORM: FormState = { date: today, payer: '', item: '', amount: '', sharers: [] }

function parseForm(form: FormState) {
  return entryInputSchema.safeParse({ ...form, item: form.item.trim(), amount: Number(form.amount) })
}

function getInput(form: FormState): EntryInput | null {
  const result = parseForm(form)
  return result.success ? result.data : null
}

function getErrors(form: FormState): Partial<Record<FieldName, string>> {
  const result = parseForm(form)
  if (result.success) return {}
  return result.error.issues.reduce<Partial<Record<FieldName, string>>>((errors, issue) => {
    const field = issue.path[0] as FieldName
    return errors[field] ? errors : { ...errors, [field]: issue.message }
  }, {})
}

export function AddEntrySheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [touchedFields, setTouchedFields] = useState<Set<FieldName>>(new Set())
  const errors = useMemo(() => getErrors(form), [form])
  const input = useMemo(() => getInput(form), [form])
  const selectedCount = form.sharers.length
  const isAllSelected = selectedCount === MEMBERS.length
  const preview = input && input.sharers.length > 0 ? splitAmount(input.amount, input.sharers) : null
  const isEvenSplit = preview ? new Set(preview.values()).size === 1 : false
  const setField = <K extends FieldName>(field: K, value: FormState[K]) => setForm((current) => ({ ...current, [field]: value }))
  const touch = (field: FieldName) => setTouchedFields((fields) => new Set([...fields, field]))
  const toggleSharer = (id: MemberId) => setField('sharers', form.sharers.includes(id) ? form.sharers.filter((member) => member !== id) : [...form.sharers, id])
  const toggleAll = () => setField('sharers', isAllSelected ? [] : MEMBERS.map(({ id }) => id))
  const showError = (field: FieldName) => touchedFields.has(field) && errors[field]

  if (!isOpen) return null
  return (
    <Sheet title="إضافة مصروف" titleId="entry-sheet-title" onClose={onClose}>
      <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend className="mb-3 text-base font-bold text-[var(--color-foreground)]">من دفع؟</legend>
          <div className="flex flex-wrap gap-2">
            {MEMBERS.map((member) => <MemberChip key={member.id} {...member} isSelected={form.payer === member.id} onClick={() => { setField('payer', member.id); touch('payer') }} />)}
          </div>
          {showError('payer') && <p className="mt-2 text-sm text-[var(--color-negative)]">{errors.payer}</p>}
        </fieldset>

        <label className="block text-base font-bold text-[var(--color-foreground)]">
          ماذا اشترى؟
          <input
            value={form.item}
            onChange={(event) => setField('item', event.target.value)}
            onBlur={() => touch('item')}
            maxLength={80}
            aria-invalid={Boolean(showError('item'))}
            className="mt-2 min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
          />
        </label>
        {showError('item') && <p className="-mt-4 text-sm text-[var(--color-negative)]">{errors.item}</p>}

        <label className="block text-base font-bold text-[var(--color-foreground)]">
          المبلغ
          <input
            value={form.amount}
            onChange={(event) => setField('amount', event.target.value.replace(/[^0-9]/g, ''))}
            onBlur={() => touch('amount')}
            inputMode="numeric"
            aria-invalid={Boolean(showError('amount'))}
            className="mt-2 min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base tabular-nums text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
          />
        </label>
        {showError('amount') && <p className="-mt-4 text-sm text-[var(--color-negative)]">{errors.amount}</p>}

        <label className="block text-base font-bold text-[var(--color-foreground)]">
          التاريخ
          <input
            type="date"
            value={form.date}
            onChange={(event) => setField('date', event.target.value)}
            onBlur={() => touch('date')}
            aria-invalid={Boolean(showError('date'))}
            className="mt-2 min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
          />
        </label>
        {showError('date') && <p className="-mt-4 text-sm text-[var(--color-negative)]">{errors.date}</p>}

        <fieldset>
          <div className="mb-3 flex items-center justify-between gap-3">
            <legend className="text-base font-bold text-[var(--color-foreground)]">من شارك؟</legend>
            <button type="button" onClick={toggleAll} className="min-h-11 rounded-full px-3 text-base font-semibold text-[var(--color-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]" aria-pressed={isAllSelected}>الكل</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {MEMBERS.map((member) => <MemberChip key={member.id} {...member} isSelected={form.sharers.includes(member.id)} onClick={() => { toggleSharer(member.id); touch('sharers') }} />)}
          </div>
          {showError('sharers') && <p className="mt-2 text-sm text-[var(--color-negative)]">{errors.sharers}</p>}
        </fieldset>

        <aside className="rounded-2xl bg-[var(--color-surface)] p-4 text-center text-base text-[var(--color-foreground)]" aria-live="polite">
          {preview
            ? isEvenSplit
              ? <><strong>{selectedCount} أشخاص</strong> · <span className="tabular-nums">{formatAmount([...preview.values()][0])}</span> للشخص</>
              : <><strong>{selectedCount} أشخاص</strong> · حصص متفاوتة: {[...preview.values()].map(formatAmount).join('، ')}</>
            : 'أكمل الحقول لمعاينة القسمة'}
        </aside>

        <IssueActions
          url={input ? createIssueUrl(input) : undefined}
          payload={input ? createIssuePayload(input) : undefined}
          incompleteMessage="أكمل الحقول المطلوبة لإرسال الإدخال."
        />
      </form>
    </Sheet>
  )
}
