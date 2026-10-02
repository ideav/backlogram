<?php
/**
 * Доставщик очереди заявок (cron, issue #596).
 *
 * Пробегает каталог-очередь (см. order-lib.php: заявки, которые не удалось
 * доставить в Telegram сразу из-за нестабильного канала) и ретраит доставку.
 * Доставленные каталоги удаляются; недоставленные остаются до следующего
 * запуска. Заявки старше 14 дней считаются зависшими и логируются.
 *
 * С issue #624 здесь же обслуживается очередь подтверждений
 * (order-intake.php): неподтверждённые заявки с истёкшим TTL удаляются вместе
 * с файлами клиента — как обещано в письме, — а подтверждённые, которые не
 * удалось передать оператору, доставляются повторно. Оба дела делаются в одном
 * кроне, потому что оба про «дошло или нет», и второй крон был бы лишним.
 *
 * Запуск только из CLI (cron), не через веб; строка крона (каждые 5 минут):
 *   «*&#47;5 * * * * php /path/to/webroot/order-deliver.php»
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

// В CLI нет DOCUMENT_ROOT — вебрут это каталог самого скрипта. Ставится до
// подключения библиотек: от него считаются каталоги очередей.
$_SERVER['DOCUMENT_ROOT'] = $_SERVER['DOCUMENT_ROOT'] ?? __DIR__;

require_once __DIR__ . '/order-lib.php';
// Очередь подтверждений (#624). Файлов может не быть, если контур на этот
// хост ещё не выложен, — тогда крон занимается только спулом, как раньше.
$order_intake = __DIR__ . '/order-intake.php';
if (is_file($order_intake)) {
    require_once $order_intake;
}

// ── Очередь подтверждений: просроченные удалить, подтверждённые дослать ──────
$expired = 0;
$spooled = 0;
if (function_exists('order_queue_dir')) {
    $queueDir = order_queue_dir();
    $counts   = intake_queue_purge($queueDir);
    $expired  = $counts['expired'];

    // Подтверждённые заявки, которые не дошли до оператора (Telegram лежал,
    // спул был недоступен). Статус трогать нельзя: он нужен сборщику — метим
    // только признак доставки оператору.
    foreach (array_merge(
        intake_queue_list($queueDir, INTAKE_STATUS_CONFIRMED),
        intake_queue_list($queueDir, INTAKE_STATUS_BUILDING)
    ) as $id) {
        $record = intake_queue_load($queueDir, $id);
        if ($record === null || !empty($record['spooled'])) {
            continue;
        }
        if (order_confirm_publish($queueDir, $id)) {
            $spooled++;
        }
    }
}

$spool = order_spool_dir();
if (!is_dir($spool)) {
    if ($expired || $spooled) {
        echo date('c') . " expired=$expired spooled=$spooled\n";
    }
    exit(0); // спул пуст — остальное сделано
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

if ($delivered || $left || $expired || $spooled) {
    echo date('c') . " delivered=$delivered left=$left expired=$expired spooled=$spooled\n";
}
