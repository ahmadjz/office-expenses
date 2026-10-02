import { useEffect, useState } from 'react'
import { todayInDamascus } from '../lib/dates'

const CHECK_MS = 60 * 1000

export function useToday(): string {
  const [today, setToday] = useState(todayInDamascus)
  useEffect(() => {
    const update = () => setToday(todayInDamascus())
    const timer = setInterval(update, CHECK_MS)
    document.addEventListener('visibilitychange', update)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])
  return today
}
