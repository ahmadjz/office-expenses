import { MEMBERS, type MemberId } from '../data/members'

export function splitAmount(amount: number, sharers: readonly MemberId[]): Map<MemberId, number> {
  const baseShare = Math.floor(amount / sharers.length)
  const remainder = amount - baseShare * sharers.length
  const selectedIds = new Set(sharers)
  const orderedSharers = MEMBERS.filter((member) => selectedIds.has(member.id)).map(({ id }) => id)
  return new Map(orderedSharers.map((id, index) => [id, baseShare + (index < remainder ? 1 : 0)]))
}
