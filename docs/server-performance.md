# Server performance — HTTP/2 + caching (ideav.ru)

These are the two technical-SEO items that need **server access** to
`92.242.60.37` (the Apache host that serves `ideav.ru`). The caching half also
ships automatically via `public/.htaccess`; this doc covers the parts that
`.htaccess` cannot do, plus the vhost-level equivalents.

## 1. Enable HTTP/2

The site currently answers `HTTP/1.1` (`curl -sI https://ideav.ru/` →
`HTTP/1.1 200`). HTTP/2 multiplexes the SPA's many asset requests over one
connection and is a confirmed performance signal.

```apache
# In the HTTPS vhost (or globally). Requires the mpm_event MPM —
# mod_http2 does not work with mpm_prefork.
sudo a2enmod http2
# ensure event MPM (not prefork):
sudo a2dismod mpm_prefork ; sudo a2enmod mpm_event

# inside <VirtualHost *:443> for ideav.ru:
Protocols h2 http/1.1
```

```bash
sudo apachectl configtest && sudo systemctl reload apache2
# verify:
curl -sI --http2 https://ideav.ru/ | head -1   # → HTTP/2 200
```

> If PHP runs via mod_php it forces mpm_prefork (blocks HTTP/2). Switch PHP to
> PHP-FPM (`php-fpm` + `mod_proxy_fcgi`) so the event MPM can be used.

## 2. Caching — vhost fallback

Caching ships in `public/.htaccess` (deployed to the web root). It only applies
if the vhost allows overrides:

```apache
<Directory /var/www/ideav.ru>   # adjust to the real docroot
    AllowOverride FileInfo
</Directory>
```

If you prefer to keep `AllowOverride None`, drop the `.htaccess` body into the
vhost directly (same `mod_headers` / `mod_deflate` / `mod_brotli` blocks) and
delete `public/.htaccess`.

Verify after deploy:

```bash
curl -sI https://ideav.ru/assets/index-*.js | grep -i cache-control
#   → cache-control: public, max-age=31536000, immutable
curl -sI https://ideav.ru/ | grep -i cache-control
#   → cache-control: public, max-age=0, must-revalidate
```
