import { describe, expect, it } from 'vitest'
import { splitArchive } from './archive'
import type { FeedWeek } from './feed'

const week = (weekStart: string, net: number): FeedWeek => ({
  weekStart,
  expenses: [],
  payments: [],
  items: [],
  summary: [{ id: 'ahmad', paid: 0, owed: 0, settled: 0, net }, { id: 'kasem', paid: 0, owed: 0, settled: 0, net: -net }],
})

const TODAY = '2026-10-02'

describe('splitArchive', () => {
  it('shows the current week and the two before it, even when they are settled', () => {
    const { shown, archived } = splitArchive([week('2026-09-26', 0), week('2026-09-19', 0), week('2026-09-12', 0)], TODAY)
    expect(shown.map((w) => w.weekStart)).toEqual(['2026-09-26', '2026-09-19', '2026-09-12'])
    expect(shown.every((w) => !w.isUnsettledArchive)).toBe(true)
    expect(archived).toEqual([])
  })

  it('archives an older week once it is settled', () => {
    const { shown, archived } = splitArchive([week('2026-09-26', 0), week('2026-09-05', 0)], TODAY)
    expect(shown.map((w) => w.weekStart)).toEqual(['2026-09-26'])
    expect(archived.map((w) => w.weekStart)).toEqual(['2026-09-05'])
  })

  it('keeps an older week with any non-zero balance in the main feed, flagged', () => {
    const { shown, archived } = splitArchive([week('2026-09-26', 0), week('2026-08-29', 909)], TODAY)
    expect(shown.map((w) => [w.weekStart, w.isUnsettledArchive])).toEqual([['2026-09-26', false], ['2026-08-29', true]])
    expect(archived).toEqual([])
  })

  it('counts calendar weeks, not weeks that happen to have records', () => {
    const { shown, archived } = splitArchive([week('2026-09-05', 0)], TODAY)
    expect(shown).toEqual([])
    expect(archived.map((w) => w.weekStart)).toEqual(['2026-09-05'])
  })
})
