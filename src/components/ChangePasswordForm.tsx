import { useMemo, useState, type SubmitEvent } from 'react'
import { changeOwnPassword, errorMessage } from '../lib/api'
import { firstErrors } from '../lib/forms'
import { changePasswordInputSchema } from '../lib/schema'
import { SubmitBar } from './SubmitBar'
import { errorTextClass, inputClass } from './ui'

type FieldName = 'oldPassword' | 'password' | 'passwordConfirm'

const FIELDS: { name: FieldName; label: string; autoComplete: string }[] = [
  { name: 'oldPassword', label: 'كلمة المرور الحالية', autoComplete: 'current-password' },
  { name: 'password', label: 'كلمة المرور الجديدة', autoComplete: 'new-password' },
  { name: 'passwordConfirm', label: 'تأكيد كلمة المرور الجديدة', autoComplete: 'new-password' },
]

export function ChangePasswordForm({ onChanged }: { onChanged: () => void }) {
  const [values, setValues] = useState<Record<FieldName, string>>({ oldPassword: '', password: '', passwordConfirm: '' })
  const [touched, setTouched] = useState<Set<FieldName>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const result = useMemo(() => changePasswordInputSchema.safeParse(values), [values])
  const errors = firstErrors<FieldName>(result)
  const showError = (field: FieldName) => (touched.has(field) ? errors[field] : undefined)

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!result.success) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await changeOwnPassword(result.data)
      onChanged()
    } catch (error) {
      setSaveError(errorMessage(error))
      setIsSaving(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={submit} noValidate>
      {FIELDS.map(({ name, label, autoComplete }) => (
        <div key={name}>
          <label className="block text-base font-bold text-[var(--color-foreground)]">
            {label}
            <input
              type="password"
              dir="ltr"
              autoComplete={autoComplete}
              value={values[name]}
              onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
              onBlur={() => setTouched((fields) => new Set([...fields, name]))}
              aria-invalid={Boolean(showError(name))}
              className={inputClass}
            />
          </label>
          {showError(name) && <p className={`mt-2 ${errorTextClass}`}>{errors[name]}</p>}
        </div>
      ))}
      <SubmitBar isReady={result.success} isSaving={isSaving} error={saveError} incompleteMessage="كلمة المرور الجديدة 8 أحرف على الأقل." label="تغيير كلمة المرور" />
    </form>
  )
}
