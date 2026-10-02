import { describe, expect, it } from 'vitest'
import { buildImportPlan } from './import-plan'
import type { LegacyEntry, LegacyPayment } from './legacy-schema'

const ids = new Map([
  ['ahmad', 'pb_ahmad'],
  ['abu-obaida', 'pb_obaida'],
  ['kasem', 'pb_kasem'],
  ['abu-adnan', 'pb_adnan'],
])

const entry: LegacyEntry = {
  id: '2026-08-03-a3f9c1', date: '2026-08-03', payer: 'ahmad', item: 'نص كيلو جبنة', amount: 100,
  sharers: ['ahmad', 'abu-obaida', 'kasem', 'abu-adnan'], createdAt: '2026-08-03T09:12:00.000Z', issue: 12,
}

const payment: LegacyPayment = {
  id: '2026-08-02-b71d20', date: '2026-08-05', from: 'abu-obaida', to: 'ahmad', amount: 25,
  createdAt: '2026-08-05T10:00:00.000Z', issue: 17,
}

const earlierEntry: LegacyEntry = { ...entry, id: '2026-08-01-000001', createdAt: '2026-08-01T08:00:00.000Z' }

describe('buildImportPlan', () => {
  it('maps every legacy slug to its member id and attributes rows to the importer', () => {
    const [row] = buildImportPlan([entry], [], ids, 'ahmad')
    expect(row.body).toEqual({
      date: '2026-08-03', payer: 'pb_ahmad', item: 'نص كيلو جبنة', amount: 100,
      sharers: ['pb_ahmad', 'pb_obaida', 'pb_kasem', 'pb_adnan'], createdBy: 'pb_ahmad',
    })
  })

  it('keeps one row per legacy record, ordered by legacy createdAt across both kinds', () => {
    const plan = buildImportPlan([entry, earlierEntry], [payment], ids, 'ahmad')
    expect(plan.map((row) => row.legacyId)).toEqual(['2026-08-01-000001', '2026-08-03-a3f9c1', '2026-08-02-b71d20'])
  })

  it('refuses a slug with no matching member', () => {
    expect(() => buildImportPlan([{ ...entry, sharers: ['abu-tareq'] }], [], ids, 'ahmad')).toThrow('abu-tareq')
  })
})
