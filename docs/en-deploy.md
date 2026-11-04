# Deploying the English site (ideav.pro)

Issue #526 (epic #524). The web root on the host is the union of two trees:

- `dist-en/` - the static marketing site (`npm run build:en`), prerendered as `<route>/index.html`;
- `site-en/engine/` - the PHP engine (auth at `/start`, cabinet `/my`, forms), owned by the engine stream.

Apache serves existing files/directories as they are and sends everything else to the
engine `index.php` (`.htaccess` comes from `site-en/public/.htaccess` into `dist-en/`).
`DirectoryIndex index.html index.php`.

## One-command deploy

```bash
export EN_SITE_URL=https://ideav.pro                # scheme + host the static pages are built for
export EN_DEPLOY_HOST=ideav.pro
export EN_DEPLOY_USER=root
export EN_DEPLOY_PATH=/var/www/ideav.pro               # the web root
export EN_CONTACT_EMAIL=support@ideav.pro             # there is no hello@ mailbox on ideav.pro
# optional: EN_DEPLOY_SSH_PORT, EN_DEPLOY_SSH_KEY, EN_DEPLOY_PHP
# after an upload as root: ssh root@ideav.pro 'chown -R apache:apache /var/www/ideav.pro'

bash scripts/en-deploy.sh --dry-run            # show what would change
bash scripts/en-deploy.sh                      # build + upload
bash scripts/en-deploy.sh --install            # + `php install.php` on the server (first deploy / schema changes)
bash scripts/en-deploy.sh --no-build           # reuse the existing dist-en/
```
(`npm run deploy:en -- --dry-run` is the same.) Needs `rsync`, `ssh`, `node` locally (Git Bash on Windows works if rsync is installed).

What the script does:
1. `SITE_URL=$EN_SITE_URL npm run build:en` -> `dist-en/` (canonical URLs, sitemap, contact address); with `--no-build` it checks that `dist-en/` was built for `EN_SITE_URL`.
2. Assembles a temporary release dir = `dist-en/*` + `site-en/engine/*`, excluding `.env*`, `tests/`, `docker-compose*.yml`, `Dockerfile*`, `.git`, `node_modules`.
3. Scans the release dir with the guard rules (Cyrillic, `*.ru`, Yandex, ...); any hit aborts the deploy.
4. `rsync -rlptvz --delete` over SSH. Server-side state is never touched or deleted: `.env`, `.env.*`, `config.local.php`, `config/local*`, `order-config.php`, `uploads/`, `storage/`, `logs/`, `*.log`. Put such files there on the server once; they survive every deploy. Runtime data of the engine is protected from `--delete`: `download/**` (uploaded files) and `templates/custom/**` (per-workspace templates, backups, logs); shipped files there are updated but never deleted.
5. With `--install`: `ssh ... 'cd $EN_DEPLOY_PATH && php install.php'`.

## Running a copy on another domain

Nothing in the code names a domain. The static pages get theirs from `EN_SITE_URL` at build time;
the PHP engine takes the host of each request (links in mails, OAuth callbacks, cookies, the
default sender `no-reply@<host>`). On the server set `INTEGRAM_ALLOWED_HOSTS=<domain>,www.<domain>`
in `.env` so a forged `Host` header cannot leak into password-reset links, register the OAuth
callbacks `https://<domain>/auth/google` and `https://<domain>/auth/github`, and set
`INTEGRAM_ADMIN_EMAIL` if you want sign-up notifications. `tests/en-engine.test.mjs` fails on any
literal domain in `site-en/engine` or `site-en/src`.

After deploy run the release gate: `node scripts/en-release-audit.mjs $EN_SITE_URL` and go through `docs/en-release-checklist.md`.

## Production host (ideav.pro)

