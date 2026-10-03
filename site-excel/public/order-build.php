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
 * Отличие от ideav.ru: GitHub тут нет, и ссылок на вложения в заявке не будет.
 * Файлы лежат в самой очереди и выдаются сборщику действием `file` моста —
 * по порядковому номеру из claim (`files[].index`). Раньше их удаляли сразу
 * после доставки оператору, и заявку с лендинга нельзя было собрать
 * автоматически; теперь они живут до `deliver`/`fail`.
 *
 * `files_via` говорит сборщику, где брать: `bridge` — здесь, по токену;
 * `telegram` — файлы были, но уже удалены (сборка кончилась или заявку
 * дорабатывает человек), и искать их надо в чате оператора.
 *
 * Токен живёт только в окружении (или в order-config.php, которого нет в git).
 * Не задан — 503 и ничего не делаем: открытым мост не бывает.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/order-intake.php';
require_once __DIR__ . '/intake-build.php';

/** Что видит сборщик в claim: заявка лендинга целиком, без токена. */
function intake_build_job_view(array $record): array {
    // Индекс — то, чем сборщик просит файл у действия `file`. Нумерация с 1 и
    // совпадает с порядком intake_queue_files(), поэтому здесь берётся та же
    // функция, а не список имён из записи: если файла на диске уже нет,
    // сборщику незачем знать его номер.
    $onDisk = intake_queue_files(order_queue_dir(), (string) $record['id']);
    $files  = [];
    foreach ($onDisk as $i => $file) {
        $files[] = [
            'index' => $i + 1,
            'name'  => (string) $file['name'],
            'size'  => (int) @filesize($file['path']),
        ];
    }
    // Имена файлов, которые были в заявке, нужны и когда самих файлов уже нет:
    // по ним оператор найдёт их в чате.
    $known = [];
    foreach ((array) ($record['files'] ?? []) as $file) {
        $known[] = (string) ($file['name'] ?? '');
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
        'file_names'   => $known,
        'files_via'    => $files ? 'bridge' : ($known ? 'telegram' : ''),
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
