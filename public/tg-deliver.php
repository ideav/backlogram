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

// Сторож зависших заявок — письмом оператору (intake-mail.php).
require_once __DIR__ . '/intake-mail.php';

$spool = intake_spool_dir();
if (!is_dir($spool)) {
    // Не молча: каталога спула быть не должно, раз скрипт стоит в кроне.
    // Молчаливый exit(0) здесь уже стоил двух недель незамеченной поломки.
    echo date('c') . " tg-deliver: каталога спула нет: $spool\n";
    exit(0);
}

$delivered = 0;
$left = 0;
$alerted = 0;
foreach (glob($spool . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
    if (intake_spool_deliver($dir)) {
        intake_spool_cleanup($dir);
        $delivered++;
        continue;
    }
    $left++;
    $meta = json_decode((string) @file_get_contents($dir . '/meta.json'), true);
    if (is_array($meta) && intake_spool_alert($dir, $meta, 'ideav.ru')) {
        $alerted++;
    }
}

if ($delivered || $left) {
    echo date('c') . " delivered=$delivered left=$left alerted=$alerted\n";
}
