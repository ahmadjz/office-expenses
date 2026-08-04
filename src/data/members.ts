export const MEMBERS = [
  { id: 'ahmad', name: 'أحمد' },
  { id: 'abu-obaida', name: 'أبو عبيدة' },
  { id: 'kasem', name: 'كاسم' },
  { id: 'abu-khaled', name: 'أبو خالد' },
  { id: 'abu-tareq', name: 'أبو طارق' },
  { id: 'abu-adnan', name: 'أبو عدنان' },
  { id: 'abu-mohsen', name: 'أبو محسن' },
] as const

export type MemberId = (typeof MEMBERS)[number]['id']

export const MEMBER_IDS = MEMBERS.map(({ id }) => id) as [MemberId, ...MemberId[]]
export const memberName = (id: MemberId) => MEMBERS.find((member) => member.id === id)?.name ?? id
