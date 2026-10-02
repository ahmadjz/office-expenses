const DAMASCUS_OFFSET_MS = 3 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10)

const assertDate = (date) => {
  if (isoDay(Date.parse(`${date}T00:00:00Z`) || 0) !== date) {
    throw new BadRequestError('التاريخ غير صالح')
  }
  const tomorrow = isoDay(Date.now() + DAMASCUS_OFFSET_MS + DAY_MS)
  if (date > tomorrow) {
    throw new BadRequestError('لا يمكن أن يكون التاريخ بعد الغد')
  }
}

const assertActive = (app, ids, alreadyReferenced) => {
  ids
    .filter((id) => !alreadyReferenced.includes(id))
    .forEach((id) => {
      if (!app.findRecordById('members', id).getBool('active')) {
        throw new BadRequestError('لا يمكن اختيار عضو معطّل')
      }
    })
}

const memberIds = (record, fields) => fields.flatMap((field) => record.getStringSlice(field))

const validate = (e, memberFields) => {
  const record = e.record
  assertDate(record.getString('date'))

  if (record.collection().name === 'expenses') {
    const item = record.getString('item').trim()
    if (item === '') throw new BadRequestError('اسم الغرض مطلوب')
    record.set('item', item)
  }

  if (record.collection().name === 'payments' && record.getString('from') === record.getString('to')) {
    throw new BadRequestError('لا يمكن أن يدفع العضو لنفسه')
  }

  const original = record.isNew() ? [] : memberIds(record.original(), memberFields)
  assertActive(e.app, memberIds(record, memberFields), original)
}

const nextPosition = (app) => {
  const rows = arrayOf(new DynamicModel({ maxPosition: 0 }))
  app.db().newQuery('SELECT COALESCE(MAX(position), 0) AS maxPosition FROM members').all(rows)
  return rows[0].maxPosition + 1
}

module.exports = { validate, nextPosition }
