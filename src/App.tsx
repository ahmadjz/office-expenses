import { CircleAlert, RotateCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { FeedView } from './components/FeedView'
import { LoginView } from './components/LoginView'
import { MembersView } from './components/MembersView'
import { secondaryButtonClass } from './components/ui'
import { useAuth } from './hooks/useAuth'
import { useLedger } from './hooks/useLedger'
import { buildRoster } from './lib/roster'
import type { Member } from './lib/schema'

export default function App() {
  const auth = useAuth()
  if (auth.status === 'checking') return null
  if (auth.status === 'signed-out') return <LoginView />
  return <SignedInApp key={auth.member.id} member={auth.member} />
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="جارٍ التحميل">
      {[0, 1].map((index) => (
        <div key={index} className="space-y-3 motion-safe:animate-pulse">
          <div className="h-8 w-2/3 rounded-xl bg-[var(--color-surface)]" />
          <div className="h-40 rounded-2xl bg-[var(--color-surface)]" />
          <div className="h-24 rounded-2xl bg-[var(--color-surface)]" />
        </div>
      ))}
    </div>
  )
}

function SignedInApp({ member }: { member: Member }) {
  const { state, reload } = useLedger()
  const [view, setView] = useState<'feed' | 'members'>('feed')
  const ledger = state.status === 'ready' ? state.ledger : null
  const roster = useMemo(() => buildRoster(ledger?.members ?? []), [ledger])
  const onChanged = () => void reload()

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 pb-28 pt-8">
      <AppHeader member={member} view={view} onViewChange={setView} />
      {ledger && ledger.invalidCount > 0 && (
        <p role="alert" className="mb-6 flex items-center gap-2 rounded-xl border border-[var(--color-negative)] p-3 text-sm text-[var(--color-negative)]">
          <CircleAlert aria-hidden="true" size={18} />تعذّر عرض {ledger.invalidCount} من السجلات لأنها غير صالحة. أبلغ المسؤول.
        </p>
      )}
      {state.status === 'ready' && state.isStale && (
        <p role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-negative)] p-3 text-sm text-[var(--color-negative)]">
          <span className="flex items-center gap-2"><CircleAlert aria-hidden="true" size={18} />تعذّر تحديث البيانات، وقد لا يكون المعروض آخر ما سُجّل.</span>
          <button type="button" onClick={onChanged} className={secondaryButtonClass}><RotateCw aria-hidden="true" size={18} />تحديث</button>
        </p>
      )}
      {state.status === 'loading' && <LoadingSkeleton />}
      {state.status === 'error' && (
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          <p className="text-base text-[var(--color-foreground)]">تعذّر تحميل البيانات</p>
          <button type="button" onClick={onChanged} className={`${secondaryButtonClass} mt-4`}><RotateCw aria-hidden="true" size={18} />إعادة المحاولة</button>
        </section>
      )}
      {ledger && view === 'feed' && <FeedView ledger={ledger} roster={roster} member={member} onChanged={onChanged} />}
      {ledger && view === 'members' && member.isAdmin && <MembersView roster={roster} signedInId={member.id} onChanged={onChanged} />}
    </main>
  )
}
