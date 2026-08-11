export const numberFormatter = new Intl.NumberFormat('ar-u-nu-latn')
export const dateFormatter = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' })

export function formatNumber(amount: number): string {
  return numberFormatter.format(amount)
}

export function formatAmount(amount: number): string {
  return `${numberFormatter.format(amount)} ل.س`
}

export function formatSigned(amount: number): string {
  return `${amount < 0 ? '−' : '+'}${numberFormatter.format(Math.abs(amount))}`
}

export function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T12:00:00Z`))
}
