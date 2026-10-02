import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { ZodType } from 'zod'
import { groupByWeek } from '../src/lib/feed'
import { entrySchema, paymentSchema, type Entry, type Payment } from '../src/lib/schema'
import { summarizeWeek } from '../src/lib/summary'
import { buildImportPlan } from './import-plan'

const ROOT = resolve(import.meta.dirname, '..')
const PB_URL = process.env.PB_URL ?? 'https://office.ahmadjz.tech'
const DRY_RUN = process.argv.includes('--dry-run')

type PbMember = { id: string; username: string }
type PbExpense = { date: string; payer: string; item: string; amount: number; sharers: string[]; created: string }
type PbPayment = { date: string; from: string; to: string; amount: number; created: string }

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

function weeklySummaries(entries: readonly Entry[], payments: readonly Payment[]): string[] {
  return groupByWeek(entries, payments).map((week) => {
    const rows = summarizeWeek(week.entries, week.payments).map(({ id, paid, owed, settled, net }) => `${id}:${paid}/${owed}/${settled}/${net}`)
    return `${week.weekStart}  ${rows.join('  ')}`
  })
}

function asLegacy(expenses: readonly PbExpense[], payments: readonly PbPayment[], usernameById: ReadonlyMap<string, string>) {
  const slug = (id: string) => usernameById.get(id) as Entry['payer']
  const filler = { id: '0000-00-00-000000', issue: 1 }
  return {
    entries: expenses.map((row): Entry => ({ ...filler, createdAt: row.created, date: row.date, payer: slug(row.payer), item: row.item, amount: row.amount, sharers: row.sharers.map(slug) })),
    payments: payments.map((row): Payment => ({ ...filler, createdAt: row.created, date: row.date, from: slug(row.from), to: slug(row.to), amount: row.amount })),
  }
}

async function main(): Promise<void> {
  const legacyEntries = readLegacy('entries', entrySchema)
  const legacyPayments = readLegacy('payments', paymentSchema)
  const before = weeklySummaries(legacyEntries, legacyPayments)

  const auth = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: requireEnv('PB_EMAIL'), password: requireEnv('PB_PASSWORD') }),
  })
  if (!auth.ok) throw new Error(`superuser login failed: ${auth.status}`)
  const { token } = (await auth.json()) as { token: string }

  const members = await listAll<PbMember>(token, 'members')
  const plan = buildImportPlan(legacyEntries, legacyPayments, new Map(members.map((m) => [m.username, m.id])), 'ahmad')
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

  const imported = asLegacy(
    await listAll<PbExpense>(token, 'expenses'),
    await listAll<PbPayment>(token, 'payments'),
    new Map(members.map((m) => [m.id, m.username])),
  )
  const after = weeklySummaries(imported.entries, imported.payments)
  const countsMatch = imported.entries.length === legacyEntries.length && imported.payments.length === legacyPayments.length
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
