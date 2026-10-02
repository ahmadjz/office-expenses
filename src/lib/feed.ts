import type { Expense, Payment } from './schema'
import type { MemberOrder } from './split'
import { summarizeWeek, type MemberSummary } from './summary'
import { getWeekStart } from './week'

export type FeedItem = { kind: 'expense'; expense: Expense } | { kind: 'payment'; payment: Payment }
export type FeedWeek = { weekStart: string; expenses: Expense[]; payments: Payment[]; items: FeedItem[]; summary: MemberSummary[] }

function record(item: FeedItem): Expense | Payment {
  return item.kind === 'expense' ? item.expense : item.payment
}

function mergeItems(expenses: readonly Expense[], payments: readonly Payment[]): FeedItem[] {
  return [
    ...expenses.map((expense): FeedItem => ({ kind: 'expense', expense })),
    ...payments.map((payment): FeedItem => ({ kind: 'payment', payment })),
  ].toSorted((first, second) => record(second).date.localeCompare(record(first).date) || record(second).created.localeCompare(record(first).created))
}

export function groupByWeek(expenses: readonly Expense[], payments: readonly Payment[], order: MemberOrder): FeedWeek[] {
  const weekStarts = new Set([...expenses, ...payments].map((item) => getWeekStart(item.date)))
  return [...weekStarts]
    .toSorted((first, second) => second.localeCompare(first))
    .map((weekStart) => {
      const weekExpenses = expenses.filter((expense) => getWeekStart(expense.date) === weekStart)
      const weekPayments = payments.filter((payment) => getWeekStart(payment.date) === weekStart)
      return {
        weekStart,
        expenses: weekExpenses,
        payments: weekPayments,
        items: mergeItems(weekExpenses, weekPayments),
        summary: summarizeWeek(weekExpenses, weekPayments, order),
      }
    })
}
