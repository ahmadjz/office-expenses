import { z } from 'zod'
import { MEMBER_IDS, type MemberId } from '../data/members'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const ID_PATTERN = /^\d{4}-\d{2}-\d{2}-[a-f0-9]{6}$/
const DISTINCT_MEMBERS_MESSAGE = 'لا يمكن أن يكون الدافع والمستلم الشخص نفسه'

function isCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T12:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function isNoMoreThanTomorrow(value: string): boolean {
  const tomorrow = new Date()
  tomorrow.setUTCHours(0, 0, 0, 0)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return value <= tomorrow.toISOString().slice(0, 10)
}

function hasDistinctMembers(payment: { from: MemberId; to: MemberId }): boolean {
  return payment.from !== payment.to
}

export const memberIdSchema = z.enum(MEMBER_IDS)

const dateSchema = z.string().refine(isCalendarDate, 'التاريخ غير صالح').refine(isNoMoreThanTomorrow, 'لا يمكن أن يكون التاريخ أبعد من الغد')
const amountSchema = z.number().int('المبلغ يجب أن يكون رقمًا صحيحًا').positive('المبلغ يجب أن يكون أكبر من صفر').max(100_000_000, 'المبلغ كبير جدًا')

const recordFields = {
  id: z.string().regex(ID_PATTERN, 'معرّف الإدخال غير صالح'),
  createdAt: z.string().datetime({ offset: true }),
  issue: z.number().int().positive(),
}

export const entryInputSchema = z.object({
  date: dateSchema,
  payer: memberIdSchema,
  item: z.string().trim().min(1, 'اكتب ما تم شراؤه').max(80, 'الحد الأقصى 80 حرفًا'),
  amount: amountSchema,
  sharers: z.array(memberIdSchema).min(1, 'اختر شخصًا واحدًا على الأقل').max(7).refine(
    (members) => new Set(members).size === members.length,
    'لا يمكن تكرار الأسماء',
  ),
}).strict()

export const entrySchema = entryInputSchema.extend(recordFields).strict()

const paymentFields = z.object({
  date: dateSchema,
  from: memberIdSchema,
  to: memberIdSchema,
  amount: amountSchema,
}).strict()

export const paymentInputSchema = paymentFields.refine(hasDistinctMembers, { message: DISTINCT_MEMBERS_MESSAGE, path: ['to'] })

export const paymentSchema = paymentFields.extend(recordFields).strict().refine(hasDistinctMembers, { message: DISTINCT_MEMBERS_MESSAGE, path: ['to'] })

export type EntryInput = z.infer<typeof entryInputSchema>
export type Entry = z.infer<typeof entrySchema>
export type PaymentInput = z.infer<typeof paymentInputSchema>
export type Payment = z.infer<typeof paymentSchema>
