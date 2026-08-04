import { describe, expect, it } from 'vitest'
import { parseIssueBody } from './issue-parser'

describe('parseIssueBody', () => {
  it('extracts and validates a fenced JSON payload', () => {
    const result = parseIssueBody('تفاصيل\n```json\n{"date":"2026-08-03","payer":"ahmad","item":"جبنة","amount":100,"sharers":["ahmad"]}\n```')
    expect(result).toMatchObject({ ok: true, data: { amount: 100, payer: 'ahmad' } })
  })

  it('rejects malformed content without throwing', () => {
    expect(parseIssueBody('```json\n{bad}\n```')).toEqual({ ok: false, error: 'كتلة JSON غير صالحة.' })
    expect(parseIssueBody('no block')).toMatchObject({ ok: false })
  })
})
