import { useEffect, useState } from 'react'
import { refreshSession } from '../lib/api'
import { pb } from '../lib/pb'
import { memberSchema, type Member } from '../lib/schema'

const SESSION_RECHECK_MS = 5 * 60 * 1000

type AuthState = { status: 'checking' } | { status: 'signed-out' } | { status: 'signed-in'; member: Member }

function readAuth(): AuthState {
  const result = memberSchema.safeParse(pb.authStore.record)
  return pb.authStore.isValid && result.success ? { status: 'signed-in', member: result.data } : { status: 'signed-out' }
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: 'checking' })
  useEffect(() => {
    const stop = pb.authStore.onChange(() => setState(readAuth()))
    void refreshSession().then(() => setState(readAuth()))
    const recheck = () => { if (document.visibilityState === 'visible') void refreshSession() }
    const timer = setInterval(recheck, SESSION_RECHECK_MS)
    document.addEventListener('visibilitychange', recheck)
    return () => {
      stop()
      clearInterval(timer)
      document.removeEventListener('visibilitychange', recheck)
    }
  }, [])
  return state
}
