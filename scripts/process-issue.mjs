import { mkdir, writeFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'
import { parseIssueBody } from '../src/lib/issue-parser.ts'
import { splitAmount } from '../src/lib/split.ts'
import { memberName } from '../src/data/members.ts'

const ALLOWLIST = ['ahmadjz', 'amidan99']
const outputFile = process.env.GITHUB_OUTPUT

function setOutput(name, value) {
  if (outputFile) return writeFile(outputFile, `${name}=${value}\n`, { flag: 'a' })
  return Promise.resolve()
}

function makeId(date) {
  return `${date}-${randomBytes(3).toString('hex')}`
}

async function reject(message) {
  await setOutput('isValid', 'false')
  await setOutput('message', message.replaceAll('\n', ' '))
}

async function main() {
  const author = process.env.ISSUE_AUTHOR
  if (!author || !ALLOWLIST.includes(author)) {
    await reject('لا تملك صلاحية إضافة مصروفات إلى هذا السجل.')
    return
  }
  const parsed = parseIssueBody(process.env.ISSUE_BODY)
  if (!parsed.ok) {
    await reject(parsed.error)
    return
  }
  const issue = Number(process.env.ISSUE_NUMBER)
  if (!Number.isInteger(issue) || issue < 1) {
    await reject('رقم الطلب غير صالح.')
    return
  }
  const entry = { ...parsed.data, id: makeId(parsed.data.date), createdAt: new Date().toISOString(), issue }
  const destination = resolve('data/entries', `${entry.id}.json`)
  await mkdir(resolve('data/entries'), { recursive: true })
  await writeFile(destination, `${JSON.stringify(entry, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
  const breakdown = [...splitAmount(entry.amount, entry.sharers)]
    .map(([id, share]) => `${memberName(id)}: ${share} ل.س`)
    .join('، ')
  await setOutput('isValid', 'true')
  await setOutput('filename', destination)
  await setOutput('message', `تم حفظ الإدخال بنجاح. الحصص: ${breakdown}`)
}

main().catch(async (error) => {
  console.error('Issue processing failed:', error)
  await reject('تعذر معالجة الإدخال. راجع سجل سير العمل للتفاصيل.')
})
