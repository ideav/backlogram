# Integram EN: one image with the static marketing site (dist-en) and the PHP engine in one web root.
# Build context = repository root (see site-en/docker-compose.yml); run `npm run build:en` first.
FROM php:8.2-apache

RUN docker-php-ext-install mysqli \
    && cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && a2enmod rewrite headers

WORKDIR /var/www/html
COPY dist-en/ /var/www/html/
COPY site-en/public/.htaccess /var/www/html/.htaccess
COPY site-en/engine/ /var/www/html/
COPY site-en/docker/apache.conf /etc/apache2/sites-available/000-default.conf
COPY site-en/docker/entrypoint.sh /usr/local/bin/integram-entrypoint

RUN rm -f /var/www/html/.env \
    && mkdir -p logs download templates/custom/my templates/custom/en \
    && chown -R www-data:www-data logs download templates/custom \
    && chmod +x /usr/local/bin/integram-entrypoint

ENTRYPOINT ["integram-entrypoint"]
CMD ["apache2-foreground"]
