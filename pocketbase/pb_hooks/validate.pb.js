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
  e.record.set('mustChangePassword', true)
  e.next()
}, 'members')

onRecordUpdateRequest((e) => {
  const body = e.requestInfo().body
  if (body.password !== undefined) {
    const isOwnPassword = e.auth?.id === e.record.id
    if (isOwnPassword && !e.record.original().validatePassword(String(body.oldPassword ?? ''))) {
      throw new BadRequestError('كلمة المرور الحالية غير صحيحة')
    }
    e.record.set('mustChangePassword', !isOwnPassword)
  }
  e.next()
}, 'members')
