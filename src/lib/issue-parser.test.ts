import { describe, expect, it } from 'vitest'
import { parseIssueBody } from './issue-parser'

const block = (payload: string) => `تفاصيل\n\`\`\`json\n${payload}\n\`\`\``

describe('parseIssueBody', () => {
  it('extracts and validates a fenced JSON payload', () => {
    const result = parseIssueBody(block('{"date":"2026-08-03","payer":"ahmad","item":"جبنة","amount":100,"sharers":["ahmad"]}'))
    expect(result).toMatchObject({ ok: true, kind: 'expense', data: { amount: 100, payer: 'ahmad' } })
  })

  it('accepts an explicit expense kind', () => {
    const result = parseIssueBody(block('{"kind":"expense","date":"2026-08-03","payer":"ahmad","item":"جبنة","amount":100,"sharers":["ahmad"]}'))
    expect(result).toMatchObject({ ok: true, kind: 'expense', data: { item: 'جبنة' } })
  })

  it('parses a payment payload', () => {
    const result = parseIssueBody(block('{"kind":"payment","date":"2026-08-05","from":"kasem","to":"ahmad","amount":25}'))
    expect(result).toEqual({ ok: true, kind: 'payment', data: { date: '2026-08-05', from: 'kasem', to: 'ahmad', amount: 25 } })
  })

  it('rejects a payment to the same member', () => {
    expect(parseIssueBody(block('{"kind":"payment","date":"2026-08-05","from":"kasem","to":"kasem","amount":25}'))).toMatchObject({ ok: false })
  })

  it('rejects an expense payload sent as a payment', () => {
    expect(parseIssueBody(block('{"kind":"payment","date":"2026-08-05","payer":"kasem","item":"جبنة","amount":25,"sharers":["kasem"]}'))).toMatchObject({ ok: false })
  })

  it('rejects an unknown kind', () => {
    expect(parseIssueBody(block('{"kind":"refund","date":"2026-08-05","from":"kasem","to":"ahmad","amount":25}'))).toMatchObject({ ok: false })
  })

  it('rejects malformed content without throwing', () => {
    expect(parseIssueBody('```json\n{bad}\n```')).toEqual({ ok: false, error: 'كتلة JSON غير صالحة.' })
    expect(parseIssueBody('no block')).toMatchObject({ ok: false })
  })
})
