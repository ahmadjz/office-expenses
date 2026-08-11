import { MEMBERS, type MemberId } from '../data/members'
import type { Entry, Payment } from './schema'
import { splitAmount } from './split'

export type MemberSummary = { id: MemberId; paid: number; owed: number; settled: number; net: number }

type Totals = { paid: number; owed: number; settled: number }

const NO_TOTALS: Totals = { paid: 0, owed: 0, settled: 0 }

function accumulate(totals: Map<MemberId, Totals>, id: MemberId, change: Partial<Totals>): void {
  const current = totals.get(id) ?? NO_TOTALS
  totals.set(id, {
    paid: current.paid + (change.paid ?? 0),
    owed: current.owed + (change.owed ?? 0),
    settled: current.settled + (change.settled ?? 0),
  })
}

export function summarizeWeek(entries: readonly Entry[], payments: readonly Payment[]): MemberSummary[] {
  const totals = new Map<MemberId, Totals>()
  for (const entry of entries) {
    accumulate(totals, entry.payer, { paid: entry.amount })
    for (const [memberId, share] of splitAmount(entry.amount, entry.sharers)) {
      accumulate(totals, memberId, { owed: share })
    }
  }
  for (const payment of payments) {
    accumulate(totals, payment.from, { settled: payment.amount })
    accumulate(totals, payment.to, { settled: -payment.amount })
  }
  return MEMBERS.flatMap(({ id }) => {
    const total = totals.get(id)
    return total ? [{ id, ...total, net: total.paid - total.owed + total.settled }] : []
  })
}
