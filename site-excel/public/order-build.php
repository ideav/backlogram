<?php
/**
 * Мост «подтверждённая заявка → сборщик → письмо клиенту» на лендинге (#624).
 *
 * Протокол (claim / deliver / fail / status, авторизация, идемпотентность) —
 * общий с ideav.ru, он в intake-build.php. Здесь только то, что относится к
 * этому хосту: токен зовётся ORDER_BUILD_TOKEN (у каждого сайта свой — очереди
 * раздельные, и токен одного сайта не должен открывать чужую), заявки видны
 * такими, какими их составляет order.php, а сигнал об ошибке идёт тем же ботом,
 * которым лендинг доставляет заявки.
 *
 * Отличие от ideav.ru: файлы заявки сборщику отсюда не выдаются. На лендинге
 * нет загрузки в GitHub — таблицы клиента приходят оператору в Telegram (спул
 * order-lib.php), и сборщик берёт их там же. В заявке остаются имена файлов,
 * чтобы было видно, что искать.
 *
 * Токен живёт только в окружении (или в order-config.php, которого нет в git).
 * Не задан — 503 и ничего не делаем: открытым мост не бывает.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/order-intake.php';
require_once __DIR__ . '/intake-build.php';

/** Что видит сборщик в claim: заявка лендинга целиком, без токена. */
function intake_build_job_view(array $record): array {
    $files = [];
    foreach ((array) ($record['files'] ?? []) as $file) {
        $files[] = ['name' => (string) ($file['name'] ?? ''), 'size' => (int) ($file['size'] ?? 0)];
    }
    return [
        'id'           => (string) $record['id'],
        'source'       => (string) ($record['source'] ?? 'excel-to-app-landing'),
        'site'         => (string) ($record['site'] ?? 'excel-to-app.ru'),
        'kind'         => (string) ($record['kind'] ?? 'demo'),
        'contact'      => (string) ($record['contact'] ?? ''),
        'subject'      => (string) ($record['subject'] ?? ''),
        // Текст заявки целиком: issue в GitHub здесь нет, и всё, что написал
        // человек, сборщик читает только отсюда.
        'body'         => (string) ($record['body'] ?? ''),
        'files'        => $files,
        'files_via'    => $files ? 'telegram' : '',
        'confirmed_at' => (int) ($record['confirmed_at'] ?? 0),
    ];
}

/** Сигнал оператору о неудавшейся сборке — в тот же чат, куда падают заявки. */
function intake_build_alert(string $requestId, string $contact, string $reason): void {
    order_deliver_message(
        "Сборка не удалась\n"
        . 'Заявка: ' . $requestId . "\n"
        . 'Контакт: ' . $contact . "\n"
        . 'Причина: ' . $reason
    );
}

intake_build_run(order_queue_dir(), 'ORDER_BUILD_TOKEN');
