import { describe, expect, it } from 'vitest'
import { summarizeWeek } from './summary'
import type { Expense, Payment } from './schema'

const order = new Map(['ahmad', 'abu-obaida', 'kasem', 'abu-khaled', 'abu-tareq', 'abu-adnan', 'abu-mohsen'].map((id, index) => [id, index + 1]))

const expenses: Expense[] = [{
  id: 'e1', date: '2026-08-03', payer: 'abu-khaled', item: 'شاي', amount: 100,
  sharers: ['ahmad', 'abu-obaida', 'kasem'], createdBy: 'ahmad', created: '2026-08-03 09:12:00.000Z',
}]

const payments: Payment[] = [{
  id: 'p1', date: '2026-08-05', from: 'abu-obaida', to: 'abu-khaled', amount: 33,
  createdBy: 'ahmad', created: '2026-08-05 10:00:00.000Z',
}]

describe('summarizeWeek', () => {
  it('accounts for a payer who did not share the item', () => {
    expect(summarizeWeek(expenses, [], order)).toEqual([
      { id: 'ahmad', paid: 0, owed: 34, settled: 0, net: -34 },
      { id: 'abu-obaida', paid: 0, owed: 33, settled: 0, net: -33 },
      { id: 'kasem', paid: 0, owed: 33, settled: 0, net: -33 },
      { id: 'abu-khaled', paid: 100, owed: 0, settled: 0, net: 100 },
    ])
  })

  it('clears the payer debt and reduces the receiver credit by the settled amount', () => {
    expect(summarizeWeek(expenses, payments, order)).toEqual([
      { id: 'ahmad', paid: 0, owed: 34, settled: 0, net: -34 },
      { id: 'abu-obaida', paid: 0, owed: 33, settled: 33, net: 0 },
      { id: 'kasem', paid: 0, owed: 33, settled: 0, net: -33 },
      { id: 'abu-khaled', paid: 100, owed: 0, settled: -33, net: 67 },
    ])
  })

  it('includes a member who only appears through a payment', () => {
    const outsider: Payment = { ...payments[0], id: 'p2', from: 'abu-mohsen', to: 'abu-khaled', amount: 10 }
    expect(summarizeWeek(expenses, [outsider], order)).toContainEqual({ id: 'abu-mohsen', paid: 0, owed: 0, settled: 10, net: 10 })
  })

  it('keeps a row for a member who is no longer in the roster', () => {
    const departed: Expense = { ...expenses[0], id: 'e2', sharers: ['ahmad', 'gone'] }
    expect(summarizeWeek([departed], [], order).map((row) => row.id)).toEqual(['ahmad', 'abu-khaled', 'gone'])
  })

  it('keeps every net summing to zero so nothing is invented or lost', () => {
    const total = summarizeWeek(expenses, payments, order).reduce((sum, member) => sum + member.net, 0)
    expect(total).toBe(0)
  })
})
