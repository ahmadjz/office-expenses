import { ChangePasswordForm } from './ChangePasswordForm'
import { Sheet } from './Sheet'
import { secondaryButtonClass } from './ui'

export function PasswordPrompt({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="غيّر كلمة المرور" titleId="password-prompt-title" onClose={onClose}>
      <p className="mb-6 text-base leading-7 text-[var(--color-muted)]">
        تدخل الآن بكلمة مرور أعطاك إياها المسؤول. اختر كلمة مرور خاصة بك حتى لا يدخل أحد باسمك.
      </p>
      <ChangePasswordForm onChanged={onClose} />
      <div className="mt-6 border-t border-[var(--color-border)] pt-6">
        <button type="button" onClick={onClose} className={`${secondaryButtonClass} w-full`}>لاحقًا</button>
        <p className="mt-3 text-center text-sm text-[var(--color-muted)]">يمكنك تغييرها في أي وقت من «حسابي» أعلى الصفحة.</p>
      </div>
    </Sheet>
  )
}
