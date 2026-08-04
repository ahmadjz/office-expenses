import { MEMBERS, type MemberId } from '../data/members'
import type { Entry } from './schema'
import { splitAmount } from './split'

export type MemberSummary = { id: MemberId; paid: number; owed: number; net: number }

export function summarizeWeek(entries: readonly Entry[]): MemberSummary[] {
  const totals = new Map<MemberId, { paid: number; owed: number }>()
  for (const entry of entries) {
    const payerTotals = totals.get(entry.payer) ?? { paid: 0, owed: 0 }
    totals.set(entry.payer, { ...payerTotals, paid: payerTotals.paid + entry.amount })
    for (const [memberId, share] of splitAmount(entry.amount, entry.sharers)) {
      const memberTotals = totals.get(memberId) ?? { paid: 0, owed: 0 }
      totals.set(memberId, { ...memberTotals, owed: memberTotals.owed + share })
    }
  }
  return MEMBERS.flatMap(({ id }) => {
    const total = totals.get(id)
    return total ? [{ id, ...total, net: total.paid - total.owed }] : []
  })
}
