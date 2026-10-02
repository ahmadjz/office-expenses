import { describe, expect, it } from 'vitest'
import { parseRecords } from './api'
import { expenseInputSchema, expenseSchema, newMemberInputSchema, paymentInputSchema } from './schema'

const validExpense = { date: '2026-08-03', payer: 'm1', item: 'جبنة', amount: 100, sharers: ['m1'] }
const validPayment = { date: '2026-08-03', from: 'm2', to: 'm1', amount: 25 }

describe('expenseInputSchema', () => {
  it('accepts a valid expense', () => {
    expect(expenseInputSchema.safeParse(validExpense).success).toBe(true)
  })

  it('rejects invalid ledger boundaries', () => {
    expect(expenseInputSchema.safeParse({ ...validExpense, payer: '' }).success).toBe(false)
    expect(expenseInputSchema.safeParse({ ...validExpense, sharers: [] }).success).toBe(false)
    expect(expenseInputSchema.safeParse({ ...validExpense, amount: 0 }).success).toBe(false)
    expect(expenseInputSchema.safeParse({ ...validExpense, amount: -1 }).success).toBe(false)
    expect(expenseInputSchema.safeParse({ ...validExpense, amount: 1.5 }).success).toBe(false)
    expect(expenseInputSchema.safeParse({ ...validExpense, sharers: ['m1', 'm1'] }).success).toBe(false)
    expect(expenseInputSchema.safeParse({ ...validExpense, item: '   ' }).success).toBe(false)
    expect(expenseInputSchema.safeParse({ ...validExpense, date: '2026-02-31' }).success).toBe(false)
    expect(expenseInputSchema.safeParse({ ...validExpense, date: '2999-01-01' }).success).toBe(false)
  })
})

describe('paymentInputSchema', () => {
  it('accepts a payment between two different members', () => {
    expect(paymentInputSchema.safeParse(validPayment).success).toBe(true)
  })

  it('rejects invalid payment boundaries', () => {
    expect(paymentInputSchema.safeParse({ ...validPayment, to: 'm2' }).success).toBe(false)
    expect(paymentInputSchema.safeParse({ ...validPayment, to: '' }).success).toBe(false)
    expect(paymentInputSchema.safeParse({ ...validPayment, amount: 25.5 }).success).toBe(false)
    expect(paymentInputSchema.safeParse({ ...validPayment, date: '2026-13-40' }).success).toBe(false)
  })
})

describe('newMemberInputSchema', () => {
  it('only accepts usernames the server will accept', () => {
    expect(newMemberInputSchema.safeParse({ name: 'أبو سامي', username: 'abu-sami', password: 'long-enough' }).success).toBe(true)
    expect(newMemberInputSchema.safeParse({ name: 'أبو سامي', username: 'Abu Sami', password: 'long-enough' }).success).toBe(false)
    expect(newMemberInputSchema.safeParse({ name: 'أبو سامي', username: 'abu-sami', password: 'short' }).success).toBe(false)
  })
})

describe('parseRecords', () => {
  it('skips a record that fails validation instead of throwing, and counts it', () => {
    const good = { ...validExpense, id: 'e1', createdBy: 'm1', created: '2026-08-03 09:00:00.000Z', collectionName: 'expenses', collectionId: 'c' }
    const floatAmount = { ...good, id: 'e2', amount: 10.5 }
    const originalError = console.error
    console.error = () => undefined
    const result = parseRecords([good, floatAmount], expenseSchema)
    console.error = originalError
    expect(result.valid.map((record) => record.id)).toEqual(['e1'])
    expect(result.invalidCount).toBe(1)
  })
})
