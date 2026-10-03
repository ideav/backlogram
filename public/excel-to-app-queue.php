<?php
/**
 * Обслуживание очереди заявок (cron, issue #624).
 *
 * Делает две вещи, которые нельзя сделать в момент запроса:
 *   1. Удаляет неподтверждённые заявки с истёкшим TTL вместе с файлами — ровно
 *      то, что обещано клиенту в письме-подтверждении («не подтвердите —
 *      удалим»), и заодно не даёт очереди расти от спама.
 *   2. Добирает публикацию подтверждённых заявок, у которых она не удалась:
 *      GitHub и Telegram с этого хоста отваливаются регулярно (ровно из-за
 *      этого у лендинга excel-to-app.ru есть order-deliver.php), а заявка
 *      подтверждена и оплачена вниманием клиента — терять её нельзя.
 *
 * Только CLI. Строка крона (каждые 10 минут):
 *   «*&#47;10 * * * * php /path/to/webroot/excel-to-app-queue.php»
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/intake-shared.php';
require_once __DIR__ . '/intake-queue.php';
require_once __DIR__ . '/intake-publish.php';

$config_file = __DIR__ . '/telegram-config.php';
if (file_exists($config_file)) {
    require_once $config_file;
}

// В CLI вебрут — это каталог самого скрипта. Именно empty(), а не
// `?? __DIR__`: PHP CLI кладёт в DOCUMENT_ROOT пустую строку, а `??`
// срабатывает только на null, и каталог очереди считался бы от «».
// Пока INTAKE_QUEUE_DIR задан явно, это незаметно — и ровно поэтому
// такое живёт годами (см. order-deliver.php, где не задан).
if (empty($_SERVER['DOCUMENT_ROOT'])) {
    $_SERVER['DOCUMENT_ROOT'] = __DIR__;
}

$queueDir = intake_queue_dir();
if (!is_dir($queueDir)) {
    exit(0); // очереди ещё нет — нечего обслуживать
}

$purged = intake_queue_purge($queueDir);

$republished = 0;
$stillBroken = 0;
foreach (intake_queue_list($queueDir, INTAKE_STATUS_CONFIRMED) as $id) {
    $record = intake_queue_load($queueDir, $id);
    if ($record === null || empty($record['publish_error'])) {
        continue;
    }
    $published = intake_publish_order([
        'id'           => $id,
        'source_label' => (string) ($record['source_label'] ?? 'Excel → приложение'),
        'name'         => (string) ($record['name'] ?? ''),
        'company'      => (string) ($record['company'] ?? ''),
        'contact'      => (string) ($record['contact'] ?? ''),
        'topic'        => (string) ($record['topic'] ?? ''),
        'confirmed'    => true,
    ], intake_queue_files($queueDir, $id));

    if ($published['ok']) {
        intake_queue_mark($queueDir, $id, null, [
            'issue_url'     => $published['issue_url'],
            'issue_number'  => $published['issue_number'],
            'attachments'   => $published['attachments'],
            'publish_error' => null,
        ]);
        $republished++;
    } else {
        $stillBroken++;
        error_log('excel-to-app-queue: публикация ' . $id . ' снова не удалась: ' . (string) ($published['error'] ?? ''));
    }
}

if ($purged['expired'] || $purged['purged'] || $republished || $stillBroken) {
    printf(
        "%s expired=%d purged=%d republished=%d broken=%d\n",
        date('c'),
        $purged['expired'],
        $purged['purged'],
        $republished,
        $stillBroken
    );
}
