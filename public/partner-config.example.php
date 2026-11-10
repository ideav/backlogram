<?php
// Скопировать в partner-config.php (в git не попадает) и задать значения.
// Каталог данных — ВНЕ вебрута: links.json, materials.json, events.jsonl.
define('PARTNER_DATA_DIR', '/var/www/partner-data');
// Соль для хеша IP (случайная строка; сам IP не хранится).
define('PARTNER_IP_SALT', 'замените-на-случайную-строку');
