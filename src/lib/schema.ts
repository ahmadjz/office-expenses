import { z } from 'zod'
import { isCalendarDate, isNoMoreThanTomorrow } from './dates'

const DISTINCT_MEMBERS_MESSAGE = 'لا يمكن أن يكون الدافع والمستلم الشخص نفسه'

const idSchema = z.string().min(1)
const dateSchema = z.string().refine(isCalendarDate, 'التاريخ غير صالح').refine(isNoMoreThanTomorrow, 'لا يمكن أن يكون التاريخ أبعد من الغد')
const recordDateSchema = z.string().refine(isCalendarDate)
const amountSchema = z.number().int('المبلغ يجب أن يكون رقمًا صحيحًا').positive('المبلغ يجب أن يكون أكبر من صفر').max(100_000_000, 'المبلغ كبير جدًا')
const itemSchema = z.string().trim().min(1, 'اكتب ما تم شراؤه').max(80, 'الحد الأقصى 80 حرفًا')
const sharersSchema = z.array(idSchema).min(1, 'اختر شخصًا واحدًا على الأقل').refine(
  (members) => new Set(members).size === members.length,
  'لا يمكن تكرار الأسماء',
)

export const memberSchema = z.object({
  id: idSchema,
  username: z.string(),
  name: z.string(),
  position: z.number().int().positive(),
  active: z.boolean(),
  isAdmin: z.boolean(),
})

export const expenseSchema = z.object({
  id: idSchema,
  date: recordDateSchema,
  payer: idSchema,
  item: z.string().min(1),
  amount: amountSchema,
  sharers: sharersSchema,
  createdBy: idSchema,
  created: z.string(),
})

const paymentFields = z.object({
  id: idSchema,
  date: recordDateSchema,
  from: idSchema,
  to: idSchema,
  amount: amountSchema,
  createdBy: idSchema,
  created: z.string(),
})

export const paymentSchema = paymentFields.refine((payment) => payment.from !== payment.to)

export const expenseInputSchema = z.object({
  date: dateSchema,
  payer: idSchema.or(z.literal('')).refine((id) => id !== '', 'اختر من دفع'),
  item: itemSchema,
  amount: amountSchema,
  sharers: sharersSchema,
})

export const paymentInputSchema = z.object({
  date: dateSchema,
  from: idSchema.or(z.literal('')).refine((id) => id !== '', 'اختر من دفع'),
  to: idSchema.or(z.literal('')).refine((id) => id !== '', 'اختر المستلم'),
  amount: amountSchema,
}).refine((payment) => payment.from !== payment.to, { message: DISTINCT_MEMBERS_MESSAGE, path: ['to'] })

const passwordSchema = z.string().min(8, 'كلمة المرور 8 أحرف على الأقل').max(72, 'كلمة المرور طويلة جدًا')
const memberNameSchema = z.string().trim().min(1, 'اكتب الاسم').max(40, 'الحد الأقصى 40 حرفًا')

export const newMemberInputSchema = z.object({
  name: memberNameSchema,
  username: z.string().trim().regex(/^[a-z0-9-]{2,30}$/, 'أحرف إنجليزية صغيرة وأرقام وشرطة فقط، من 2 إلى 30'),
  password: passwordSchema,
})

export const renameMemberInputSchema = z.object({ name: memberNameSchema })
export const passwordInputSchema = z.object({ password: passwordSchema })

export type MemberId = string
export type Member = z.infer<typeof memberSchema>
export type Expense = z.infer<typeof expenseSchema>
export type Payment = z.infer<typeof paymentSchema>
export type ExpenseInput = z.infer<typeof expenseInputSchema>
export type PaymentInput = z.infer<typeof paymentInputSchema>
export type NewMemberInput = z.infer<typeof newMemberInputSchema>
