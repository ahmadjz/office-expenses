import { LogIn } from 'lucide-react'
import { useState, type SubmitEvent } from 'react'
import { ClientResponseError } from 'pocketbase'
import { errorMessage, login, currentAuthNotice } from '../lib/api'
import { errorTextClass, inputClass, primaryButtonClass } from './ui'

const BAD_CREDENTIALS = 'اسم المستخدم أو كلمة المرور غير صحيحة'

export function LoginView() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice] = useState(currentAuthNotice)

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsWorking(true)
    setError(null)
    try {
      await login(username, password)
    } catch (caught) {
      setError(caught instanceof ClientResponseError && caught.status === 400 ? BAD_CREDENTIALS : errorMessage(caught))
      setIsWorking(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      <h1 className="font-heading text-4xl font-bold text-[var(--color-foreground)]">مصاريف المكتب</h1>
      <p className="mt-2 text-base leading-7 text-[var(--color-muted)]">سجّل الدخول بالحساب الذي أعطاك إياه المسؤول.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block text-base font-bold text-[var(--color-foreground)]">
          اسم المستخدم
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} dir="ltr" required className={inputClass} />
        </label>
        <label className="block text-base font-bold text-[var(--color-foreground)]">
          كلمة المرور
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" dir="ltr" required className={inputClass} />
        </label>
        {notice && !error && <p role="status" className="text-sm text-[var(--color-positive)]">{notice}</p>}
        {error && <p role="alert" className={errorTextClass}>{error}</p>}
        <button type="submit" disabled={isWorking || !username || !password} className={`${primaryButtonClass} w-full`}>
          <LogIn aria-hidden="true" size={19} />{isWorking ? 'جارٍ الدخول…' : 'دخول'}
        </button>
      </form>
    </main>
  )
}
