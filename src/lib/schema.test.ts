import { describe, expect, it } from 'vitest'
import { entryInputSchema } from './schema'

const validEntry = { date: '2026-08-03', payer: 'ahmad', item: 'جبنة', amount: 100, sharers: ['ahmad'] }

describe('entryInputSchema', () => {
  it('rejects invalid ledger boundaries', () => {
    expect(entryInputSchema.safeParse({ ...validEntry, payer: 'nobody' }).success).toBe(false)
    expect(entryInputSchema.safeParse({ ...validEntry, sharers: [] }).success).toBe(false)
    expect(entryInputSchema.safeParse({ ...validEntry, amount: 0 }).success).toBe(false)
    expect(entryInputSchema.safeParse({ ...validEntry, amount: -1 }).success).toBe(false)
    expect(entryInputSchema.safeParse({ ...validEntry, amount: 1.5 }).success).toBe(false)
    expect(entryInputSchema.safeParse({ ...validEntry, sharers: ['ahmad', 'ahmad'] }).success).toBe(false)
  })
})
