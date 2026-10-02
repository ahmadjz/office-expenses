const SIGNED_IN = '@request.auth.id != "" && @request.auth.active = true'
const ADMIN = `${SIGNED_IN} && @request.auth.isAdmin = true`
const DATE_PATTERN = '^\\d{4}-\\d{2}-\\d{2}$'
const MAX_AMOUNT = 100000000

const ledgerCollection = (name, membersId, extraFields) =>
  new Collection({
    type: 'base',
    name,
    listRule: SIGNED_IN,
    viewRule: SIGNED_IN,
    createRule: `${SIGNED_IN} && @request.body.createdBy = @request.auth.id`,
    updateRule: `${ADMIN} && @request.body.createdBy:isset = false`,
    deleteRule: ADMIN,
    fields: [
      { name: 'date', type: 'text', required: true, pattern: DATE_PATTERN, min: 10, max: 10 },
      ...extraFields,
      { name: 'amount', type: 'number', required: true, onlyInt: true, min: 1, max: MAX_AMOUNT },
      { name: 'createdBy', type: 'relation', required: true, collectionId: membersId, maxSelect: 1 },
      { name: 'created', type: 'autodate', onCreate: true },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ],
    indexes: [`CREATE INDEX idx_${name}_date ON ${name} (date)`],
  })

migrate(
  (app) => {
    const membersId = app.findCollectionByNameOrId('members').id
    const member = (name, maxSelect) => ({
      name,
      type: 'relation',
      required: true,
      collectionId: membersId,
      maxSelect,
      minSelect: 1,
    })

    app.save(
      ledgerCollection('expenses', membersId, [
        member('payer', 1),
        { name: 'item', type: 'text', required: true, min: 1, max: 80 },
        member('sharers', 100),
      ]),
    )
    app.save(ledgerCollection('payments', membersId, [member('from', 1), member('to', 1)]))
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('payments'))
    app.delete(app.findCollectionByNameOrId('expenses'))
  },
)
