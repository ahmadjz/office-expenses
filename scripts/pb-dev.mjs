import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const BIN = join(ROOT, '.pb-bin/pocketbase')

if (!existsSync(BIN)) {
  console.error('Run `npm run test:pb` once to download PocketBase into .pb-bin/')
  process.exit(1)
}

spawn(BIN, [
  'serve',
  '--http=127.0.0.1:8090',
  `--dir=${join(ROOT, 'pocketbase/pb_data')}`,
  `--migrationsDir=${join(ROOT, 'pocketbase/pb_migrations')}`,
  `--hooksDir=${join(ROOT, 'pocketbase/pb_hooks')}`,
], { stdio: 'inherit' }).on('exit', (code) => process.exit(code ?? 0))
