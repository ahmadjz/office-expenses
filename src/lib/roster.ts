import type { Member, MemberId } from './schema'
import type { MemberOrder } from './split'

export type Roster = {
  members: readonly Member[]
  active: readonly Member[]
  order: MemberOrder
  name: (id: MemberId) => string
}

export function buildRoster(members: readonly Member[]): Roster {
  const sorted = members.toSorted((first, second) => first.position - second.position)
  const byId = new Map(sorted.map((member) => [member.id, member]))
  return {
    members: sorted,
    active: sorted.filter((member) => member.active),
    order: new Map(sorted.map((member) => [member.id, member.position])),
    name: (id) => byId.get(id)?.name ?? 'عضو محذوف',
  }
}

export function selectableMembers(roster: Roster, alreadyOnRecord: readonly MemberId[]): Member[] {
  return roster.members.filter((member) => member.active || alreadyOnRecord.includes(member.id))
}
