import { entryInputSchema, type EntryInput } from './schema'

type ParseSuccess = { ok: true; data: EntryInput }
type ParseFailure = { ok: false; error: string }
export type IssueParseResult = ParseSuccess | ParseFailure

const JSON_BLOCK_PATTERN = /```json\s*([\s\S]*?)\s*```/i

export function parseIssueBody(body: unknown): IssueParseResult {
  if (typeof body !== 'string') return { ok: false, error: 'نص الطلب مفقود.' }
  const block = body.match(JSON_BLOCK_PATTERN)?.[1]
  if (!block) return { ok: false, error: 'لم يتم العثور على كتلة JSON في الطلب.' }
  try {
    const parsed = JSON.parse(block) as unknown
    const result = entryInputSchema.safeParse(parsed)
    return result.success
      ? { ok: true, data: result.data }
      : { ok: false, error: result.error.issues.map((issue) => issue.message).join('؛ ') }
  } catch {
    return { ok: false, error: 'كتلة JSON غير صالحة.' }
  }
}
