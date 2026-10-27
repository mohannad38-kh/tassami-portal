# Tasami Portal

Tasami Initiative website and API, built with React, Express, Drizzle ORM, and PostgreSQL.

## Local development

Install dependencies with pnpm, then run the frontend using the repository's existing Vite setup. Local development uses SQLite for local join-request administration; production uses PostgreSQL.

## Render test deployment

This repository includes a Render Blueprint in `render.yaml`. In Render, create a new Blueprint from this repository and confirm the free web service and free PostgreSQL database.

The free web service sleeps after inactivity. The free PostgreSQL database expires after 30 days and has no backups, so this setup is for testing only. Do not collect real applications until you upgrade to a persistent database plan and arrange backups.

### Initialize the database and first administrator

After Render creates the database, copy its **external** connection string from the database dashboard. In a local PowerShell window at the repository root, load it from the clipboard and add the TLS requirement Render expects:

```powershell
$databaseUrl = Get-Clipboard -Raw
if ($databaseUrl -notmatch '[?&]sslmode=') {
  $databaseUrl += $(if ($databaseUrl.Contains('?')) { '&' } else { '?' }) + 'sslmode=require'
}
$env:DATABASE_URL = $databaseUrl
Remove-Variable databaseUrl
pnpm --filter @workspace/db run push-force
```

Only use `push-force` on this new, empty test database. It may apply destructive schema changes if used later against a database containing data.

Then copy the external connection string again and create the first administrator. Use a unique password of at least 12 characters; do not commit it or send it in chat:

```powershell
$databaseUrl = Get-Clipboard -Raw
if ($databaseUrl -notmatch '[?&]sslmode=') {
  $databaseUrl += $(if ($databaseUrl.Contains('?')) { '&' } else { '?' }) + 'sslmode=require'
}
$env:DATABASE_URL = $databaseUrl
Remove-Variable databaseUrl
$env:BOOTSTRAP_ADMIN_EMAIL = "your-admin-email@example.com"
$env:BOOTSTRAP_ADMIN_PASSWORD = "choose-a-unique-password"
node artifacts/api-server/scripts/bootstrap-admin.mjs
Remove-Item Env:DATABASE_URL, Env:BOOTSTRAP_ADMIN_EMAIL, Env:BOOTSTRAP_ADMIN_PASSWORD
```

The bootstrap script only creates an administrator if the users table is empty. Sign in at `/login`, then add other administrators from the site administration tools.

### Environment variables

The Blueprint generates `SESSION_SECRET` and connects `DATABASE_URL` to the Render database. Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in the Render dashboard if email notifications are needed. Do not place credentials in the repository. Rotate any app password that was previously shared.
