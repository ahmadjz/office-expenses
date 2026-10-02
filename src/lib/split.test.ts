import { describe, expect, it } from 'vitest'
import { splitAmount } from './split'

const allMembers = ['ahmad', 'abu-obaida', 'kasem', 'abu-khaled', 'abu-tareq', 'abu-adnan', 'abu-mohsen']
const order = new Map(allMembers.map((id, index) => [id, index + 1]))

describe('splitAmount', () => {
  it('always assigns the entire amount for awkward amounts and every group size', () => {
    for (const amount of [1, 2, 7, 11, 60, 100, 101, 999_999]) {
      for (let count = 1; count <= allMembers.length; count += 1) {
        const shares = splitAmount(amount, allMembers.slice(0, count), order)
        expect([...shares.values()].reduce((total, share) => total + share, 0)).toBe(amount)
      }
    }
  })

  it('uses member position rather than selection order for remainders', () => {
    const shares = splitAmount(100, ['abu-adnan', 'kasem', 'ahmad'], order)
    expect(Object.fromEntries(shares)).toEqual({ ahmad: 34, kasem: 33, 'abu-adnan': 33 })
  })

  it('splits the canonical cheese example equally', () => {
    expect(Object.fromEntries(splitAmount(100, ['ahmad', 'abu-obaida', 'kasem', 'abu-adnan'], order))).toEqual({
      ahmad: 25, 'abu-obaida': 25, kasem: 25, 'abu-adnan': 25,
    })
  })

  it('keeps the same split when a member between the sharers is deactivated and leaves a position gap', () => {
    const withGap = new Map([['ahmad', 1], ['kasem', 3], ['abu-adnan', 6], ['abu-sami', 8]])
    expect(Object.fromEntries(splitAmount(101, ['abu-sami', 'abu-adnan', 'kasem', 'ahmad'], withGap))).toEqual({
      ahmad: 26, kasem: 25, 'abu-adnan': 25, 'abu-sami': 25,
    })
  })
})
