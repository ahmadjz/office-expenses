import type { z } from 'zod'
import { entryInputSchema, paymentInputSchema, type EntryInput, type PaymentInput } from './schema'

type ParseSuccess =
  | { ok: true; kind: 'expense'; data: EntryInput }
  | { ok: true; kind: 'payment'; data: PaymentInput }
type ParseFailure = { ok: false; error: string }
export type IssueParseResult = ParseSuccess | ParseFailure

const JSON_BLOCK_PATTERN = /```json\s*([\s\S]*?)\s*```/i
const KINDS = ['expense', 'payment'] as const

type PayloadKind = (typeof KINDS)[number]

function isPlainObject(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload)
}

function readKind(payload: unknown): PayloadKind | null {
  if (!isPlainObject(payload) || !('kind' in payload)) return 'expense'
  return KINDS.find((kind) => kind === payload.kind) ?? null
}

function withoutKind(payload: unknown): unknown {
  if (!isPlainObject(payload)) return payload
  return Object.fromEntries(Object.entries(payload).filter(([key]) => key !== 'kind'))
}

function describe(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('؛ ')
}

export function parseIssueBody(body: unknown): IssueParseResult {
  if (typeof body !== 'string') return { ok: false, error: 'نص الطلب مفقود.' }
  const block = body.match(JSON_BLOCK_PATTERN)?.[1]
  if (!block) return { ok: false, error: 'لم يتم العثور على كتلة JSON في الطلب.' }
  let payload: unknown
  try {
    payload = JSON.parse(block)
  } catch {
    return { ok: false, error: 'كتلة JSON غير صالحة.' }
  }
  const kind = readKind(payload)
  if (!kind) return { ok: false, error: 'نوع الإدخال غير معروف. استخدم expense أو payment.' }
  const fields = withoutKind(payload)
  if (kind === 'payment') {
    const result = paymentInputSchema.safeParse(fields)
    return result.success ? { ok: true, kind, data: result.data } : { ok: false, error: describe(result.error) }
  }
  const result = entryInputSchema.safeParse(fields)
  return result.success ? { ok: true, kind, data: result.data } : { ok: false, error: describe(result.error) }
}
