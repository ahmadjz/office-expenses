import { describe, expect, it } from 'vitest'
import { groupByWeek } from './feed'
import type { Entry, Payment } from './schema'

const entry = (id: string, date: string): Entry => ({
  id, date, payer: 'ahmad', item: 'جبنة', amount: 100, sharers: ['ahmad', 'kasem'],
  createdAt: `${date}T09:00:00.000Z`, issue: 1,
})

const payment = (id: string, date: string, createdAt: string): Payment => ({
  id, date, from: 'kasem', to: 'ahmad', amount: 50, createdAt, issue: 2,
})

describe('groupByWeek', () => {
  it('buckets expenses and payments into the same Saturday week, newest week first', () => {
    const weeks = groupByWeek([entry('2026-08-03-aaaaaa', '2026-08-03'), entry('2026-07-31-bbbbbb', '2026-07-31')], [payment('2026-08-05-cccccc', '2026-08-05', '2026-08-05T09:00:00.000Z')])
    expect(weeks.map((week) => week.weekStart)).toEqual(['2026-08-01', '2026-07-25'])
    expect(weeks[0].entries.map((item) => item.id)).toEqual(['2026-08-03-aaaaaa'])
    expect(weeks[0].payments.map((item) => item.id)).toEqual(['2026-08-05-cccccc'])
    expect(weeks[1].payments).toEqual([])
  })

  it('interleaves payments and expenses newest first within a week', () => {
    const weeks = groupByWeek([entry('2026-08-03-aaaaaa', '2026-08-03')], [payment('2026-08-02-cccccc', '2026-08-02', '2026-08-02T09:00:00.000Z'), payment('2026-08-05-dddddd', '2026-08-05', '2026-08-05T09:00:00.000Z')])
    expect(weeks[0].items.map((item) => (item.kind === 'expense' ? item.entry.id : item.payment.id))).toEqual([
      '2026-08-05-dddddd',
      '2026-08-03-aaaaaa',
      '2026-08-02-cccccc',
    ])
  })

  it('breaks a same-day tie by creation time', () => {
    const weeks = groupByWeek([entry('2026-08-03-aaaaaa', '2026-08-03')], [payment('2026-08-03-cccccc', '2026-08-03', '2026-08-03T11:00:00.000Z')])
    expect(weeks[0].items[0].kind).toBe('payment')
  })

  it('returns no weeks for an empty ledger', () => {
    expect(groupByWeek([], [])).toEqual([])
  })
})
