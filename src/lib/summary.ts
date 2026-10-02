import type { Expense, MemberId, Payment } from './schema'
import { byPosition, splitAmount, type MemberOrder } from './split'

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

export function summarizeWeek(expenses: readonly Expense[], payments: readonly Payment[], order: MemberOrder): MemberSummary[] {
  const totals = new Map<MemberId, Totals>()
  for (const expense of expenses) {
    accumulate(totals, expense.payer, { paid: expense.amount })
    for (const [memberId, share] of splitAmount(expense.amount, expense.sharers, order)) {
      accumulate(totals, memberId, { owed: share })
    }
  }
  for (const payment of payments) {
    accumulate(totals, payment.from, { settled: payment.amount })
    accumulate(totals, payment.to, { settled: -payment.amount })
  }
  return [...totals.keys()]
    .toSorted(byPosition(order))
    .map((id) => {
      const total = totals.get(id) ?? NO_TOTALS
      return { id, ...total, net: total.paid - total.owed + total.settled }
    })
}

export function isSettled(summary: readonly MemberSummary[]): boolean {
  return summary.every((member) => member.net === 0)
}
