import { describe, expect, it } from 'vitest'
import { entries } from './entries'

describe('ledger entries', () => {
  it('supports an empty ledger before the first expense is added', () => {
    expect(entries).toEqual([])
  })
})
