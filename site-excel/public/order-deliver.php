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

// В CLI вебрут — это каталог самого скрипта. Ставится до подключения
// библиотек: от него считаются каталоги спула и очереди.
//
// ВАЖНО: именно empty(), а не `?? __DIR__`. PHP CLI не оставляет
// DOCUMENT_ROOT незаданным — он кладёт туда ПУСТУЮ СТРОКУ, а `??`
// срабатывает только на null. С `??` спул считался от «», получался путь
// `/tg-spool`, его не существовало, и скрипт молча выходил с кодом 0.
// Из-за этого крон лендинга не разбирал спул с 16.09.2026 по 03.10.2026 —
// без единой строчки в логе.
if (empty($_SERVER['DOCUMENT_ROOT'])) {
    $_SERVER['DOCUMENT_ROOT'] = __DIR__;
}

require_once __DIR__ . '/order-lib.php';
// Очередь подтверждений (#624). Файлов может не быть, если контур на этот
// хост ещё не выложен, — тогда крон занимается только спулом, как раньше.
$order_intake = __DIR__ . '/order-intake.php';
if (is_file($order_intake)) {
    require_once $order_intake;
}
// Сторож зависших заявок живёт в intake-mail.php, а его подключает
// order-intake.php (ему нужен intake_config() поверх order_config(), и
// в одиночку intake-mail.php на лендинге не загрузится). Поэтому ниже —
// проверка function_exists: без контура #624 крон работает как раньше.

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
    // Не молча: каталог спула создаётся при первой заявке, но его отсутствие
    // вместе с посчитанным «не туда» путём — ровно тот случай, который две
    // недели оставался незамеченным. Пусть будет видно в логе крона.
    echo date('c') . " order-deliver: каталога спула нет: $spool"
        . " expired=$expired spooled=$spooled\n";
    exit(0);
}

$delivered = 0;
$left = 0;
$alerted = 0;
foreach (glob($spool . '/*', GLOB_ONLYDIR) ?: [] as $dir) {
    if (order_spool_deliver($dir)) {
        order_spool_cleanup($dir);
        $delivered++;
        continue;
    }
    $left++;
    $meta = json_decode((string) @file_get_contents($dir . '/meta.json'), true);
    // Сторож из intake-mail.php: заявка висит дольше порога — письмо оператору
    // один раз. Почтой, а не в Telegram: это Telegram и не работает.
    if (is_array($meta) && function_exists('intake_spool_alert')
        && intake_spool_alert($dir, $meta, 'excel-to-app.ru')) {
        $alerted++;
    }
}

if ($delivered || $left || $expired || $spooled) {
    echo date('c') . " delivered=$delivered left=$left alerted=$alerted"
        . " expired=$expired spooled=$spooled\n";
}
