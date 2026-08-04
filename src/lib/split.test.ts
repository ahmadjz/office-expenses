import { describe, expect, it } from 'vitest'
import { splitAmount } from './split'
import type { MemberId } from '../data/members'

const allMembers: MemberId[] = ['ahmad', 'abu-obaida', 'kasem', 'abu-khaled', 'abu-tareq', 'abu-adnan', 'abu-mohsen']

describe('splitAmount', () => {
  it('always assigns the entire amount for awkward amounts and every group size', () => {
    for (const amount of [1, 2, 7, 11, 60, 100, 101, 999_999]) {
      for (let count = 1; count <= allMembers.length; count += 1) {
        const shares = splitAmount(amount, allMembers.slice(0, count))
        expect([...shares.values()].reduce((total, share) => total + share, 0)).toBe(amount)
      }
    }
  })

  it('uses canonical member order rather than selection order for remainders', () => {
    const shares = splitAmount(100, ['abu-adnan', 'kasem', 'ahmad'])
    expect(Object.fromEntries(shares)).toEqual({ ahmad: 34, kasem: 33, 'abu-adnan': 33 })
  })

  it('splits the canonical cheese example equally', () => {
    expect(Object.fromEntries(splitAmount(100, ['ahmad', 'abu-obaida', 'kasem', 'abu-adnan']))).toEqual({
      ahmad: 25, 'abu-obaida': 25, kasem: 25, 'abu-adnan': 25,
    })
  })
})
