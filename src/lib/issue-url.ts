import type { EntryInput } from './schema'
import { memberName } from '../data/members'

export const ISSUE_BASE_URL = 'https://github.com/ahmadjz/office-expenses/issues/new'

export function createIssuePayload(input: EntryInput): string {
  return JSON.stringify(input, null, 2)
}

export function createIssueUrl(input: EntryInput): string {
  const title = `إدخال: ${memberName(input.payer)} — ${input.item} — ${input.amount}`
  const body = `إدخال مصاريف مكتب جديد:\n\n\`\`\`json\n${createIssuePayload(input)}\n\`\`\``
  return `${ISSUE_BASE_URL}?labels=entry&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
}
