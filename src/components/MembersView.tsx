import { KeyRound, Pencil, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { updateMember } from '../lib/api'
import type { Roster } from '../lib/roster'
import type { Member, MemberId } from '../lib/schema'
import { ConfirmSheet } from './ConfirmSheet'
import { MemberFormSheet, type MemberFormMode } from './MemberFormSheet'
import { focusRing, primaryButtonClass } from './ui'

type MembersViewProps = { roster: Roster; signedInId: MemberId; onChanged: () => void }

const actionClass = `inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-[var(--color-secondary)] ${focusRing}`

export function MembersView({ roster, signedInId, onChanged }: MembersViewProps) {
  const [form, setForm] = useState<MemberFormMode | null>(null)
  const [toggling, setToggling] = useState<Member | null>(null)

  return (
    <section aria-label="إدارة الأعضاء" className="space-y-4">
      <button type="button" onClick={() => setForm({ kind: 'add' })} className={`${primaryButtonClass} w-full`}>
        <UserPlus aria-hidden="true" size={19} />إضافة عضو
      </button>
      <ul className="space-y-3">
        {roster.members.map((member) => (
          <li key={member.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-heading text-xl text-[var(--color-foreground)]">{member.name}</p>
              <p className={`text-sm font-semibold ${member.active ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                {member.active ? 'فعّال' : 'معطّل'}{member.isAdmin && ' · مسؤول'}
              </p>
            </div>
            <p className="text-sm text-[var(--color-muted)]" dir="ltr">{member.username}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <button type="button" onClick={() => setForm({ kind: 'rename', member })} className={actionClass} aria-label={`تعديل اسم ${member.name}`}><Pencil aria-hidden="true" size={16} />تعديل</button>
              <button type="button" onClick={() => setForm({ kind: 'password', member })} className={actionClass} aria-label={`إعادة تعيين كلمة مرور ${member.name}`}><KeyRound aria-hidden="true" size={16} />إعادة تعيين كلمة المرور</button>
              {member.id !== signedInId && (
                <button type="button" onClick={() => setToggling(member)} className={`${actionClass} ${member.active ? 'text-[var(--color-negative)]' : ''}`} aria-label={`${member.active ? 'تعطيل' : 'تفعيل'} ${member.name}`}>
                  {member.active ? 'تعطيل' : 'تفعيل'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {form && <MemberFormSheet mode={form} onClose={() => setForm(null)} onSaved={onChanged} />}
      {toggling && (
        <ConfirmSheet
          title={toggling.active ? 'تعطيل العضو' : 'تفعيل العضو'}
          description={toggling.active
            ? `لن يستطيع ${toggling.name} الدخول، ولن يظهر في الاختيارات الجديدة. تبقى سجلاته السابقة كما هي.`
            : `سيستطيع ${toggling.name} الدخول مجددًا بكلمة مروره الحالية.`}
          confirmLabel={toggling.active ? 'تعطيل' : 'تفعيل'}
          onConfirm={async () => { await updateMember(toggling.id, { active: !toggling.active }); onChanged() }}
          onClose={() => setToggling(null)}
        />
      )}
    </section>
  )
}
