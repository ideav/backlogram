# Integram engine (English edition)

Self-contained English fork of the Integram PHP engine. It runs on any domain: nothing in the
code names a host (see "Domain" below). Canonical upstream: the
`ideav/crm` repository (`index.php`, `include/`, `templates/`, `js/`, `css/`). This copy serves
English only, has no region-specific captcha, QR login or billing, and signs users up with
**email (confirmed by mail), Google or GitHub**.

## How it fits together

- Web root = contents of `dist-en/` (static marketing pages, `npm run build:en`) + contents of
  this folder. `scripts/en-deploy.sh` assembles exactly that.
- `dist-en/.htaccess` (from `site-en/public/.htaccess`): https + bare domain, existing files and
  `<route>/index.html` pages are served as is, `/start` → `start.php`, everything else → `index.php`.
- One MySQL database. Each workspace is a table of `(id, t, up, ord, val)` rows:
  - `my` — the personal cabinet: users (email / provider id), their workspaces, roles;
  - `en` — template cloned into every new workspace (`CREATE TABLE <ws> LIKE en` + rows);
  - `<workspace>` — one table per user workspace, named after the email (`john@x.com` → `john`).
- URLs: `/start` (log in), `/start#signup`, `/start#reset`, `/my` (cabinet: workspaces, profile,
  log out), `/<workspace>` (the app), `/auth/google`, `/auth/github` (OAuth).

## Install on a generic host (PHP 8.1+ with mysqli, curl, mbstring; Apache with mod_rewrite; MySQL 8)

1. Create an empty MySQL database and a user with full rights on it.
2. Upload `dist-en/*` and `site-en/engine/*` into the web root (`bash scripts/en-deploy.sh`).
   `AllowOverride All` must be on for the web root.
3. Configure: copy `.env.example` to `.env` in the web root (or set the same names as real
   environment variables) and fill in DB, `INTEGRAM_SALT`, SMTP, base URL, OAuth keys.
4. Create the tables: `php install.php` in the web root (idempotent; safe to re-run after
   updates). Without shell access set `INTEGRAM_INSTALL_TOKEN` and open
   `https://<host>/install.php?token=<token>` once, then clear the token.
5. Make `logs/`, `download/` and `templates/custom/` writable by the web server user.
   `templates/custom/my/` (the cabinet templates) is part of the code: deploy it with updates.
6. Open `/start#signup`, register, click the link in the email: you land in your new workspace.

No cron jobs are required.

## Environment variables

See `.env.example` for the full list with comments. Required: `INTEGRAM_DB_*`, `INTEGRAM_SALT`,
`INTEGRAM_SMTP_*`. Recommended: `INTEGRAM_ALLOWED_HOSTS`. Optional: OAuth keys (a provider without
keys is hidden on `/start`), `INTEGRAM_ADMIN_EMAIL` (sign-up notifications), `INTEGRAM_SMTP_FROM_EMAIL`,
`INTEGRAM_TURNSTILE_SITEKEY/SECRET`, `INTEGRAM_MASTER_PASSWORD`, rate limits,
`INTEGRAM_MAX_WORKSPACES` (workspaces per free-plan user in `/my`, default 3, `0` = unlimited).

## Domain

The engine never hardcodes a domain, so anyone can run a copy under their own. Links in emails
(confirmation, password reset), OAuth redirect URIs, cookies and the default sender
`no-reply@<host>` are built from the current request: the scheme from `HTTPS` or
`X-Forwarded-Proto`, the host from the `Host` header.

- `INTEGRAM_ALLOWED_HOSTS=example.com,www.example.com` — set it in production. A request whose
  `Host` is not in the list is treated as the first listed host, so a forged `Host` header never
  reaches password-reset or confirmation links. Behind a proxy that rewrites `Host`, list the
  public domain first.
- `INTEGRAM_BASE_URL` is used only without a request (CLI scripts).
- Server time and stored dates are UTC; amounts have no currency.

## OAuth apps

**Google** — Google Cloud Console → APIs & Services → Credentials → Create credentials →
OAuth client ID → Web application.
- Authorized redirect URI: `https://<your-domain>/auth/google` (`/auth.asp` also works as an alias).
- Scopes: `openid email profile` (OAuth consent screen: External, publish the app).
- Put the client ID/secret into `INTEGRAM_GOOGLE_CLIENT_ID` / `INTEGRAM_GOOGLE_CLIENT_SECRET`.

**GitHub** — GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
- Homepage URL: `https://<your-domain>`; Authorization callback URL: `https://<your-domain>/auth/github`.
- The app asks for `read:user user:email`; the account's *primary verified* email is used.
- Put the values into `INTEGRAM_GITHUB_CLIENT_ID` / `INTEGRAM_GITHUB_CLIENT_SECRET`.

Sign-in with a provider finds the user by provider id, then by the verified email (so an email
account and a Google/GitHub login with the same address are one account), creates the user and
their workspace on the first login, and opens the workspace.

## Bot protection

Hidden honeypot field on all forms, per-IP rate limits (file counters in the temp dir) on sign-up,
login, reset and OAuth start, the engine's own failed-login counter, and optional Cloudflare
Turnstile on sign-up and reset when `INTEGRAM_TURNSTILE_*` are set.

## Local stack and smoke test

```bash
npm run build:en
docker compose -f site-en/docker-compose.yml up -d --build   # http://localhost:8080, mail UI :8025
node scripts/en-engine-smoke.mjs --compose                  # or --base/--mailpit for a running stack
```

The smoke test signs up by email, reads the confirmation from Mailpit, confirms, logs in, opens
the workspace and `/my`, and checks routing, the honeypot and that no Cyrillic is served.

## Seeds

`db/schema.sql` (tables), `db/seed-my.sql` (cabinet metadata: types, roles, cabinet reports; no
user records) and `db/seed-en.sql` (English workspace template with roles, menus and reports) were
generated from the production metadata of the Russian edition and translated.

The template also carries a starter set (ids 500+): Tasks, Projects, Customers, Contacts and Deals
with demo records, the reports the calendar reads by name (`Calendar tasks`, `All task statuses`,
`All task types`, `Assignees`), `Sales pipeline`, `User reports` / `User forms` (main page) and two
kanban boards (Settings records `kanban<table id>`, type `KANBAN`). On sign-up `newDb()` assigns the
demo tasks to the new owner and moves the demo dates (anchored at Monday 2026-01-05) to the current
week. `INSERT IGNORE` does not update rows of an already installed `en` table: to refresh the
template on an existing server, `DROP TABLE en` and re-run `php install.php` (workspaces are copies
and stay untouched).

## Known limits

- Vendor libraries (`js/xlsx*.js`, `js/core.js`, `ace/emmet.js`) contain Cyrillic inside third-party
  code (codepage tables, lorem dictionaries); listed in `tests/en-guard-allowlist.json`.
- `/dash/<id>` opens a financial/KPI model built on a `Dashboard` table; the template has none, so
  `/dash` explains this and links to the tables, calendar and boards.
- Workspace templates (`templates/*.html`) go through the engine's template parser: a braced word
  such as `{name}` outside a `<!-- Begin: X -->` block is an insertion point and blanks the whole
  page when it has no data (`tests/en-engine.test.mjs` guards the workspace pages).
