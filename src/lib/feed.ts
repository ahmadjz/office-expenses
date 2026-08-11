import type { Entry, Payment } from './schema'
import { getWeekStart } from './week'

export type FeedItem = { kind: 'expense'; entry: Entry } | { kind: 'payment'; payment: Payment }
export type FeedWeek = { weekStart: string; entries: Entry[]; payments: Payment[]; items: FeedItem[] }

function itemDate(item: FeedItem): string {
  return item.kind === 'expense' ? item.entry.date : item.payment.date
}

function itemCreatedAt(item: FeedItem): string {
  return item.kind === 'expense' ? item.entry.createdAt : item.payment.createdAt
}

function mergeItems(entries: readonly Entry[], payments: readonly Payment[]): FeedItem[] {
  return [
    ...entries.map((entry): FeedItem => ({ kind: 'expense', entry })),
    ...payments.map((payment): FeedItem => ({ kind: 'payment', payment })),
  ].toSorted((first, second) => itemDate(second).localeCompare(itemDate(first)) || itemCreatedAt(second).localeCompare(itemCreatedAt(first)))
}

export function groupByWeek(entries: readonly Entry[], payments: readonly Payment[]): FeedWeek[] {
  const weekStarts = new Set([...entries, ...payments].map((record) => getWeekStart(record.date)))
  return [...weekStarts]
    .toSorted((first, second) => second.localeCompare(first))
    .map((weekStart) => {
      const weekEntries = entries.filter((entry) => getWeekStart(entry.date) === weekStart)
      const weekPayments = payments.filter((payment) => getWeekStart(payment.date) === weekStart)
      return { weekStart, entries: weekEntries, payments: weekPayments, items: mergeItems(weekEntries, weekPayments) }
    })
}