Since 2026-11-04 the site runs on its own VPS (AlmaLinux 8, no control panel); the earlier copy on
integram-ai.online was removed (#526). The server runs nothing but this site.

- Apache 2.4 + `mod_ssl` + php-fpm 8.2 (`php:8.2` module stream) + MySQL 8.0, all from the distro repos.
- Web root: `/var/www/ideav.pro`, owner `apache`. Vhost: `/etc/httpd/conf.d/ideav.pro.conf` (port 80 -> `https://ideav.pro` in one 301)
  and `ideav.pro-le-ssl.conf` (written by certbot); `AllowOverride All` so the site `.htaccess` applies.
- MySQL: database `integram_ai`, user `integram_ai@localhost` (the name stayed from the first host).
- Server-only config (chmod 600, owner `apache`, kept by the deploy): `.env` in the web root (engine: DB, salt, SMTP, base URL,
  OAuth) and `order-config.php` (lead form: to `support@ideav.pro`, from `no-reply@ideav.pro`).
- Mail out: local postfix, send-only on loopback, DKIM via opendkim (selector `mail`, key in `/etc/opendkim/keys/ideav.pro/`).
  The engine talks to `127.0.0.1:25` without AUTH (`INTEGRAM_SMTP_PASSWORD` empty), sender `no-reply@ideav.pro`, reply-to `support@ideav.pro`.
- Mail in: the `ideav.pro` mailboxes (`support@` and others) live on a separate mail host (`MX mail.ideav.pro`), not on this VPS.
  That host's exim rejects unauthenticated mail with an `@ideav.pro` sender unless the sending IP is in `relay_from_hosts`,
  so the web VPS IP is listed there (in both `exim4.conf.template` and the panel's `exim4.conf.templater`).
- TLS: Let's Encrypt via `certbot --apache -d ideav.pro -d www.ideav.pro`, renewed by `certbot-renew.timer`.
- DNS resolvers are pinned in NetworkManager (`nmcli con mod "System eth0" ipv4.dns ...`): after a hostname change the generated
  `/etc/resolv.conf` came up without nameservers and certbot could not reach Let's Encrypt.

## Host requirements (any provider outside the RF)

- **PHP 8.1+** with `mysqli`, `curl`, `mbstring`, `openssl` (and `json`, `ctype`, `fileinfo`, which are on by default). `display_errors=Off`, `expose_php=Off`.
- **MySQL 8** (utf8mb4). One DB user able to create databases: each user's workspace is its own DB, and the cabinet DB is `my`.
- **Apache 2.4** with `mod_rewrite`, `mod_headers`, `AllowOverride All` for the web root (so `.htaccess` applies).
  nginx equivalent:
  ```nginx
  server {
    listen 443 ssl http2;
    server_name ideav.pro;
    root /var/www/ideav.pro;
    index index.html index.php;
    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
      include fastcgi_params;
      fastcgi_pass unix:/run/php/php8.1-fpm.sock;
      fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
    location ~ /\.(env|git|ht) { deny all; }
  }
  server { listen 80; server_name ideav.pro www.ideav.pro; return 301 https://ideav.pro$request_uri; }
  server { listen 443 ssl http2; server_name www.ideav.pro; return 301 https://ideav.pro$request_uri; }
  ```
- **HTTPS** via Let's Encrypt (`certbot --apache -d <domain> -d www.<domain>`), auto-renewal timer on; HTTP -> HTTPS and `www` -> bare in one 301; HSTS header recommended.
- **SMTP** for confirmation mails and the contact form (from `no-reply@<domain>`): relay credentials, if any, go into the server `.env`. SPF/DKIM/DMARC as in the checklist.
- **Cron**: only if the engine stream documents scheduled jobs (mail queue, cleanup); install them with the deploy user's crontab and note them here.
- **Server `.env`**: DB credentials, SMTP, GitHub/Google OAuth client id/secret, contact email. Created once by hand, never uploaded.

### DNS records
| Record | Name | Value |
|---|---|---|
As set for ideav.pro:

| Record | Name | Value |
|---|---|---|
| A | `ideav.pro`, `www.ideav.pro` | web VPS IP |
| MX | `ideav.pro` | `10 mail.ideav.pro.` (separate mail host, keep as is) |
| TXT (SPF) | `ideav.pro` | `v=spf1 ip4:<mail host IP> ip4:<web VPS IP> mx ~all` |
| TXT (DKIM) | `mail._domainkey.ideav.pro` | `/etc/opendkim/keys/ideav.pro/mail.txt` on the web VPS |
| TXT (DMARC) | `_dmarc.ideav.pro` | `v=DMARC1; p=none; rua=mailto:support@ideav.pro` |
| PTR | web VPS IP | `ideav.pro` (set at the VPS provider, not in the zone) |
| CAA (optional) | `ideav.pro` | `0 issue "letsencrypt.org"` |

## Docker Compose option

The engine stream ships `site-en/docker-compose.yml` (PHP-Apache + MySQL) for local runs and for hosts that prefer containers.
Mount or copy the same release dir (`dist-en/` + `site-en/engine/`) as the web root of the PHP container; the compose files are not part of the uploaded release.
For a VPS: install Docker, copy the release dir and the compose file, keep `.env` next to the compose file, put the host's reverse proxy (Caddy/nginx with Let's Encrypt) in front, then `docker compose up -d` and `docker compose exec web php install.php`.

## Rollback
rsync is idempotent: check out the previous commit, `bash scripts/en-deploy.sh` again. Back up the database before running `--install` on a live site.
