import { Check } from 'lucide-react'
import { useState } from 'react'
import type { Member } from '../lib/schema'
import { ChangePasswordForm } from './ChangePasswordForm'

export function AccountView({ member }: { member: Member }) {
  const [changeCount, setChangeCount] = useState(0)
  return (
    <section aria-labelledby="change-password-heading" className="space-y-6">
      <dl className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-base">
        <div className="flex justify-between gap-3"><dt className="text-[var(--color-muted)]">الاسم</dt><dd className="text-[var(--color-foreground)]">{member.name}</dd></div>
        <div className="mt-2 flex justify-between gap-3"><dt className="text-[var(--color-muted)]">اسم المستخدم</dt><dd className="text-[var(--color-foreground)]" dir="ltr">{member.username}</dd></div>
      </dl>
      <h2 id="change-password-heading" className="font-heading text-2xl font-bold text-[var(--color-foreground)]">تغيير كلمة المرور</h2>
      {changeCount > 0 && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-[var(--color-positive)] p-3 text-sm text-[var(--color-positive)]">
          <Check aria-hidden="true" size={18} />تم تغيير كلمة المرور.
        </p>
      )}
      <ChangePasswordForm key={changeCount} onChanged={() => setChangeCount((count) => count + 1)} />
    </section>
  )
}
