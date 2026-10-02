import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { ZodType } from 'zod'
import { groupByWeek } from '../src/lib/feed'
import type { Expense, Payment } from '../src/lib/schema'
import { buildImportPlan, type ImportRow } from './import-plan'
import { legacyEntrySchema, legacyPaymentSchema } from './legacy-schema'

const ROOT = resolve(import.meta.dirname, '..')
const PB_URL = process.env.PB_URL ?? 'https://office.ahmadjz.tech'
const DRY_RUN = process.argv.includes('--dry-run')

type PbMember = { id: string; username: string; position: number }
type PbExpense = Expense & Record<string, unknown>
type PbPayment = Payment & Record<string, unknown>

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

function readLegacy<T>(directory: string, schema: ZodType<T>): T[] {
  const folder = join(ROOT, 'data', directory)
  return readdirSync(folder)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const result = schema.safeParse(JSON.parse(readFileSync(join(folder, file), 'utf8')))
      if (!result.success) throw new Error(`${directory}/${file}: ${result.error.message}`)
      return result.data
    })
}

async function api<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${PB_URL}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new Error(`${method} ${path} → ${response.status} ${JSON.stringify(payload)}`)
  return payload as T
}

async function listAll<T>(token: string, collection: string): Promise<T[]> {
  const page = await api<{ items: T[]; totalPages: number }>(token, 'GET', `/collections/${collection}/records?perPage=500&sort=created`)
  if (page.totalPages > 1) throw new Error(`${collection} has more than 500 records; paginate`)
  return page.items
}

function planAsRecords(plan: readonly ImportRow[]): { expenses: Expense[]; payments: Payment[] } {
  const expenses = plan.flatMap((row, index) => row.collection === 'expenses' ? [{ ...row.body, id: row.legacyId, created: String(index).padStart(6, '0') }] : [])
  const payments = plan.flatMap((row, index) => row.collection === 'payments' ? [{ ...row.body, id: row.legacyId, created: String(index).padStart(6, '0') }] : [])
  return { expenses, payments }
}

function weeklySummaries(expenses: readonly Expense[], payments: readonly Payment[], order: ReadonlyMap<string, number>, usernameById: ReadonlyMap<string, string>): string[] {
  return groupByWeek(expenses, payments, order).map((week) => {
    const rows = week.summary.map(({ id, paid, owed, settled, net }) => `${usernameById.get(id)}:${paid}/${owed}/${settled}/${net}`)
    return `${week.weekStart}  ${rows.join('  ')}`
  })
}

async function main(): Promise<void> {
  const legacyEntries = readLegacy('entries', legacyEntrySchema)
  const legacyPayments = readLegacy('payments', legacyPaymentSchema)

  const auth = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: requireEnv('PB_EMAIL'), password: requireEnv('PB_PASSWORD') }),
  })
  if (!auth.ok) throw new Error(`superuser login failed: ${auth.status}`)
  const { token } = (await auth.json()) as { token: string }

  const members = await listAll<PbMember>(token, 'members')
  const order = new Map(members.map((member) => [member.id, member.position]))
  const usernameById = new Map(members.map((member) => [member.id, member.username]))
  const plan = buildImportPlan(legacyEntries, legacyPayments, new Map(members.map((member) => [member.username, member.id])), 'ahmad')
  console.log(`legacy: ${legacyEntries.length} expenses, ${legacyPayments.length} payments → ${plan.length} rows`)

  const [existingExpenses, existingPayments] = await Promise.all([listAll(token, 'expenses'), listAll(token, 'payments')])
  if (existingExpenses.length + existingPayments.length > 0) {
    throw new Error(`refusing to import: ${existingExpenses.length} expenses and ${existingPayments.length} payments already exist`)
  }

  if (DRY_RUN) {
    console.log('dry run — nothing written')
    return
  }

  const { batch } = await api<{ batch: Record<string, unknown> }>(token, 'GET', '/settings')
  await api(token, 'PATCH', '/settings', { batch: { ...batch, enabled: true, maxRequests: plan.length } })
  try {
    await api(token, 'POST', '/batch', {
      requests: plan.map((row) => ({ method: 'POST', url: `/api/collections/${row.collection}/records`, body: row.body })),
    })
  } finally {
    await api(token, 'PATCH', '/settings', { batch })
  }

  const planned = planAsRecords(plan)
  const before = weeklySummaries(planned.expenses, planned.payments, order, usernameById)
  const importedExpenses = await listAll<PbExpense>(token, 'expenses')
  const importedPayments = await listAll<PbPayment>(token, 'payments')
  const after = weeklySummaries(importedExpenses, importedPayments, order, usernameById)
  const countsMatch = importedExpenses.length === legacyEntries.length && importedPayments.length === legacyPayments.length
  const summariesMatch = JSON.stringify(before) === JSON.stringify(after)

  console.log('\nweek  member:paid/owed/settled/net')
  before.forEach((line, index) => console.log(`${line === after[index] ? '✓' : '✗'} ${line}${line === after[index] ? '' : `\n  after: ${after[index]}`}`))
  console.log(`\ncounts ${countsMatch ? 'match' : 'DIFFER'}, weekly summaries ${summariesMatch ? 'match' : 'DIFFER'}`)
  if (!countsMatch || !summariesMatch) process.exit(1)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
