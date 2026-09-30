<?php
/**
 * Мост «подтверждённая заявка → сборщик → письмо клиенту» на ideav.ru (#624).
 *
 * Сам протокол (claim / deliver / fail / status, авторизация, идемпотентность)
 * живёт в intake-build.php — он общий с лендингом excel-to-app.ru. Здесь
 * только то, что относится именно к этому сайту: канал сигнала оператору.
 *
 * Токен моста живёт только в окружении (INTAKE_BUILD_TOKEN). Не задан —
 * эндпоинт отвечает 503 и ничего не делает: открытым он не бывает.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/intake-shared.php';
require_once __DIR__ . '/intake-build.php';

// Optional config file with define()s (git-ignored). Environment still wins.
$config_file = __DIR__ . '/telegram-config.php';
if (file_exists($config_file)) {
    require_once $config_file;
}

/** Сигнал оператору о неудавшейся сборке — в тот же чат, куда падают заявки. */
function intake_build_alert(string $requestId, string $contact, string $reason): void {
    $botToken = (string) intake_config('TELEGRAM_BOT_TOKEN', '');
    $chatId   = (string) intake_config('TELEGRAM_CHAT_ID', '');
    if ($botToken === '' || $chatId === '') {
        return;
    }
    $message = "*Сборка не удалась*\n"
        . '🆔 ' . intake_escape_markdown($requestId) . "\n"
        . '📬 ' . intake_escape_markdown($contact) . "\n"
        . '⚠️ ' . intake_escape_markdown($reason);
    intake_telegram_send_message($botToken, $chatId, $message, (string) intake_config('TELEGRAM_API_BASE', 'https://api.telegram.org'));
}

intake_build_run(intake_queue_dir());
