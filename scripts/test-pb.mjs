import { spawn, execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const PB_VERSION = '0.40.4'
const PORT = 8097
const BASE = `http://127.0.0.1:${PORT}/api`
const ROOT = resolve(import.meta.dirname, '..')
const BIN_DIR = join(ROOT, '.pb-bin')
const BIN = join(BIN_DIR, 'pocketbase')
const SUPERUSER = { email: 'test@example.com', password: 'superuser-pass-123' }
const PASSWORD = 'member-pass-123'

const ensureBinary = () => {
  if (existsSync(BIN)) return
  const url = `https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip`
  execFileSync('sh', ['-c', `mkdir -p "${BIN_DIR}" && curl -sL "${url}" -o "${BIN_DIR}/pb.zip" && unzip -oq "${BIN_DIR}/pb.zip" pocketbase -d "${BIN_DIR}" && rm "${BIN_DIR}/pb.zip"`])
}

const startServer = async (dataDir) => {
  const args = [
    `--dir=${dataDir}`,
    `--migrationsDir=${join(ROOT, 'pocketbase/pb_migrations')}`,
    `--hooksDir=${join(ROOT, 'pocketbase/pb_hooks')}`,
  ]
  execFileSync(BIN, ['migrate', 'up', ...args], { stdio: 'ignore' })
  execFileSync(BIN, ['superuser', 'upsert', SUPERUSER.email, SUPERUSER.password, ...args], { stdio: 'ignore' })
  const server = spawn(BIN, ['serve', `--http=127.0.0.1:${PORT}`, ...args], { stdio: 'ignore' })
  for (let attempt = 0; attempt < 50; attempt++) {
    const healthy = await fetch(`${BASE}/health`).then((r) => r.ok, () => false)
    if (healthy) return server
    await new Promise((r) => setTimeout(r, 100))
  }
  server.kill()
  throw new Error('PocketBase did not start')
}

const call = async (token, method, path, body) => {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, body: await response.json().catch(() => null) }
}

const login = (collection, identity, password) =>
  call(null, 'POST', `/collections/${collection}/auth-with-password`, { identity, password })

const today = new Date(Date.now() + 3 * 3600_000).toISOString().slice(0, 10)
const inDays = (days) => new Date(Date.now() + 3 * 3600_000 + days * 86400_000).toISOString().slice(0, 10)

const failures = []
const check = (name, ok, detail) => {
  console.log(`${ok ? '✓' : '✗'} ${name}`)
  if (!ok) failures.push(`${name}: ${JSON.stringify(detail)}`)
}
const expectStatus = (name, result, status) => check(name, result.status === status, result)

