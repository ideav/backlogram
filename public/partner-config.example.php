<?php
// Скопировать в partner-config.php (в git не попадает) и задать значения.
// Каталог данных — ВНЕ вебрута: materials.json, links-cache.json, events.jsonl (очередь).
define('PARTNER_DATA_DIR', '/var/www/partner-data');
// API базы my: ссылки и события партнёров живут в её таблицах (их читает кабинет).
define('PARTNER_API_URL', 'https://ideav.ru/my');
// Токен пользователя my с правом записи в «Ссылку партнёра» и «Событие партнёра».
define('PARTNER_API_TOKEN', '');
