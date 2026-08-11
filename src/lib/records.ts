import type { ZodType } from 'zod'

type LedgerRecord = { date: string; createdAt: string }

export function parseRecords<T extends LedgerRecord>(modules: Record<string, unknown>, schema: ZodType<T>): T[] {
  return Object.entries(modules)
    .map(([path, value]) => {
      const result = schema.safeParse(value)
      if (!result.success) throw new Error(`بيانات غير صالحة في ${path}: ${result.error.message}`)
      return result.data
    })
    .toSorted((first, second) => second.date.localeCompare(first.date) || second.createdAt.localeCompare(first.createdAt))
}
