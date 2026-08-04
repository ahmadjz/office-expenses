export const WEEK_START_DAY = 6
const DAY_MS = 86_400_000

function parseDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`)
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getWeekStart(date: string): string {
  const current = parseDate(date)
  const daysSinceSaturday = (current.getUTCDay() - WEEK_START_DAY + 7) % 7
  return formatDate(new Date(current.getTime() - daysSinceSaturday * DAY_MS))
}

export function getWeekEnd(weekStart: string): string {
  return formatDate(new Date(parseDate(weekStart).getTime() + 6 * DAY_MS))
}
