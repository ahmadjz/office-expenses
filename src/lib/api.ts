import PocketBase, { BaseAuthStore, ClientResponseError, type RecordModel } from 'pocketbase'
import { z, type ZodType } from 'zod'
import { pb } from './pb'
import {
  expenseSchema,
  memberSchema,
  paymentSchema,
  type Expense,
  type ExpenseInput,
  type Member,
  type MemberId,
  type NewMemberInput,
  type Payment,
  type PaymentInput,
} from './schema'

export type Ledger = { members: Member[]; expenses: Expense[]; payments: Payment[]; invalidCount: number }

const LEDGER_COLLECTIONS = ['members', 'expenses', 'payments'] as const

export function parseRecords<T>(records: readonly RecordModel[], schema: ZodType<T>): { valid: T[]; invalidCount: number } {
  const valid: T[] = []
  let invalidCount = 0
  for (const record of records) {
    const result = schema.safeParse(record)
    if (result.success) {
      valid.push(result.data)
    } else {
      invalidCount += 1
      console.error(`سجل غير صالح ${record.collectionName}/${record.id}`, result.error.issues)
    }
  }
  return { valid, invalidCount }
}

export async function fetchLedger(): Promise<Ledger> {
  const [memberRecords, expenseRecords, paymentRecords] = await Promise.all(
    LEDGER_COLLECTIONS.map((collection) => pb.collection(collection).getFullList({ sort: collection === 'members' ? 'position' : '-date,-created' })),
  )
  const expenses = parseRecords(expenseRecords, expenseSchema)
  const payments = parseRecords(paymentRecords, paymentSchema)
  return {
    members: z.array(memberSchema).parse(memberRecords),
    expenses: expenses.valid,
    payments: payments.valid,
    invalidCount: expenses.invalidCount + payments.invalidCount,
  }
}

export function subscribeToLedger(onChange: () => void): () => void {
  const unsubscribes = [
    ...LEDGER_COLLECTIONS.map((collection) => pb.collection(collection).subscribe('*', onChange)),
    pb.realtime.subscribe('PB_CONNECT', onChange),
  ]
  return () => {
    for (const unsubscribe of unsubscribes) void unsubscribe.then((stop) => stop()).catch(() => undefined)
  }
}

export async function login(username: string, password: string): Promise<void> {
  await pb.collection('members').authWithPassword(username.trim().toLowerCase(), password)
}

const AUTH_REJECTED = new Set([401, 403, 404])

export async function refreshSession(): Promise<void> {
  const { token, record } = pb.authStore
  if (!token) return
  if (!pb.authStore.isValid) {
    pb.authStore.clear()
    return
  }
  const probe = new PocketBase(pb.baseURL, new BaseAuthStore())
  probe.autoCancellation(false)
  probe.authStore.save(token, record)
  try {
    await probe.collection('members').authRefresh()
    if (pb.authStore.token === token) pb.authStore.save(probe.authStore.token, probe.authStore.record)
  } catch (error) {
    if (pb.authStore.token === token && error instanceof ClientResponseError && AUTH_REJECTED.has(error.status)) pb.authStore.clear()
  }
}

export function logout(): void {
  pb.authStore.clear()
}

export function currentMemberId(): MemberId | null {
  return pb.authStore.record?.id ?? null
}

export async function saveExpense(input: ExpenseInput, id?: string): Promise<void> {
  const expenses = pb.collection('expenses')
  if (id) await expenses.update(id, input)
  else await expenses.create({ ...input, createdBy: currentMemberId() })
}

export async function savePayment(input: PaymentInput, id?: string): Promise<void> {
  const payments = pb.collection('payments')
  if (id) await payments.update(id, input)
  else await payments.create({ ...input, createdBy: currentMemberId() })
}

export async function deleteRecord(collection: 'expenses' | 'payments', id: string): Promise<void> {
  await pb.collection(collection).delete(id)
}

export async function createMember(input: NewMemberInput): Promise<void> {
  await pb.collection('members').create({ ...input, passwordConfirm: input.password })
}

export async function updateMember(id: MemberId, change: { name: string } | { active: boolean }): Promise<void> {
  await pb.collection('members').update(id, change)
}

export async function resetPassword(id: MemberId, password: string): Promise<void> {
  await pb.collection('members').update(id, { password, passwordConfirm: password })
}

export function errorMessage(error: unknown): string {
  if (error instanceof ClientResponseError) {
    if (error.status === 0) return 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مجددًا.'
    if (error.status === 404 || error.status === 403) return 'ليست لديك صلاحية لهذا الإجراء.'
    const fieldErrors = Object.values(error.response?.data ?? {}) as { code?: string }[]
    if (fieldErrors.some((field) => field.code === 'validation_not_unique')) return 'اسم المستخدم مستخدم من قبل.'
    if (typeof error.response?.message === 'string' && /[؀-ۿ]/.test(error.response.message)) return error.response.message
  }
  return 'حدث خطأ غير متوقع. حاول مجددًا.'
}
