import { useMemo, useState, type SubmitEvent } from 'react'
import { createMember, errorMessage, resetPassword, updateMember } from '../lib/api'
import { firstErrors } from '../lib/forms'
import { newMemberInputSchema, passwordInputSchema, renameMemberInputSchema, type Member } from '../lib/schema'
import { Sheet } from './Sheet'
import { SubmitBar } from './SubmitBar'
import { errorTextClass, inputClass } from './ui'

export type MemberFormMode = { kind: 'add' } | { kind: 'rename'; member: Member } | { kind: 'password'; member: Member }

type FieldName = 'name' | 'username' | 'password'

const TITLES: Record<MemberFormMode['kind'], string> = { add: 'إضافة عضو', rename: 'تعديل الاسم', password: 'إعادة تعيين كلمة المرور' }

function schemaFor(mode: MemberFormMode) {
  if (mode.kind === 'add') return newMemberInputSchema
  return mode.kind === 'rename' ? renameMemberInputSchema : passwordInputSchema
}

async function submitMode(mode: MemberFormMode, values: Record<FieldName, string>): Promise<void> {
  if (mode.kind === 'add') return createMember(newMemberInputSchema.parse(values))
  if (mode.kind === 'rename') return updateMember(mode.member.id, renameMemberInputSchema.parse(values))
  return resetPassword(mode.member.id, values.password)
}

export function MemberFormSheet({ mode, onClose, onSaved }: { mode: MemberFormMode; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState<Record<FieldName, string>>({ name: mode.kind === 'rename' ? mode.member.name : '', username: '', password: '' })
  const [touched, setTouched] = useState<Set<FieldName>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const result = useMemo(() => schemaFor(mode).safeParse(values), [mode, values])
  const errors = firstErrors<FieldName>(result)
  const showError = (field: FieldName) => (touched.has(field) ? errors[field] : undefined)
  const showsName = mode.kind !== 'password'
  const showsUsername = mode.kind === 'add'
  const showsPassword = mode.kind !== 'rename'

  const field = (name: FieldName, label: string, props: { type?: string; dir?: 'ltr'; autoComplete?: string }) => (
    <>
      <label className="block text-base font-bold text-[var(--color-foreground)]">
        {label}
        <input
          {...props}
          value={values[name]}
          onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
          onBlur={() => setTouched((fields) => new Set([...fields, name]))}
          aria-invalid={Boolean(showError(name))}
          className={inputClass}
        />
      </label>
      {showError(name) && <p className={`-mt-4 ${errorTextClass}`}>{errors[name]}</p>}
    </>
  )

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!result.success) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await submitMode(mode, values)
      onSaved()
      onClose()
    } catch (error) {
      setSaveError(errorMessage(error))
      setIsSaving(false)
    }
  }

  return (
    <Sheet title={TITLES[mode.kind]} titleId="member-sheet-title" onClose={onClose}>
      {mode.kind === 'password' && <p className="mb-6 text-base text-[var(--color-muted)]">كلمة مرور جديدة لـ <strong className="text-[var(--color-foreground)]">{mode.member.name}</strong>. أرسلها له مباشرة.</p>}
      <form className="space-y-6" onSubmit={submit} noValidate>
        {showsName && field('name', 'الاسم', {})}
        {showsUsername && field('username', 'اسم المستخدم', { dir: 'ltr', autoComplete: 'off' })}
        {showsUsername && <p className="-mt-4 text-sm text-[var(--color-muted)]">لا يمكن تغييره لاحقًا.</p>}
        {showsPassword && field('password', mode.kind === 'add' ? 'كلمة المرور الأولى' : 'كلمة المرور الجديدة', { dir: 'ltr', autoComplete: 'new-password' })}
        <SubmitBar isReady={result.success} isSaving={isSaving} error={saveError} incompleteMessage="أكمل الحقول المطلوبة." />
      </form>
    </Sheet>
  )
}
