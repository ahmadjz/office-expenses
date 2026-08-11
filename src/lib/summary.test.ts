import { describe, expect, it } from 'vitest'
import { summarizeWeek } from './summary'
import type { Entry, Payment } from './schema'

const entries: Entry[] = [{
  id: '2026-08-03-a3f9c1', date: '2026-08-03', payer: 'abu-khaled', item: 'شاي', amount: 100,
  sharers: ['ahmad', 'abu-obaida', 'kasem'], createdAt: '2026-08-03T09:12:00.000Z', issue: 12,
}]

const payments: Payment[] = [{
  id: '2026-08-05-b71d20', date: '2026-08-05', from: 'abu-obaida', to: 'abu-khaled', amount: 33,
  createdAt: '2026-08-05T10:00:00.000Z', issue: 13,
}]

describe('summarizeWeek', () => {
  it('accounts for a payer who did not share the item', () => {
    expect(summarizeWeek(entries, [])).toEqual([
      { id: 'ahmad', paid: 0, owed: 34, settled: 0, net: -34 },
      { id: 'abu-obaida', paid: 0, owed: 33, settled: 0, net: -33 },
      { id: 'kasem', paid: 0, owed: 33, settled: 0, net: -33 },
      { id: 'abu-khaled', paid: 100, owed: 0, settled: 0, net: 100 },
    ])
  })

  it('clears the payer debt and reduces the receiver credit by the settled amount', () => {
    expect(summarizeWeek(entries, payments)).toEqual([
      { id: 'ahmad', paid: 0, owed: 34, settled: 0, net: -34 },
      { id: 'abu-obaida', paid: 0, owed: 33, settled: 33, net: 0 },
      { id: 'kasem', paid: 0, owed: 33, settled: 0, net: -33 },
      { id: 'abu-khaled', paid: 100, owed: 0, settled: -33, net: 67 },
    ])
  })

  it('includes a member who only appears through a payment', () => {
    const outsider: Payment = { ...payments[0], id: '2026-08-05-c92e31', from: 'abu-mohsen', to: 'abu-khaled', amount: 10 }
    expect(summarizeWeek(entries, [outsider])).toContainEqual({ id: 'abu-mohsen', paid: 0, owed: 0, settled: 10, net: 10 })
  })

  it('keeps every net summing to zero so nothing is invented or lost', () => {
    const total = summarizeWeek(entries, payments).reduce((sum, member) => sum + member.net, 0)
    expect(total).toBe(0)
  })
})
