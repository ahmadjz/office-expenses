import { describe, expect, it } from 'vitest'
import { entries } from './entries'

describe('seeded entries', () => {
  it('loads every checked-in ledger entry through the shared schema', () => {
    expect(entries).toHaveLength(8)
    expect(entries.find((entry) => entry.item === 'نص كيلو جبنة')).toMatchObject({
      amount: 100,
      sharers: ['ahmad', 'abu-obaida', 'kasem', 'abu-adnan'],
    })
  })
})
