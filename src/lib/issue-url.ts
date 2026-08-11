import type { EntryInput, PaymentInput } from './schema'
import { memberName } from '../data/members'

export const ISSUE_BASE_URL = 'https://github.com/ahmadjz/office-expenses/issues/new'

function issueUrl(title: string, intro: string, payload: string): string {
  const body = `${intro}\n\n\`\`\`json\n${payload}\n\`\`\``
  return `${ISSUE_BASE_URL}?labels=entry&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
}

export function createIssuePayload(input: EntryInput): string {
  return JSON.stringify({ kind: 'expense', ...input }, null, 2)
}

export function createIssueUrl(input: EntryInput): string {
  return issueUrl(`إدخال: ${memberName(input.payer)} — ${input.item} — ${input.amount}`, 'إدخال مصاريف مكتب جديد:', createIssuePayload(input))
}

export function createPaymentPayload(input: PaymentInput): string {
  return JSON.stringify({ kind: 'payment', ...input }, null, 2)
}

export function createPaymentIssueUrl(input: PaymentInput): string {
  return issueUrl(`دفعة: ${memberName(input.from)} إلى ${memberName(input.to)} — ${input.amount}`, 'تسجيل دفعة تسوية:', createPaymentPayload(input))
}
