import { describe, expect, it } from 'vitest'
import { createIssueUrl, createPaymentIssueUrl } from './issue-url'

describe('createIssueUrl', () => {
  it('encodes a complete prefilled issue', () => {
    const url = createIssueUrl({ date: '2026-08-03', payer: 'ahmad', item: 'نص كيلو جبنة', amount: 100, sharers: ['ahmad'] })
    expect(url).toContain('labels=entry')
    expect(decodeURIComponent(url)).toContain('```json')
    expect(decodeURIComponent(url)).toContain('نص كيلو جبنة')
    expect(decodeURIComponent(url)).toContain('"kind": "expense"')
  })
})

describe('createPaymentIssueUrl', () => {
  it('encodes a prefilled payment issue the Action can route', () => {
    const url = createPaymentIssueUrl({ date: '2026-08-05', from: 'kasem', to: 'ahmad', amount: 25 })
    const decoded = decodeURIComponent(url)
    expect(decoded).toContain('"kind": "payment"')
    expect(decoded).toContain('"from": "kasem"')
    expect(decoded).toContain('دفعة: كاسم إلى أحمد')
  })
})
