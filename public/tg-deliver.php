<?php
/**
 * Доставщик очереди заявок основного сайта (cron, issue #598).
 *
 * Пробегает каталог-очередь (intake-shared.php: заявки, которые не удалось
 * доставить в Telegram сразу из-за нестабильного канала до прокси) и ретраит
 * доставку. Доставленные каталоги удаляются; недоставленные остаются до
 * следующего запуска. Заявки старше 14 дней логируются как зависшие.
 *
 * Запуск только из CLI (cron), каждые 5 минут:
 *   «*&#47;5 * * * * php /path/to/webroot/tg-deliver.php»
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/intake-shared.php';
// Секреты те же, что у telegram-notify.php — из telegram-config.php рядом.
$cfg = __DIR__ . '/telegram-config.php';
if (file_exists($cfg)) {
    require_once $cfg;
}

// В CLI нет DOCUMENT_ROOT — вебрут это каталог самого скрипта.
if (empty($_SERVER['DOCUMENT_ROOT'])) {
    $_SERVER['DOCUMENT_ROOT'] = __DIR__;
}

$spool = intake_spool_dir();
if (!is_dir($spool)) {
    exit(0);
}

$delivered = 0;
$left = 0;
foreach (glob($spool . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
    if (intake_spool_deliver($dir)) {
        intake_spool_cleanup($dir);
        $delivered++;
        continue;
    }
    $left++;
    $meta = json_decode((string) @file_get_contents($dir . '/meta.json'), true);
    if (is_array($meta) && time() - (int) ($meta['created'] ?? 0) > 14 * 86400) {
        error_log('tg-deliver: заявка висит больше 14 дней: ' . $dir);
    }
}

if ($delivered || $left) {
    echo date('c') . " delivered=$delivered left=$left\n";
}
