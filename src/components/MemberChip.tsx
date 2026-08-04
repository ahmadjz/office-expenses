import type { MemberId } from '../data/members'

type MemberChipProps = {
  id: MemberId
  name: string
  isSelected: boolean
  onClick: () => void
  type?: 'button' | 'submit'
}

export function MemberChip({ id, name, isSelected, onClick, type = 'button' }: MemberChipProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-pressed={isSelected}
      className={`min-h-11 rounded-full border px-4 text-base font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]'}`}
      data-member={id}
    >
      {name}
    </button>
  )
}
