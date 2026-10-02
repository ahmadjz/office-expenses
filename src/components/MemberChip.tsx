import { focusRing } from './ui'

type MemberChipProps = { name: string; isSelected: boolean; isInactive?: boolean; onClick: () => void }

export function MemberChip({ name, isSelected, isInactive = false, onClick }: MemberChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`min-h-11 rounded-full border px-4 text-base font-medium transition-colors ${focusRing} ${isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)]'}`}
    >
      {name}
      {isInactive && <span className="ms-1 text-sm opacity-75">(معطّل)</span>}
    </button>
  )
}
