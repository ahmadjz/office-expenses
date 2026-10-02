import { z } from 'zod'

const slug = z.string().regex(/^[a-z-]+$/)
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const amount = z.number().int().positive().max(100_000_000)
const recordFields = { id: z.string(), createdAt: z.string().datetime({ offset: true }), issue: z.number().int().positive() }

export const legacyEntrySchema = z.object({
  date,
  payer: slug,
  item: z.string().trim().min(1).max(80),
  amount,
  sharers: z.array(slug).min(1),
  ...recordFields,
}).strict()

export const legacyPaymentSchema = z.object({
  date,
  from: slug,
  to: slug,
  amount,
  ...recordFields,
}).strict()

export type LegacyEntry = z.infer<typeof legacyEntrySchema>
export type LegacyPayment = z.infer<typeof legacyPaymentSchema>
