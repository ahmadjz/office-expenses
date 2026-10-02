const SIGNED_IN = '@request.auth.id != "" && @request.auth.active = true'
const ADMIN = `${SIGNED_IN} && @request.auth.isAdmin = true`
const FIXED_FIELDS = '@request.body.username:isset = false && @request.body.position:isset = false'
const NOT_SELF_DEMOTING =
  '(id != @request.auth.id || (@request.body.active:isset = false && @request.body.isAdmin:isset = false))'

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    app.delete(users)

    const members = new Collection({
      type: 'auth',
      name: 'members',
      listRule: SIGNED_IN,
      viewRule: SIGNED_IN,
      createRule: ADMIN,
      updateRule: `${ADMIN} && ${FIXED_FIELDS} && ${NOT_SELF_DEMOTING}`,
      deleteRule: null,
      manageRule: ADMIN,
      authRule: 'active = true',
      passwordAuth: { enabled: true, identityFields: ['username'] },
      fields: [
        {
          name: 'username',
          type: 'text',
          required: true,
          min: 2,
          max: 30,
          pattern: '^[a-z0-9-]+$',
          presentable: true,
        },
        { name: 'email', type: 'email', system: true, required: false },
        { name: 'name', type: 'text', required: true, min: 1, max: 40 },
        { name: 'position', type: 'number', required: true, onlyInt: true, min: 1 },
        { name: 'active', type: 'bool' },
        { name: 'isAdmin', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_members_username ON members (username)',
        'CREATE UNIQUE INDEX idx_members_position ON members (position)',
      ],
    })
    app.save(members)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('members'))
  },
)
