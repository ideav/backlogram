# Deploying the English site (integram-ai.online)

Issue #526 (epic #524). The web root on the host is the union of two trees:

- `dist-en/` - the static marketing site (`npm run build:en`), prerendered as `<route>/index.html`;
- `site-en/engine/` - the PHP engine (auth at `/start`, cabinet `/my`, forms), owned by the engine stream.

Apache serves existing files/directories as they are and sends everything else to the
engine `index.php` (`.htaccess` comes from `site-en/public/.htaccess` into `dist-en/`).
`DirectoryIndex index.html index.php`.

## One-command deploy

```bash
export EN_SITE_URL=https://integram-ai.online       # scheme + host the static pages are built for
export EN_DEPLOY_HOST=host.example.com
export EN_DEPLOY_USER=deploy
export EN_DEPLOY_PATH=/var/www/integram-ai.online      # the web root
# optional: EN_CONTACT_EMAIL (default hello@<host>), EN_DEPLOY_SSH_PORT, EN_DEPLOY_SSH_KEY, EN_DEPLOY_PHP

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

## Production host (integram-ai.online)

The site is a separate ispmanager web domain on the shared server (the one that also runs other sites; never touch their vhosts, roots or DBs):

- Web domain `integram-ai.online` (alias `www.integram-ai.online`), owner `www-root`, PHP 8.3 (CGI, native) with mysqli/curl/mbstring/openssl.
- Web root: `/var/www/www-root/data/www/integram-ai.online` (`EN_DEPLOY_USER=www-root`, `EN_DEPLOY_PATH` = this path).
- Extra vhost config: `/etc/apache2/vhosts-resources/integram-ai.online/integram-ai-extra.conf` (www -> bare 301, `AllowOverride All`, `DirectoryIndex index.html index.php`); it is included by the panel-generated vhost and survives panel regeneration.
- MySQL: database `integram_ai`, user `integram_ai@localhost` (created via the panel, utf8mb4).
- Server-only config (chmod 600, owner `www-root`, kept by the deploy): `.env` in the web root (engine: DB, salt, SMTP, base URL, OAuth) and `order-config.php` (lead form recipient).
- Mail: mailbox `abc@integram-ai.online` on the same host (exim/dovecot, ispmanager email domain with DKIM). The engine sends through `localhost:25` with SMTP AUTH as that mailbox (no STARTTLS: the local exim certificate is self-signed and PHP would reject it).
- TLS: Let's Encrypt via ispmanager (`integram-ai.online_le*`), issued once the A records point to the host.

## Host requirements (any provider outside the RF)

- **PHP 8.1+** with `mysqli`, `curl`, `mbstring`, `openssl` (and `json`, `ctype`, `fileinfo`, which are on by default). `display_errors=Off`, `expose_php=Off`.
- **MySQL 8** (utf8mb4). One DB user able to create databases: each user's workspace is its own DB, and the cabinet DB is `my`.
- **Apache 2.4** with `mod_rewrite`, `mod_headers`, `AllowOverride All` for the web root (so `.htaccess` applies).
  nginx equivalent:
  ```nginx
  server {
    listen 443 ssl http2;
    server_name integram-ai.online;
    root /var/www/integram-ai.online;
    index index.html index.php;
    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
      include fastcgi_params;
      fastcgi_pass unix:/run/php/php8.1-fpm.sock;
      fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
    location ~ /\.(env|git|ht) { deny all; }
  }
  server { listen 80; server_name integram-ai.online www.integram-ai.online; return 301 https://integram-ai.online$request_uri; }
  server { listen 443 ssl http2; server_name www.integram-ai.online; return 301 https://integram-ai.online$request_uri; }
  ```
- **HTTPS** via Let's Encrypt (`certbot --apache -d integram-ai.online -d www.integram-ai.online`), auto-renewal timer on; HTTP -> HTTPS and `www` -> bare in one 301; HSTS header recommended.
- **SMTP** for confirmation mails and the contact form (from `abc@integram-ai.online`): relay credentials go into the server `.env`. SPF/DKIM/DMARC as in the checklist.
- **Cron**: only if the engine stream documents scheduled jobs (mail queue, cleanup); install them with the deploy user's crontab and note them here.
- **Server `.env`**: DB credentials, SMTP, GitHub/Google OAuth client id/secret, contact email. Created once by hand, never uploaded.

### DNS records
| Record | Name | Value |
|---|---|---|
| A (and AAAA) | `integram-ai.online` | host IP |
| CNAME or A | `www.integram-ai.online` | `integram-ai.online` / host IP |
| MX | `integram-ai.online` | `10 integram-ai.online.` (mailbox on the web host) |
| TXT (SPF) | `integram-ai.online` | `v=spf1 ip4:<host IP> a mx ~all` |
| TXT (DKIM) | `dkim._domainkey.integram-ai.online` | public key from ispmanager (Mail -> Mail domains) |
| TXT (DMARC) | `_dmarc.integram-ai.online` | `v=DMARC1; p=none; rua=mailto:abc@integram-ai.online` |
| CAA (optional) | `integram-ai.online` | `0 issue "letsencrypt.org"` |

## Docker Compose option

The engine stream ships `site-en/docker-compose.yml` (PHP-Apache + MySQL) for local runs and for hosts that prefer containers.
Mount or copy the same release dir (`dist-en/` + `site-en/engine/`) as the web root of the PHP container; the compose files are not part of the uploaded release.
For a VPS: install Docker, copy the release dir and the compose file, keep `.env` next to the compose file, put the host's reverse proxy (Caddy/nginx with Let's Encrypt) in front, then `docker compose up -d` and `docker compose exec web php install.php`.

## Rollback
rsync is idempotent: check out the previous commit, `bash scripts/en-deploy.sh` again. Back up the database before running `--install` on a live site.
