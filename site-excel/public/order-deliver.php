<?php
/**
 * Доставщик очереди заявок (cron, issue #596).
 *
 * Пробегает каталог-очередь (см. order-lib.php: заявки, которые не удалось
 * доставить в Telegram сразу из-за нестабильного канала) и ретраит доставку.
 * Доставленные каталоги удаляются; недоставленные остаются до следующего
 * запуска. Заявки старше 14 дней считаются зависшими и логируются.
 *
 * Запуск только из CLI (cron), не через веб; строка крона (каждые 5 минут):
 *   «*&#47;5 * * * * php /path/to/webroot/order-deliver.php»
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/order-lib.php';

// В CLI нет DOCUMENT_ROOT — вебрут это каталог самого скрипта.
$_SERVER['DOCUMENT_ROOT'] = $_SERVER['DOCUMENT_ROOT'] ?? __DIR__;

$spool = order_spool_dir();
if (!is_dir($spool)) {
    exit(0); // очередь пуста — нечего делать
}

$delivered = 0;
$left = 0;
foreach (glob($spool . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
    if (order_spool_deliver($dir)) {
        order_spool_cleanup($dir);
        $delivered++;
        continue;
    }
    $left++;
    $meta = json_decode((string) @file_get_contents($dir . '/meta.json'), true);
    if (is_array($meta) && time() - (int) ($meta['created'] ?? 0) > 14 * 86400) {
        error_log('order-deliver: заявка висит больше 14 дней: ' . $dir);
    }
}

if ($delivered || $left) {
    echo date('c') . " delivered=$delivered left=$left\n";
}
