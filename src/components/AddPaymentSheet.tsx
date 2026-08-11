import { useMemo, useState } from 'react'
import { MEMBERS, memberName, type MemberId } from '../data/members'
import { formatAmount } from '../lib/format'
import { createPaymentIssueUrl, createPaymentPayload } from '../lib/issue-url'
import { paymentInputSchema, type PaymentInput } from '../lib/schema'
import { IssueActions } from './IssueActions'
import { MemberChip } from './MemberChip'
import { Sheet } from './Sheet'

export type PaymentDraft = { from?: MemberId; to?: MemberId; amount?: number; date?: string }

type FormState = { date: string; from: MemberId | ''; to: MemberId | ''; amount: string }
type FieldName = keyof FormState

function initialForm(draft: PaymentDraft): FormState {
  return {
    date: draft.date ?? new Date().toISOString().slice(0, 10),
    from: draft.from ?? '',
    to: draft.to ?? '',
    amount: draft.amount ? String(draft.amount) : '',
  }
}

function parseForm(form: FormState) {
  return paymentInputSchema.safeParse({ ...form, amount: Number(form.amount) })
}

function getInput(form: FormState): PaymentInput | null {
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

export function AddPaymentSheet({ draft, onClose }: { draft: PaymentDraft; onClose: () => void }) {
  const [form, setForm] = useState<FormState>(() => initialForm(draft))
  const [touchedFields, setTouchedFields] = useState<Set<FieldName>>(new Set())
  const errors = useMemo(() => getErrors(form), [form])
  const input = useMemo(() => getInput(form), [form])
  const touch = (field: FieldName) => setTouchedFields((fields) => new Set([...fields, field]))
  const setField = <K extends FieldName>(field: K, value: FormState[K]) => setForm((current) => ({ ...current, [field]: value }))
  const selectPayer = (id: MemberId) => setForm((current) => ({ ...current, from: id, to: current.to === id ? '' : current.to }))
  const showError = (field: FieldName) => touchedFields.has(field) && errors[field]

  return (
    <Sheet title="تسجيل دفعة" titleId="payment-sheet-title" onClose={onClose}>
      <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
        <fieldset>
          <legend className="mb-3 text-base font-bold text-[var(--color-foreground)]">من دفع؟</legend>
          <div className="flex flex-wrap gap-2">
            {MEMBERS.map((member) => <MemberChip key={member.id} {...member} isSelected={form.from === member.id} onClick={() => { selectPayer(member.id); touch('from') }} />)}
          </div>
          {showError('from') && <p className="mt-2 text-sm text-[var(--color-negative)]">{errors.from}</p>}
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-base font-bold text-[var(--color-foreground)]">لمن دفع؟</legend>
          <div className="flex flex-wrap gap-2">
            {MEMBERS.filter((member) => member.id !== form.from).map((member) => <MemberChip key={member.id} {...member} isSelected={form.to === member.id} onClick={() => { setField('to', member.id); touch('to') }} />)}
          </div>
          {showError('to') && <p className="mt-2 text-sm text-[var(--color-negative)]">{errors.to}</p>}
        </fieldset>

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
        {showError('date')
          ? <p className="-mt-4 text-sm text-[var(--color-negative)]">{errors.date}</p>
          : <p className="-mt-4 text-sm leading-6 text-[var(--color-muted)]">الحسابات تُجمع أسبوعًا بأسبوع، فاختر تاريخًا داخل الأسبوع الذي تسدّد عنه.</p>}

        <aside className="rounded-2xl bg-[var(--color-surface)] p-4 text-center text-base text-[var(--color-foreground)]" aria-live="polite">
          {input
            ? <><strong>{memberName(input.from)}</strong> سدّد لـ <strong>{memberName(input.to)}</strong> · <span className="tabular-nums">{formatAmount(input.amount)}</span></>
            : 'أكمل الحقول لمعاينة الدفعة'}
        </aside>

        <IssueActions
          url={input ? createPaymentIssueUrl(input) : undefined}
          payload={input ? createPaymentPayload(input) : undefined}
          incompleteMessage="اختر الدافع والمستلم والمبلغ لإرسال الدفعة."
        />
      </form>
    </Sheet>
  )
}
