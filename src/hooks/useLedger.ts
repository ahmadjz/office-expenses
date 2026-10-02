import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLedger, subscribeToLedger, type Ledger } from '../lib/api'

const REALTIME_DEBOUNCE_MS = 300

export type LedgerState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; ledger: Ledger; isStale: boolean }

export function useLedger(): { state: LedgerState; reload: () => Promise<void> } {
  const [state, setState] = useState<LedgerState>({ status: 'loading' })
  const latestRequest = useRef(0)

  const reload = useCallback(async () => {
    const request = ++latestRequest.current
    try {
      const ledger = await fetchLedger()
      if (request === latestRequest.current) setState({ status: 'ready', ledger, isStale: false })
    } catch (error) {
      console.error('تعذّر تحميل البيانات', error)
      if (request === latestRequest.current) setState((current) => (current.status === 'ready' ? { ...current, isStale: true } : { status: 'error' }))
    }
  }, [])

  useEffect(() => {
    void reload()
    let timer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = subscribeToLedger(() => {
      clearTimeout(timer)
      timer = setTimeout(() => void reload(), REALTIME_DEBOUNCE_MS)
    })
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [reload])

  return { state, reload }
}
