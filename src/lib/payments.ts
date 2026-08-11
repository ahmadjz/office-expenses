import { parseRecords } from './records'
import { paymentSchema, type Payment } from './schema'

const modules = import.meta.glob('../../data/payments/*.json', { eager: true, import: 'default' })

export const payments: Payment[] = parseRecords(modules, paymentSchema)
