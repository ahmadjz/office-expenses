import { describe, expect, it } from 'vitest'
import { entryInputSchema, paymentInputSchema } from './schema'

const validEntry = { date: '2026-08-03', payer: 'ahmad', item: 'جبنة', amount: 100, sharers: ['ahmad'] }
const validPayment = { date: '2026-08-03', from: 'kasem', to: 'ahmad', amount: 25 }

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

describe('paymentInputSchema', () => {
  it('accepts a payment between two different members', () => {
    expect(paymentInputSchema.safeParse(validPayment).success).toBe(true)
  })

  it('rejects invalid payment boundaries', () => {
    expect(paymentInputSchema.safeParse({ ...validPayment, to: 'kasem' }).success).toBe(false)
    expect(paymentInputSchema.safeParse({ ...validPayment, from: 'nobody' }).success).toBe(false)
    expect(paymentInputSchema.safeParse({ ...validPayment, amount: 0 }).success).toBe(false)
    expect(paymentInputSchema.safeParse({ ...validPayment, amount: -1 }).success).toBe(false)
    expect(paymentInputSchema.safeParse({ ...validPayment, amount: 25.5 }).success).toBe(false)
    expect(paymentInputSchema.safeParse({ ...validPayment, date: '2026-13-40' }).success).toBe(false)
    expect(paymentInputSchema.safeParse({ ...validPayment, item: 'جبنة' }).success).toBe(false)
  })
})
