import { describe, expect, it } from 'vitest'
import { entries } from './entries'

describe('ledger entries', () => {
  it('loads every checked-in ledger entry through the shared schema', () => {
    expect(entries).toEqual(expect.any(Array))
    expect(entries.every((entry) => Number.isInteger(entry.amount) && entry.amount > 0)).toBe(true)
  })
})
