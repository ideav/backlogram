#!/bin/sh
set -e
cd /var/www/html
# Create/seed the `my` and `en` tables (idempotent; waits for the database to come up).
INTEGRAM_INSTALL_WAIT="${INTEGRAM_INSTALL_WAIT:-60}" php install.php
chown -R www-data:www-data logs download templates/custom
exec "$@"
