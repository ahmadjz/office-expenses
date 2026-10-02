const DAMASCUS_OFFSET_MS = 3 * 60 * 60 * 1000
const DAY_MS = 86_400_000
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function todayInDamascus(now: number = Date.now()): string {
  return new Date(now + DAMASCUS_OFFSET_MS).toISOString().slice(0, 10)
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)
}

export function isCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T12:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function isNoMoreThanTomorrow(value: string): boolean {
  return value <= addDays(todayInDamascus(), 1)
}
