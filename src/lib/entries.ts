import { parseRecords } from './records'
import { entrySchema, type Entry } from './schema'

const modules = import.meta.glob('../../data/entries/*.json', { eager: true, import: 'default' })

export const entries: Entry[] = parseRecords(modules, entrySchema)
