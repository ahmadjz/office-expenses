import type { MemberId } from './schema'
import { byPosition, type MemberOrder } from './split'
import type { MemberSummary } from './summary'

export type Transfer = { from: MemberId; to: MemberId; amount: number }

type Balance = { id: MemberId; remaining: number }

function balances(summaries: readonly MemberSummary[], sign: 1 | -1, order: MemberOrder): Balance[] {
  const compareIds = byPosition(order)
  return summaries
    .filter((summary) => summary.net * sign > 0)
    .map((summary) => ({ id: summary.id, remaining: summary.net * sign }))
    .toSorted((first, second) => second.remaining - first.remaining || compareIds(first.id, second.id))
}

export function suggestSettlements(summaries: readonly MemberSummary[], order: MemberOrder): Transfer[] {
  const debtors = balances(summaries, -1, order)
  const creditors = balances(summaries, 1, order)
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
