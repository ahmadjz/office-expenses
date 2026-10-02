migrate(
  (app) => {
    const settings = app.settings()
    settings.backups.cron = '0 1 * * *'
    settings.backups.cronMaxKeep = 7
    app.save(settings)
  },
  (app) => {
    const settings = app.settings()
    settings.backups.cron = ''
    app.save(settings)
  },
)
