import { describe, expect, it } from 'vitest'
import { suggestSettlements } from './settle'
import type { MemberSummary } from './summary'

const summary = (id: MemberSummary['id'], net: number): MemberSummary => ({ id, paid: 0, owed: 0, settled: 0, net })

describe('suggestSettlements', () => {
  it('sends every debtor to the single creditor', () => {
    expect(suggestSettlements([summary('ahmad', -34), summary('abu-obaida', -33), summary('kasem', -33), summary('abu-khaled', 100)])).toEqual([
      { from: 'ahmad', to: 'abu-khaled', amount: 34 },
      { from: 'abu-obaida', to: 'abu-khaled', amount: 33 },
      { from: 'kasem', to: 'abu-khaled', amount: 33 },
    ])
  })

  it('splits one debtor across several creditors', () => {
    expect(suggestSettlements([summary('ahmad', -100), summary('abu-obaida', 60), summary('kasem', 40)])).toEqual([
      { from: 'ahmad', to: 'abu-obaida', amount: 60 },
      { from: 'ahmad', to: 'kasem', amount: 40 },
    ])
  })

  it('breaks equal balances by canonical member order', () => {
    expect(suggestSettlements([summary('kasem', -25), summary('abu-obaida', -25), summary('abu-khaled', 50)])).toEqual([
      { from: 'abu-obaida', to: 'abu-khaled', amount: 25 },
      { from: 'kasem', to: 'abu-khaled', amount: 25 },
    ])
  })

  it('suggests nothing when everyone is square', () => {
    expect(suggestSettlements([summary('ahmad', 0), summary('kasem', 0)])).toEqual([])
    expect(suggestSettlements([])).toEqual([])
  })

  it('zeroes every balance and moves exactly the outstanding total', () => {
    const summaries = [summary('ahmad', -34), summary('abu-obaida', -33), summary('kasem', -8), summary('abu-khaled', 60), summary('abu-tareq', 15)]
    const transfers = suggestSettlements(summaries)
    const moved = transfers.reduce((sum, transfer) => sum + transfer.amount, 0)
    expect(moved).toBe(75)
    for (const { id, net } of summaries) {
      const sent = transfers.filter((transfer) => transfer.from === id).reduce((sum, transfer) => sum + transfer.amount, 0)
      const received = transfers.filter((transfer) => transfer.to === id).reduce((sum, transfer) => sum + transfer.amount, 0)
      expect(net + sent - received).toBe(0)
    }
  })
})
