export const numberFormatter = new Intl.NumberFormat('ar-u-nu-latn')
export const dateFormatter = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'long' })

export function formatAmount(amount: number): string {
  return `${numberFormatter.format(amount)} ل.س`
}

export function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T12:00:00Z`))
}
