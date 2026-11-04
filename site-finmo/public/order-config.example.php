<?php
// Скопируйте в order-config.php (рядом с order.php) и заполните.
// order-config.php в git не входит. Окружение (getenv) важнее этого файла.
define('TELEGRAM_BOT_TOKEN', '');   // токен бота для уведомления
define('TELEGRAM_CHAT_ID', '');     // чат, куда падают заявки
define('ORDER_EMAIL_TO', '');       // почта для дубля уведомления
define('ORDER_EMAIL_FROM', '');     // отправитель; пусто — welcome@ideav.ru
define('TELEGRAM_API_BASE', '');    // необязательно: прокси к Bot API
