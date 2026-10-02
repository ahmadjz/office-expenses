import { describe, expect, it } from 'vitest'
import { groupByWeek } from './feed'
import type { Expense, Payment } from './schema'

const order = new Map([['ahmad', 1], ['kasem', 3]])

const expense = (id: string, date: string): Expense => ({
  id, date, payer: 'ahmad', item: 'جبنة', amount: 100, sharers: ['ahmad', 'kasem'],
  createdBy: 'ahmad', created: `${date} 09:00:00.000Z`,
})

const payment = (id: string, date: string, created: string): Payment => ({
  id, date, from: 'kasem', to: 'ahmad', amount: 50, createdBy: 'ahmad', created,
})

const itemIds = (week: ReturnType<typeof groupByWeek>[number]) => week.items.map((item) => (item.kind === 'expense' ? item.expense.id : item.payment.id))

describe('groupByWeek', () => {
  it('buckets expenses and payments into the same Saturday week, newest week first', () => {
    const weeks = groupByWeek([expense('e1', '2026-08-03'), expense('e2', '2026-07-31')], [payment('p1', '2026-08-05', '2026-08-05 09:00:00.000Z')], order)
    expect(weeks.map((week) => week.weekStart)).toEqual(['2026-08-01', '2026-07-25'])
    expect(weeks[0].expenses.map((item) => item.id)).toEqual(['e1'])
    expect(weeks[0].payments.map((item) => item.id)).toEqual(['p1'])
    expect(weeks[1].payments).toEqual([])
  })

  it('interleaves payments and expenses newest first within a week', () => {
    const weeks = groupByWeek([expense('e1', '2026-08-03')], [payment('p1', '2026-08-02', '2026-08-02 09:00:00.000Z'), payment('p2', '2026-08-05', '2026-08-05 09:00:00.000Z')], order)
    expect(itemIds(weeks[0])).toEqual(['p2', 'e1', 'p1'])
  })

  it('breaks a same-day tie by creation time', () => {
    const weeks = groupByWeek([expense('e1', '2026-08-03')], [payment('p1', '2026-08-03', '2026-08-03 11:00:00.000Z')], order)
    expect(weeks[0].items[0].kind).toBe('payment')
  })

  it('attaches each week its own summary', () => {
    const weeks = groupByWeek([expense('e1', '2026-08-03')], [payment('p1', '2026-08-05', '2026-08-05 09:00:00.000Z')], order)
    expect(weeks[0].summary.map(({ id, net }) => ({ id, net }))).toEqual([{ id: 'ahmad', net: 0 }, { id: 'kasem', net: 0 }])
  })

  it('returns no weeks for an empty ledger', () => {
    expect(groupByWeek([], [], order)).toEqual([])
  })
})
