import { ArrowRight, LogOut, UserRound, Users } from 'lucide-react'
import { logout } from '../lib/api'
import type { Member } from '../lib/schema'
import { focusRing } from './ui'

export type View = 'feed' | 'members' | 'account'

type AppHeaderProps = { member: Member; view: View; onViewChange: (view: View) => void }

const TITLES: Record<View, string> = { feed: 'مصاريف المكتب', members: 'الأعضاء', account: 'حسابي' }

const linkClass = `inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-semibold text-[var(--color-secondary)] ${focusRing}`

export function AppHeader({ member, view, onViewChange }: AppHeaderProps) {
  return (
    <header className="mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-base text-[var(--color-muted)]">مرحبًا، <strong className="text-[var(--color-foreground)]">{member.name}</strong></p>
        <nav aria-label="القائمة" className="flex flex-wrap gap-1">
          {view !== 'feed' && <button type="button" onClick={() => onViewChange('feed')} className={linkClass}><ArrowRight aria-hidden="true" size={18} />السجل</button>}
          {member.isAdmin && view !== 'members' && <button type="button" onClick={() => onViewChange('members')} className={linkClass}><Users aria-hidden="true" size={18} />الأعضاء</button>}
          {view !== 'account' && <button type="button" onClick={() => onViewChange('account')} className={linkClass}><UserRound aria-hidden="true" size={18} />حسابي</button>}
          <button type="button" onClick={logout} className={linkClass}><LogOut aria-hidden="true" size={18} />خروج</button>
        </nav>
      </div>
      <h1 className="font-heading text-4xl font-bold text-[var(--color-foreground)]">{TITLES[view]}</h1>
    </header>
  )
}
