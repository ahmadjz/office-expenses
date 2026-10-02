import { addDays } from './dates'
import type { FeedWeek } from './feed'
import { isSettled } from './summary'
import { getWeekStart } from './week'

export const RECENT_WEEKS = 3

export type ShownWeek = FeedWeek & { isUnsettledArchive: boolean }

export function splitArchive(weeks: readonly FeedWeek[], today: string): { shown: ShownWeek[]; archived: FeedWeek[] } {
  const oldestRecentWeek = addDays(getWeekStart(today), -7 * (RECENT_WEEKS - 1))
  const isRecent = (week: FeedWeek) => week.weekStart >= oldestRecentWeek
  return {
    shown: weeks
      .filter((week) => isRecent(week) || !isSettled(week.summary))
      .map((week) => ({ ...week, isUnsettledArchive: !isRecent(week) })),
    archived: weeks.filter((week) => !isRecent(week) && isSettled(week.summary)),
  }
}
