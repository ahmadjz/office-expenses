onRecordCreateRequest((e) => {
  require(`${__hooks}/ledger.js`).validate(e, ['payer', 'sharers'])
  e.next()
}, 'expenses')

onRecordUpdateRequest((e) => {
  require(`${__hooks}/ledger.js`).validate(e, ['payer', 'sharers'])
  e.next()
}, 'expenses')

onRecordCreateRequest((e) => {
  require(`${__hooks}/ledger.js`).validate(e, ['from', 'to'])
  e.next()
}, 'payments')

onRecordUpdateRequest((e) => {
  require(`${__hooks}/ledger.js`).validate(e, ['from', 'to'])
  e.next()
}, 'payments')

onRecordCreateRequest((e) => {
  e.record.set('position', require(`${__hooks}/ledger.js`).nextPosition(e.app))
  e.record.set('active', true)
  e.next()
}, 'members')
