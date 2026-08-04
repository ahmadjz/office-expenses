import { describe, expect, it } from 'vitest'
import { summarizeWeek } from './summary'
import type { Entry } from './schema'

const fixture: Entry[] = [{
  id: '2026-08-03-a3f9c1', date: '2026-08-03', payer: 'abu-khaled', item: 'شاي', amount: 100,
  sharers: ['ahmad', 'abu-obaida', 'kasem'], createdAt: '2026-08-03T09:12:00.000Z', issue: 12,
}]

describe('summarizeWeek', () => {
  it('accounts for a payer who did not share the item', () => {
    expect(summarizeWeek(fixture)).toEqual([
      { id: 'ahmad', paid: 0, owed: 34, net: -34 },
      { id: 'abu-obaida', paid: 0, owed: 33, net: -33 },
      { id: 'kasem', paid: 0, owed: 33, net: -33 },
      { id: 'abu-khaled', paid: 100, owed: 0, net: 100 },
    ])
  })
})
