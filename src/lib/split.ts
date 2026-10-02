import type { MemberId } from './schema'

export type MemberOrder = ReadonlyMap<MemberId, number>

export function byPosition(order: MemberOrder) {
  return (first: MemberId, second: MemberId): number =>
    (order.get(first) ?? Number.MAX_SAFE_INTEGER) - (order.get(second) ?? Number.MAX_SAFE_INTEGER) || first.localeCompare(second)
}

export function splitAmount(amount: number, sharers: readonly MemberId[], order: MemberOrder): Map<MemberId, number> {
  const baseShare = Math.floor(amount / sharers.length)
  const remainder = amount - baseShare * sharers.length
  const orderedSharers = [...new Set(sharers)].toSorted(byPosition(order))
  return new Map(orderedSharers.map((id, index) => [id, baseShare + (index < remainder ? 1 : 0)]))
}
