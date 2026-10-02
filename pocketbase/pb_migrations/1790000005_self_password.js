const SIGNED_IN = '@request.auth.id != "" && @request.auth.active = true'
const ADMIN = `${SIGNED_IN} && @request.auth.isAdmin = true`
const FIXED_FIELDS = '@request.body.username:isset = false && @request.body.position:isset = false'
const NOT_SELF_DEMOTING =
  '(id != @request.auth.id || (@request.body.active:isset = false && @request.body.isAdmin:isset = false))'
const PASSWORD_ONLY = ['name', 'username', 'email', 'emailVisibility', 'verified', 'position', 'active', 'isAdmin', 'mustChangePassword']
  .map((field) => `@request.body.${field}:isset = false`)
  .join(' && ')
const OWN_PASSWORD = `${SIGNED_IN} && id = @request.auth.id && @request.body.password:isset = true && ${PASSWORD_ONLY}`
const ADMIN_UPDATE = `${ADMIN} && ${FIXED_FIELDS} && ${NOT_SELF_DEMOTING}`

migrate(
  (app) => {
    const members = app.findCollectionByNameOrId('members')
    members.fields.add(new BoolField({ name: 'mustChangePassword' }))
    members.updateRule = `(${ADMIN_UPDATE}) || (${OWN_PASSWORD})`
    app.save(members)
    app.db().newQuery('UPDATE members SET mustChangePassword = TRUE').execute()
  },
  (app) => {
    const members = app.findCollectionByNameOrId('members')
    members.fields.removeByName('mustChangePassword')
    members.updateRule = ADMIN_UPDATE
    app.save(members)
  },
)
