import { entrySchema, type Entry } from './schema'

const modules = import.meta.glob('../../data/entries/*.json', { eager: true, import: 'default' })

export const entries: Entry[] = Object.entries(modules)
  .map(([path, value]) => {
    const result = entrySchema.safeParse(value)
    if (!result.success) throw new Error(`بيانات غير صالحة في ${path}: ${result.error.message}`)
    return result.data
  })
  .toSorted((first, second) => second.date.localeCompare(first.date) || second.createdAt.localeCompare(first.createdAt))
