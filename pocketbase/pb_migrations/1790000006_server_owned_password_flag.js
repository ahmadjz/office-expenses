const SIGNED_IN = '@request.auth.id != "" && @request.auth.active = true'
const ADMIN = `${SIGNED_IN} && @request.auth.isAdmin = true`
const FIXED_FIELDS = '@request.body.username:isset = false && @request.body.position:isset = false'
const NOT_SELF_DEMOTING =
  '(id != @request.auth.id || (@request.body.active:isset = false && @request.body.isAdmin:isset = false))'
const PASSWORD_ONLY = ['name', 'username', 'email', 'emailVisibility', 'verified', 'position', 'active', 'isAdmin', 'mustChangePassword']
  .map((field) => `@request.body.${field}:isset = false`)
  .join(' && ')
const OWN_PASSWORD = `${SIGNED_IN} && id = @request.auth.id && @request.body.password:isset = true && ${PASSWORD_ONLY}`
const OLD_ADMIN_UPDATE = `${ADMIN} && ${FIXED_FIELDS} && ${NOT_SELF_DEMOTING}`
const ADMIN_UPDATE = `${OLD_ADMIN_UPDATE} && @request.body.mustChangePassword:isset = false`

migrate(
  (app) => {
    const members = app.findCollectionByNameOrId('members')
    members.updateRule = `(${ADMIN_UPDATE}) || (${OWN_PASSWORD})`
    app.save(members)
  },
  (app) => {
    const members = app.findCollectionByNameOrId('members')
    members.updateRule = `(${OLD_ADMIN_UPDATE}) || (${OWN_PASSWORD})`
    app.save(members)
  },
)
