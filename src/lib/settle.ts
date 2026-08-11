import { MEMBERS, type MemberId } from '../data/members'
import type { MemberSummary } from './summary'

export type Transfer = { from: MemberId; to: MemberId; amount: number }

type Balance = { id: MemberId; remaining: number }

const canonicalIndex = (id: MemberId) => MEMBERS.findIndex((member) => member.id === id)

function largestFirst(first: Balance, second: Balance): number {
  return second.remaining - first.remaining || canonicalIndex(first.id) - canonicalIndex(second.id)
}

function balances(summaries: readonly MemberSummary[], sign: 1 | -1): Balance[] {
  return summaries
    .filter((summary) => summary.net * sign > 0)
    .map((summary) => ({ id: summary.id, remaining: summary.net * sign }))
    .toSorted(largestFirst)
}

export function suggestSettlements(summaries: readonly MemberSummary[]): Transfer[] {
  const debtors = balances(summaries, -1)
  const creditors = balances(summaries, 1)
  const transfers: Transfer[] = []
  let debtorIndex = 0
  let creditorIndex = 0
  let debtorLeft = debtors[0]?.remaining ?? 0
  let creditorLeft = creditors[0]?.remaining ?? 0
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const amount = Math.min(debtorLeft, creditorLeft)
    transfers.push({ from: debtors[debtorIndex].id, to: creditors[creditorIndex].id, amount })
    debtorLeft -= amount
    creditorLeft -= amount
    if (debtorLeft === 0) {
      debtorIndex += 1
      debtorLeft = debtors[debtorIndex]?.remaining ?? 0
    }
    if (creditorLeft === 0) {
      creditorIndex += 1
      creditorLeft = creditors[creditorIndex]?.remaining ?? 0
    }
  }
  return transfers
}
