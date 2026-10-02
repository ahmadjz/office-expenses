import type { Entry, Payment } from '../src/lib/schema'

export type ImportRow =
  | { collection: 'expenses'; legacyId: string; createdAt: string; body: { date: string; payer: string; item: string; amount: number; sharers: string[]; createdBy: string } }
  | { collection: 'payments'; legacyId: string; createdAt: string; body: { date: string; from: string; to: string; amount: number; createdBy: string } }

export function buildImportPlan(
  entries: readonly Entry[],
  payments: readonly Payment[],
  memberIdByUsername: ReadonlyMap<string, string>,
  createdByUsername: string,
): ImportRow[] {
  const memberId = (username: string): string => {
    const id = memberIdByUsername.get(username)
    if (id === undefined) throw new Error(`لا يوجد عضو باسم المستخدم ${username}`)
    return id
  }
  const createdBy = memberId(createdByUsername)

  const expenseRows = entries.map((entry): ImportRow => ({
    collection: 'expenses',
    legacyId: entry.id,
    createdAt: entry.createdAt,
    body: { date: entry.date, payer: memberId(entry.payer), item: entry.item, amount: entry.amount, sharers: entry.sharers.map(memberId), createdBy },
  }))
  const paymentRows = payments.map((payment): ImportRow => ({
    collection: 'payments',
    legacyId: payment.id,
    createdAt: payment.createdAt,
    body: { date: payment.date, from: memberId(payment.from), to: memberId(payment.to), amount: payment.amount, createdBy },
  }))

  return [...expenseRows, ...paymentRows].toSorted((first, second) => first.createdAt.localeCompare(second.createdAt))
}
