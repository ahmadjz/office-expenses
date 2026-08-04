import { Copy, Send, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { MEMBERS, type MemberId } from '../data/members'
import { formatAmount } from '../lib/format'
import { createIssuePayload, createIssueUrl } from '../lib/issue-url'
import { entryInputSchema, type EntryInput } from '../lib/schema'
import { splitAmount } from '../lib/split'
import { MemberChip } from './MemberChip'

type FormState = { date: string; payer: MemberId | ''; item: string; amount: string; sharers: MemberId[] }
type FieldName = keyof FormState
const today = new Date().toISOString().slice(0, 10)
const INITIAL_FORM: FormState = { date: today, payer: '', item: '', amount: '', sharers: [] }

function getInput(form: FormState): EntryInput | null {
  const amount = Number(form.amount)
  const result = entryInputSchema.safeParse({ ...form, item: form.item.trim(), amount })
  return result.success ? result.data : null
}

function getErrors(form: FormState): Partial<Record<FieldName, string>> {
  const amount = Number(form.amount)
  const result = entryInputSchema.safeParse({ ...form, item: form.item.trim(), amount })
  if (result.success) return {}
  return result.error.issues.reduce<Partial<Record<FieldName, string>>>((errors, issue) => {
    const field = issue.path[0] as FieldName
    return errors[field] ? errors : { ...errors, [field]: issue.message }
  }, {})
}

export function AddEntrySheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [touchedFields, setTouchedFields] = useState<Set<FieldName>>(new Set())
  const [isSent, setIsSent] = useState(false)
  const touchStartY = useRef<number | null>(null)
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
  const sendUrl = input ? createIssueUrl(input) : undefined

  async function copyPayload() {
    if (!input) return
    try {
      await navigator.clipboard.writeText(createIssuePayload(input))
      setIsSent(true)
    } catch {
      window.alert('تعذر النسخ. انسخ البيانات يدويًا من النموذج.')
    }
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 sm:items-center sm:justify-center sm:p-4" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="entry-sheet-title"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => { touchStartY.current = event.touches[0].clientY }}
        onTouchEnd={(event) => { if (touchStartY.current !== null && event.changedTouches[0].clientY - touchStartY.current > 100) onClose(); touchStartY.current = null }}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--color-border)]" aria-hidden="true" />
        <div className="mb-6 flex items-center justify-between gap-4"><h2 id="entry-sheet-title" className="font-heading text-3xl font-bold text-[var(--color-foreground)]">إضافة مصروف</h2><button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-full text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]" aria-label="إغلاق"><X aria-hidden="true" /></button></div>
        <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
          <fieldset><legend className="mb-3 text-base font-bold text-[var(--color-foreground)]">من دفع؟</legend><div className="flex flex-wrap gap-2">{MEMBERS.map((member) => <MemberChip key={member.id} {...member} isSelected={form.payer === member.id} onClick={() => { setField('payer', member.id); touch('payer') }} />)}</div>{touchedFields.has('payer') && errors.payer && <p className="mt-2 text-sm text-[var(--color-negative)]">{errors.payer}</p>}</fieldset>
          <label className="block text-base font-bold text-[var(--color-foreground)]">ماذا اشترى؟<input value={form.item} onChange={(event) => setField('item', event.target.value)} onBlur={() => touch('item')} maxLength={80} aria-invalid={Boolean(touchedFields.has('item') && errors.item)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]" /></label>{touchedFields.has('item') && errors.item && <p className="-mt-4 text-sm text-[var(--color-negative)]">{errors.item}</p>}
          <label className="block text-base font-bold text-[var(--color-foreground)]">المبلغ<input value={form.amount} onChange={(event) => setField('amount', event.target.value.replace(/[^0-9]/g, ''))} onBlur={() => touch('amount')} inputMode="numeric" aria-invalid={Boolean(touchedFields.has('amount') && errors.amount)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base tabular-nums text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]" /></label>{touchedFields.has('amount') && errors.amount && <p className="-mt-4 text-sm text-[var(--color-negative)]">{errors.amount}</p>}
          <label className="block text-base font-bold text-[var(--color-foreground)]">التاريخ<input type="date" value={form.date} onChange={(event) => setField('date', event.target.value)} onBlur={() => touch('date')} aria-invalid={Boolean(touchedFields.has('date') && errors.date)} className="mt-2 min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]" /></label>{touchedFields.has('date') && errors.date && <p className="-mt-4 text-sm text-[var(--color-negative)]">{errors.date}</p>}
          <fieldset><div className="mb-3 flex items-center justify-between gap-3"><legend className="text-base font-bold text-[var(--color-foreground)]">من شارك؟</legend><button type="button" onClick={toggleAll} className="min-h-11 rounded-full px-3 text-base font-semibold text-[var(--color-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]" aria-pressed={isAllSelected}>الكل</button></div><div className="flex flex-wrap gap-2">{MEMBERS.map((member) => <MemberChip key={member.id} {...member} isSelected={form.sharers.includes(member.id)} onClick={() => { toggleSharer(member.id); touch('sharers') }} />)}</div>{touchedFields.has('sharers') && errors.sharers && <p className="mt-2 text-sm text-[var(--color-negative)]">{errors.sharers}</p>}</fieldset>
          <aside className="rounded-2xl bg-[var(--color-surface)] p-4 text-center text-base text-[var(--color-foreground)]" aria-live="polite">{preview ? isEvenSplit ? <><strong>{selectedCount} أشخاص</strong> · <span className="tabular-nums">{formatAmount([...preview.values()][0])}</span> للشخص</> : <><strong>{selectedCount} أشخاص</strong> · حصص متفاوتة: {[...preview.values()].map(formatAmount).join('، ')}</> : 'أكمل الحقول لمعاينة القسمة'}</aside>
          <div className="grid gap-3 sm:grid-cols-2"><a href={sendUrl} target="_blank" rel="noreferrer" onClick={() => { if (input) setIsSent(true) }} aria-disabled={!input} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-base font-bold focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] ${input ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'pointer-events-none bg-[var(--color-border)] text-[var(--color-muted)]'}`}><Send aria-hidden="true" size={19}/>إرسال عبر GitHub</a><button type="button" disabled={!input} onClick={copyPayload} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-base font-bold text-[var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"><Copy aria-hidden="true" size={19}/>نسخ</button></div>
          {!input && <p className="text-center text-sm text-[var(--color-muted)]">أكمل الحقول المطلوبة لإرسال الإدخال.</p>}
          {isSent && <p className="rounded-xl border border-[var(--color-secondary)] bg-[var(--color-surface)] p-3 text-sm leading-6 text-[var(--color-foreground)]">تم إرسال الإدخال. سيظهر على الموقع خلال دقيقة تقريبًا بعد اكتمال البناء. <a className="font-bold text-[var(--color-secondary)] underline" href="https://github.com/ahmadjz/office-expenses/actions" target="_blank" rel="noreferrer">عرض البناء</a></p>}
        </form>
      </section>
    </div>
  )
}
