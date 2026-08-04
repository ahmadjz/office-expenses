import { describe, expect, it } from 'vitest'
import { createIssueUrl } from './issue-url'

describe('createIssueUrl', () => {
  it('encodes a complete prefilled issue', () => {
    const url = createIssueUrl({ date: '2026-08-03', payer: 'ahmad', item: 'نص كيلو جبنة', amount: 100, sharers: ['ahmad'] })
    expect(url).toContain('labels=entry')
    expect(decodeURIComponent(url)).toContain('```json')
    expect(decodeURIComponent(url)).toContain('نص كيلو جبنة')
  })
})
