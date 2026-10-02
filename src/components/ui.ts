export const focusRing = 'focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]'

export const inputClass = 'mt-2 min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]'

export const primaryButtonClass = `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 text-base font-bold text-[var(--color-on-primary)] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`

export const secondaryButtonClass = `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base font-bold text-[var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`

export const destructiveButtonClass = `inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-negative)] px-4 text-base font-bold text-[var(--color-on-primary)] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`

export const iconButtonClass = `grid min-h-11 min-w-11 place-items-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-foreground)] ${focusRing}`

export const errorTextClass = 'text-sm text-[var(--color-negative)]'
