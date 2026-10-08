# Deploying the English site (ideav.pro)

Issue #526 (epic #524). The web root on the host is the union of two trees:

- `dist-en/` - the static marketing site (`npm run build:en`), prerendered as `<route>/index.html`;
- `site-en/engine/` - the PHP engine (auth at `/start`, cabinet `/my`, forms), owned by the engine stream.

Apache serves existing files/directories as they are and sends everything else to the
engine `index.php` (`.htaccess` comes from `site-en/public/.htaccess` into `dist-en/`).
`DirectoryIndex index.html index.php`.

## One-command deploy

```bash
export EN_DEPLOY_HOST=host.example.com
export EN_DEPLOY_USER=deploy
export EN_DEPLOY_PATH=/var/www/ideav.pro      # the web root
# optional: EN_DEPLOY_SSH_PORT, EN_DEPLOY_SSH_KEY, EN_DEPLOY_PHP

bash scripts/en-deploy.sh --dry-run            # show what would change
bash scripts/en-deploy.sh                      # build + upload
bash scripts/en-deploy.sh --install            # + `php install.php` on the server (first deploy / schema changes)
bash scripts/en-deploy.sh --no-build           # reuse the existing dist-en/
```
(`npm run deploy:en -- --dry-run` is the same.) Needs `rsync`, `ssh`, `node` locally (Git Bash on Windows works if rsync is installed).

What the script does:
1. `npm run build:en` -> `dist-en/`.
2. Assembles a temporary release dir = `dist-en/*` + `site-en/engine/*`, excluding `.env*`, `tests/`, `docker-compose*.yml`, `Dockerfile*`, `.git`, `node_modules`.
3. Scans the release dir with the guard rules (Cyrillic, `*.ru`, Yandex, ...); any hit aborts the deploy.
4. `rsync -rlptvz --delete` over SSH. Server-side state is never touched or deleted: `.env`, `.env.*`, `config.local.php`, `config/local*`, `uploads/`, `storage/`, `logs/`, `*.log`. Put such files there on the server once; they survive every deploy.
5. With `--install`: `ssh ... 'cd $EN_DEPLOY_PATH && php install.php'`.

After deploy run the release gate: `node scripts/en-release-audit.mjs https://ideav.pro` and go through `docs/en-release-checklist.md`.

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
- **HTTPS** via Let's Encrypt (`certbot --apache -d ideav.pro -d www.ideav.pro`), auto-renewal timer on; HTTP -> HTTPS and `www` -> bare in one 301; HSTS header recommended.
- **SMTP** for confirmation mails and the contact form (from `hello@ideav.pro`): relay credentials go into the server `.env`. SPF/DKIM/DMARC as in the checklist.
- **Cron**: only if the engine stream documents scheduled jobs (mail queue, cleanup); install them with the deploy user's crontab and note them here.
- **Server `.env`**: DB credentials, SMTP, GitHub/Google OAuth client id/secret, contact email. Created once by hand, never uploaded.

### DNS records
| Record | Name | Value |
|---|---|---|
| A (and AAAA) | `ideav.pro` | host IP |
| CNAME or A | `www.ideav.pro` | `ideav.pro` / host IP |
| MX | `ideav.pro` | mail host (non-RU) |
| TXT (SPF) | `ideav.pro` | `v=spf1 include:<mail provider> ~all` |
| TXT (DKIM) | `<selector>._domainkey.ideav.pro` | public key from the mail provider |
| TXT (DMARC) | `_dmarc.ideav.pro` | `v=DMARC1; p=none; rua=mailto:hello@ideav.pro` |
| CAA (optional) | `ideav.pro` | `0 issue "letsencrypt.org"` |

## Docker Compose option

The engine stream ships `site-en/docker-compose.yml` (PHP-Apache + MySQL) for local runs and for hosts that prefer containers.
Mount or copy the same release dir (`dist-en/` + `site-en/engine/`) as the web root of the PHP container; the compose files are not part of the uploaded release.
For a VPS: install Docker, copy the release dir and the compose file, keep `.env` next to the compose file, put the host's reverse proxy (Caddy/nginx with Let's Encrypt) in front, then `docker compose up -d` and `docker compose exec web php install.php`.

## Rollback
rsync is idempotent: check out the previous commit, `bash scripts/en-deploy.sh` again. Back up the database before running `--install` on a live site.
