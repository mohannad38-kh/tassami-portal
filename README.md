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
After initialization, external database traffic is blocked; the Render service connects over the private network. If you need to run these commands from your computer again, temporarily allow only your current public IP as a `/32` rule in the database's **Networking** section, then remove that rule when finished. Do not restore `0.0.0.0/0`.

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

### Join requests and volunteer accounts

Applicants choose a password when submitting a join request. The site stores only its password hash and keeps the account inactive until an administrator approves the request. After approval, the applicant can sign in with the same email and password; while the request is pending, login explains that approval is still required. A membership confirmation email is optional and requires a configured mail provider.

Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in the Render service's environment settings to send approval and password-recovery emails. The sender must be verified with Resend. The HTTP API works on Render's free web-service plan. Gmail SMTP is retained as a fallback for compatible paid hosts, but Render's free web services block outbound SMTP.

To grant a specific existing account access only to review and approve join requests, add its email to the comma-separated `JOIN_REQUEST_MANAGER_EMAILS` environment variable. This does not grant access to other administration features.

To grant a trusted existing account full site administration access, add its email to the comma-separated `SUPER_ADMIN_EMAILS` environment variable. This grants the highest application role; only use it for accounts that require full administrative access.

To temporarily remove administrative access from specific accounts without deleting them, add their emails to the comma-separated `ADMIN_ROLE_REVOKED_EMAILS` environment variable. This overrides their stored role and other role grants with the regular member role until the email is removed from this list.

If the configured administrator does not yet have an account in the production database, set `ADMIN_BOOTSTRAP_TOKEN` in Render to a newly generated random value of at least 32 characters. Open `/admin-setup`, enter the same email listed in `SUPER_ADMIN_EMAILS`, the token, and a unique password of at least 12 characters. The endpoint only creates a new account for an email whose effective role is `super_admin`, and refuses to overwrite an existing account. After successful setup, remove `ADMIN_BOOTSTRAP_TOKEN` from Render and sign in at `/login`.

### Environment variables

The Blueprint generates `SESSION_SECRET` and connects `DATABASE_URL` to the Render database. Set mail-provider secrets only in the Render dashboard; do not place credentials in the repository. Rotate any app password that was previously shared.