const run = async () => {
  const su = (await login('_superusers', SUPERUSER.email, SUPERUSER.password)).body.token
  const members = (await call(su, 'GET', '/collections/members/records?sort=position')).body.items
  const id = Object.fromEntries(members.map((m) => [m.username, m.id]))

  check('seeds seven members in canonical order', members.map((m) => m.position).join() === '1,2,3,4,5,6,7', members)
  check('only ahmad is admin', members.filter((m) => m.isAdmin).map((m) => m.username).join() === 'ahmad', members)

  for (const username of ['ahmad', 'kasem', 'abu-obaida']) {
    await call(su, 'PATCH', `/collections/members/records/${id[username]}`, { password: PASSWORD, passwordConfirm: PASSWORD })
  }
  const admin = (await login('members', 'ahmad', PASSWORD)).body.token
  const kasemLogin = await login('members', 'kasem', PASSWORD)
  expectStatus('member logs in with username', kasemLogin, 200)
  const kasem = kasemLogin.body.token

  const anonymous = await call(null, 'GET', '/collections/expenses/records')
  check('anonymous sees no expenses', anonymous.body?.items?.length === 0 || anonymous.status >= 400, anonymous)
  const anonymousMembers = await call(null, 'GET', '/collections/members/records')
  check('anonymous sees no members', anonymousMembers.body?.items?.length === 0 || anonymousMembers.status >= 400, anonymousMembers)

  const expense = {
    date: today,
    payer: id.ahmad,
    item: '  نص كيلو جبنة  ',
    amount: 100,
    sharers: [id.ahmad, id['abu-obaida'], id.kasem, id['abu-adnan']],
    createdBy: id.kasem,
  }
  const created = await call(kasem, 'POST', '/collections/expenses/records', expense)
  expectStatus('member creates an expense', created, 200)
  check('item is trimmed', created.body?.item === 'نص كيلو جبنة', created.body)
  const expenseId = created.body.id

  expectStatus('createdBy spoofing is rejected', await call(kasem, 'POST', '/collections/expenses/records', { ...expense, createdBy: id.ahmad }), 400)
  const modifierSpoof = await call(kasem, 'POST', '/collections/expenses/records', { ...expense, 'createdBy-': id.kasem, 'createdBy+': id.ahmad })
  check('createdBy modifiers cannot spoof the author', modifierSpoof.status >= 400 || modifierSpoof.body?.createdBy === id.kasem, modifierSpoof)
  expectStatus('float amount is rejected', await call(kasem, 'POST', '/collections/expenses/records', { ...expense, amount: 10.5 }), 400)
  expectStatus('zero amount is rejected', await call(kasem, 'POST', '/collections/expenses/records', { ...expense, amount: 0 }), 400)
  expectStatus('empty sharers is rejected', await call(kasem, 'POST', '/collections/expenses/records', { ...expense, sharers: [] }), 400)
  expectStatus('whitespace item is rejected', await call(kasem, 'POST', '/collections/expenses/records', { ...expense, item: '   ' }), 400)
  expectStatus('date after tomorrow is rejected', await call(kasem, 'POST', '/collections/expenses/records', { ...expense, date: inDays(2) }), 400)
  expectStatus('tomorrow is accepted', await call(kasem, 'POST', '/collections/expenses/records', { ...expense, date: inDays(1) }), 200)
  expectStatus('impossible date is rejected', await call(kasem, 'POST', '/collections/expenses/records', { ...expense, date: '2026-02-31' }), 400)

  const duplicateSharers = await call(kasem, 'POST', '/collections/expenses/records', { ...expense, sharers: [id.kasem, id.kasem] })
  check('duplicate sharers collapse or are rejected', duplicateSharers.status === 400 || duplicateSharers.body?.sharers?.length === 1, duplicateSharers)

  expectStatus('member cannot update', await call(kasem, 'PATCH', `/collections/expenses/records/${expenseId}`, { amount: 200 }), 404)
  expectStatus('member cannot delete', await call(kasem, 'DELETE', `/collections/expenses/records/${expenseId}`), 404)
  expectStatus('admin updates', await call(admin, 'PATCH', `/collections/expenses/records/${expenseId}`, { amount: 120 }), 200)
  expectStatus('admin cannot rewrite createdBy', await call(admin, 'PATCH', `/collections/expenses/records/${expenseId}`, { createdBy: id.ahmad }), 404)
  expectStatus('admin cannot rewrite createdBy via modifier', await call(admin, 'PATCH', `/collections/expenses/records/${expenseId}`, { 'createdBy+': id.ahmad }), 404)

  const payment = { date: today, from: id['abu-obaida'], to: id.ahmad, amount: 25, createdBy: id.kasem }
  expectStatus('member creates a payment', await call(kasem, 'POST', '/collections/payments/records', payment), 200)
  expectStatus('payment to self is rejected', await call(kasem, 'POST', '/collections/payments/records', { ...payment, to: id['abu-obaida'] }), 400)

  expectStatus('member cannot create members', await call(kasem, 'POST', '/collections/members/records', { username: 'x-new', name: 'س', password: PASSWORD, passwordConfirm: PASSWORD }), 400)
  const added = await call(admin, 'POST', '/collections/members/records', { username: 'abu-sami', name: 'أبو سامي', position: 1, password: PASSWORD, passwordConfirm: PASSWORD })
  expectStatus('admin adds a member', added, 200)
  check('new member is appended at the next position', added.body?.position === 8 && added.body?.active === true, added.body)

  expectStatus('position is immutable', await call(admin, 'PATCH', `/collections/members/records/${id.kasem}`, { position: 9 }), 404)
  expectStatus('position is immutable via modifier', await call(admin, 'PATCH', `/collections/members/records/${id.kasem}`, { 'position+': 100 }), 404)
  expectStatus('username is immutable', await call(admin, 'PATCH', `/collections/members/records/${id.kasem}`, { username: 'kasem2' }), 404)
  expectStatus('admin cannot deactivate themselves', await call(admin, 'PATCH', `/collections/members/records/${id.ahmad}`, { active: false }), 404)
  expectStatus('admin renames a member', await call(admin, 'PATCH', `/collections/members/records/${id.kasem}`, { name: 'قاسم' }), 200)
  expectStatus('member cannot promote themselves', await call(kasem, 'PATCH', `/collections/members/records/${id.kasem}`, { isAdmin: true }), 404)
  expectStatus('nobody deletes members, not even admin', await call(admin, 'DELETE', `/collections/members/records/${id.kasem}`), 403)

  const newPassword = 'reset-pass-456'
  expectStatus('admin resets a password', await call(admin, 'PATCH', `/collections/members/records/${id['abu-obaida']}`, { password: newPassword, passwordConfirm: newPassword }), 200)
  const resetLogin = await login('members', 'abu-obaida', newPassword)
  expectStatus('reset password works', resetLogin, 200)
  check('a new member must change their password', added.body?.mustChangePassword === true, added.body)
  check('an admin reset flags the password for change', resetLogin.body?.record?.mustChangePassword === true, resetLogin.body)

  const obaida = resetLogin.body.token
  const ownPassword = 'my-own-pass-789'
  const selfChange = { oldPassword: newPassword, password: ownPassword, passwordConfirm: ownPassword }
  expectStatus('member cannot change own password without the current one', await call(obaida, 'PATCH', `/collections/members/records/${id['abu-obaida']}`, { password: ownPassword, passwordConfirm: ownPassword }), 400)
  expectStatus('member cannot rename themselves while changing password', await call(obaida, 'PATCH', `/collections/members/records/${id['abu-obaida']}`, { ...selfChange, name: 'x' }), 404)
  expectStatus('member cannot clear the flag without changing password', await call(obaida, 'PATCH', `/collections/members/records/${id['abu-obaida']}`, { mustChangePassword: false }), 404)
  expectStatus('member cannot change another member password', await call(obaida, 'PATCH', `/collections/members/records/${id.ahmad}`, { oldPassword: PASSWORD, password: ownPassword, passwordConfirm: ownPassword }), 404)
  expectStatus('admin cannot change own password with a wrong current one', await call(admin, 'PATCH', `/collections/members/records/${id.ahmad}`, { oldPassword: 'wrong', password: ownPassword, passwordConfirm: ownPassword }), 400)
  expectStatus('admin cannot change own password without the current one', await call(admin, 'PATCH', `/collections/members/records/${id.ahmad}`, { password: ownPassword, passwordConfirm: ownPassword }), 400)
  expectStatus('member changes own password',await call(obaida, 'PATCH', `/collections/members/records/${id['abu-obaida']}`, selfChange), 200)
  const ownLogin = await login('members', 'abu-obaida', ownPassword)
  expectStatus('own new password works', ownLogin, 200)
  check('changing own password clears the flag', ownLogin.body?.record?.mustChangePassword === false, ownLogin.body)

  expectStatus('admin deactivates a member', await call(admin, 'PATCH', `/collections/members/records/${id.kasem}`, { active: false }), 200)
  check('deactivated member cannot log in', (await login('members', 'kasem', PASSWORD)).status >= 400, null)
  const staleSession = await call(kasem, 'GET', '/collections/expenses/records')
  check('deactivated member session stops working', staleSession.status >= 400 || staleSession.body?.items?.length === 0, staleSession)

  expectStatus('inactive member cannot be a new sharer', await call(admin, 'POST', '/collections/expenses/records', { ...expense, createdBy: id.ahmad }), 400)
  expectStatus('editing a record that already has an inactive member works', await call(admin, 'PATCH', `/collections/expenses/records/${expenseId}`, { item: 'جبنة' }), 200)
  await call(admin, 'PATCH', `/collections/members/records/${id['abu-khaled']}`, { active: false })
  expectStatus('inactive member cannot be added on edit', await call(admin, 'PATCH', `/collections/expenses/records/${expenseId}`, { payer: id['abu-khaled'] }), 400)
  expectStatus('admin deletes', await call(admin, 'DELETE', `/collections/expenses/records/${expenseId}`), 204)
}

ensureBinary()
const dataDir = mkdtempSync(join(tmpdir(), 'office-pb-'))
const server = await startServer(dataDir)
try {
  await run()
} finally {
  server.kill()
  rmSync(dataDir, { recursive: true, force: true })
}
if (failures.length > 0) {
  console.error(`\n${failures.length} failed:\n${failures.join('\n')}`)
  process.exit(1)
}
