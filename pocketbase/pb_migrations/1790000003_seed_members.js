const SEED = [
  { username: 'ahmad', name: 'أحمد', isAdmin: true },
  { username: 'abu-obaida', name: 'أبو عبيدة' },
  { username: 'kasem', name: 'كاسم' },
  { username: 'abu-khaled', name: 'أبو خالد' },
  { username: 'abu-tareq', name: 'أبو طارق' },
  { username: 'abu-adnan', name: 'أبو عدنان' },
  { username: 'abu-mohsen', name: 'أبو محسن' },
]

migrate(
  (app) => {
    const members = app.findCollectionByNameOrId('members')
    SEED.forEach((seed, index) => {
      const record = new Record(members)
      record.set('username', seed.username)
      record.set('name', seed.name)
      record.set('position', index + 1)
      record.set('active', true)
      record.set('isAdmin', seed.isAdmin === true)
      record.setPassword($security.randomString(32))
      app.save(record)
    })
  },
  (app) => {
    SEED.forEach(({ username }) => {
      app.delete(app.findFirstRecordByData('members', 'username', username))
    })
  },
)
