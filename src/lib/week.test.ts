import { describe, expect, it } from 'vitest'
import { getWeekStart } from './week'

describe('getWeekStart', () => {
  it('uses Saturday as the week boundary', () => {
    expect(getWeekStart('2026-08-01')).toBe('2026-08-01')
    expect(getWeekStart('2026-08-07')).toBe('2026-08-01')
  })

  it('crosses month and year boundaries correctly', () => {
    expect(getWeekStart('2026-08-01')).toBe('2026-08-01')
    expect(getWeekStart('2027-01-01')).toBe('2026-12-26')
  })
})
