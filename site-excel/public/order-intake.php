<?php
/**
 * Контур подтверждения адреса на лендинге excel-to-app.ru (issue #624).
 *
 * Здесь связка между самостоятельным приёмом заявок лендинга (order.php,
 * order-lib.php: спул → Telegram) и общей библиотекой контура из вебрута
 * ideav.ru (intake-queue.php, intake-mail.php — лежат рядом сгенерированными
 * копиями, см. scripts/sync-excel-intake.mjs).
 *
 * Что меняется на лендинге: заявка вида **demo** с email-контактом больше не
 * уходит сразу в Telegram. Она ложится в очередь, клиенту уходит письмо со
 * ссылкой, и только переход по ссылке отправляет заявку оператору и открывает
 * её сборщику. Причина та же, что и на ideav.ru: сборку делает ИИ-агент, и
 * заявка без подтверждённого адреса — это оплаченная сборка на опечатку.
 *
 * Заявки razbor и express подтверждения не требуют: за ними нет автоматической
 * сборки, это обращение к человеку, и лишний шаг там только теряет лид.
 *
 * Конфигурация — теми же именами, что на ideav.ru (окружение или
 * order-config.php рядом):
 *   ORDER_CONFIRM_REQUIRED     выключатель (по умолчанию включено)
 *   ORDER_CONFIRM_MAX_PER_EMAIL  заявок на один адрес за сутки (3)
 *   ORDER_QUEUE_DIR            каталог очереди; ОБЯЗАН отличаться от каталога
 *                              очереди ideav.ru — сайты живут на одном хосте
 *   ORDER_CONFIRM_URL          база ссылки подтверждения
 *   INTAKE_CONFIRM_TTL         срок жизни ссылки, сек (86400)
 *   INTAKE_MAIL_*              отправитель и транспорт письма
 *   ORDER_BUILD_TOKEN          токен моста к сборщику
 */

if (!defined('ORDER_INTAKE_LOADED')) {
    define('ORDER_INTAKE_LOADED', true);

    require_once __DIR__ . '/order-lib.php';

    // Общая библиотека читает конфиг через intake_config(); на этом хосте
    // источник конфигурации — order_config() (окружение + order-config.php).
    if (!function_exists('intake_config')) {
        function intake_config(string $name, ?string $default = null): ?string {
            return order_config($name, $default);
        }
    }
    if (!function_exists('intake_config_flag')) {
        function intake_config_flag(string $name, bool $default = false): bool {
            $raw = (string) intake_config($name, $default ? '1' : '0');
            return in_array(strtolower($raw), ['1', 'true', 'yes', 'on'], true);
        }
    }

    // Страницы и ссылки общей библиотеки подписаны сайтом из конфига, а по
    // умолчанию там ideav.ru. На этом хосте по умолчанию — лендинг: человек
    // оставлял заявку здесь, сюда же должны вести «оставить заявку заново» и
    // подпись страницы. Окружение и order-config.php по-прежнему важнее.
    foreach ([
        'INTAKE_CONFIRM_FORM_URL' => 'https://excel-to-app.ru/',
        'INTAKE_SITE_URL'         => 'https://excel-to-app.ru',
    ] as $name => $value) {
        if (order_config($name) === null) {
            define($name, $value);
        }
    }

    require_once __DIR__ . '/intake-queue.php';
    require_once __DIR__ . '/intake-mail.php';

    /**
     * Каталог очереди лендинга.
     *
     * Своё имя, а не INTAKE_QUEUE_DIR: ideav.ru и excel-to-app.ru стоят на
     * одном сервере, у их вебрутов общий родитель, и каталог «по умолчанию» у
     * двух сайтов оказался бы одним и тем же. Тогда мост одного сайта забирал
     * бы заявки другого — очереди обязаны быть раздельными.
     */
    function order_queue_dir(): string {
        $configured = (string) order_config('ORDER_QUEUE_DIR', '');
        if ($configured !== '') {
            return rtrim($configured, '/');
        }
        // Пустая строка — это CLI: DOCUMENT_ROOT там задан, но пуст,
        // и `?? __DIR__` на него не срабатывает (см. order-deliver.php).
        $root = (string) ($_SERVER['DOCUMENT_ROOT'] ?? '');
        $root = $root !== '' ? $root : __DIR__;
        return rtrim(dirname($root), '/') . '/excel-order-queue';
    }

    /** Ссылка подтверждения для этого домена. */
    function order_confirm_link(string $token, string $host): string {
        $base = (string) order_config('ORDER_CONFIRM_URL', '');
        if ($base === '') {
            // Только https: на http лендинг не отвечает, а ссылка из письма
            // должна вести туда, где ставили галочку.
            $base = 'https://' . ($host !== '' ? $host : 'excel-to-app.ru') . '/order-confirm.php';
        }
        return $base . (str_contains($base, '?') ? '&' : '?') . 'token=' . urlencode($token);
    }

    /** Заявке нужно подтверждение адреса? */
    function order_confirm_needed(string $kind, string $contact): bool {
        return intake_config_flag('ORDER_CONFIRM_REQUIRED', true)
            && $kind === 'demo'
            && intake_is_email($contact);
    }

    /**
     * Лимит заявок на один адрес за сутки.
     *
     * Отдельно от лимита по IP в order.php: тот не мешает нагенерить заявок на
     * один и тот же чужой адрес с разных адресов сети, а письма-подтверждения
     * полетят человеку, который их не просил.
     */
    function order_email_limit(string $contact, int $max, int $window = 86400): bool {
        if ($max <= 0) {
            return true;
        }
        $file = sys_get_temp_dir() . '/excel-order-mail-' . sha1(strtolower($contact));
        $now  = time();
        $hits = [];
        if (is_readable($file)) {
            $hits = array_filter(
                (array) json_decode((string) @file_get_contents($file), true),
                static fn($t) => is_int($t) && $t > $now - $window
            );
        }
        if (count($hits) >= $max) {
            return false;
        }
        $hits[] = $now;
        @file_put_contents($file, json_encode(array_values($hits)), LOCK_EX);
        return true;
    }

    /**
     * Заявка ждёт подтверждения: положить в очередь и отправить письмо.
     *
     * Возвращает `['status' => код, 'payload' => ответ]` — им order.php и
     * отвечает, — либо null, если контур не сработал и заявку надо доставить
     * обычным путём. Терять заявку нельзя ни при каком сбое.
     *
     * @param array<array{tmp:string, name:string, size:int}> $attachments
     */
    function order_confirm_start(string $subject, string $body, string $contact, array $attachments, string $host): ?array {
        $perEmail = (int) order_config('ORDER_CONFIRM_MAX_PER_EMAIL', '3');
        if (!order_email_limit($contact, $perEmail)) {
            return ['status' => 429, 'payload' => [
                'ok'    => false,
                'error' => 'На этот адрес уже отправлено несколько заявок. Проверьте почту — там ссылка подтверждения, — или напишите нам в телеграм.',
            ]];
        }

        $queueDir = order_queue_dir();
        $ttl      = intake_confirm_ttl();
        // order.php держит вложения как ['tmp' => …], очередь ждёт вида $_FILES.
        $uploads = array_map(
            static fn(array $f) => [
                'name'     => (string) $f['name'],
                'tmp_name' => (string) $f['tmp'],
                'size'     => (int) $f['size'],
            ],
            $attachments
        );
        // Уже собранные subject и body кладём в заявку как есть: после
        // подтверждения оператор получит ровно тот текст, который получил бы
        // сразу, и второй сборки того же сообщения нигде нет.
        $created = intake_queue_create($queueDir, [
            'site'         => $host,
            'source'       => 'excel-to-app-landing',
            'source_label' => $subject,
            'kind'         => 'demo',
            'contact'      => $contact,
            'subject'      => $subject,
            'body'         => $body,
            'ip'           => (string) ($_SERVER['REMOTE_ADDR'] ?? ''),
        ], $uploads, $ttl);

        if ($created === null) {
            error_log('order-intake: очередь недоступна, заявка идёт обычным путём');
            return null;
        }

        $letter = intake_render_template(intake_mail_confirm_template(), [
            'confirm_url' => order_confirm_link($created['token'], $host),
            'ttl_hours'   => (string) max(1, (int) round($ttl / 3600)),
            'тематика'    => '',
            'файлы'       => $attachments ? "\nФайлов приложено: " . count($attachments) . '.' : '',
            'сайт'        => $host !== '' ? $host : 'excel-to-app.ru',
        ]);

        if (intake_mail_send($contact, intake_mail_confirm_subject(), $letter)) {
            return ['status' => 200, 'payload' => [
                'ok'         => true,
                'status'     => 'pending_confirmation',
                'request_id' => $created['id'],
                'message'    => 'Мы отправили письмо на ' . $contact . '. Перейдите по ссылке из письма — и мы начнём собирать приложение. Ссылка действует '
                    . max(1, (int) round($ttl / 3600)) . ' ч.',
            ]];
        }

        // Почта хоста легла: заявку не теряем — считаем её подтверждённой и
        // отправляем оператору сразу, как было до #624. Клиент увидит обычное
        // «принято», человек ответит ему руками.
        error_log('order-intake: письмо-подтверждение не отправлено, заявка ' . $created['id'] . ' уходит оператору сразу');
        order_confirm_publish($queueDir, $created['id'], false);
        return ['status' => 200, 'payload' => ['ok' => true]];
    }

    /**
     * Подтверждённая заявка → оператору: в спул и попытка доставки, как у
     * обычной заявки лендинга (недоставленное добирает cron order-deliver.php).
     *
     * Файлы заявки из очереди НЕ удаляются: оператору ушла их копия в спуле,
     * но сборщик берёт оригиналы отсюда — `action=file` моста (intake-build.php).
     * Пока их удаляли сразу, заявку с лендинга нельзя было собрать
     * автоматически: таблицы клиента доезжали только до чата оператора.
     * Удаляются они на `deliver`/`fail`, когда сборка кончилась.
     */
    function order_confirm_publish(string $queueDir, string $id, bool $confirmed = true): bool {
        $record = intake_queue_load($queueDir, $id);
        if ($record === null) {
            return false;
        }
        $body = (string) ($record['body'] ?? '');
        if ($confirmed) {
            $body .= "\n\nАдрес подтверждён клиентом по ссылке из письма (double opt-in, #624).";
        }

        $files = [];
        foreach (intake_queue_files($queueDir, $id) as $f) {
            $files[] = ['tmp' => $f['path'], 'name' => $f['name'], 'size' => (int) @filesize($f['path'])];
        }

        $spool = order_spool_save(order_spool_dir(), [
            'subject' => (string) ($record['subject'] ?? 'Заявка с лендинга'),
            'body'    => $body,
            'contact' => (string) ($record['contact'] ?? ''),
        ], $files);

        if ($spool === null) {
            // Спул недоступен — пробуем доставить в лоб, как order.php.
            $ok = order_deliver_message($body) && order_deliver_files($files, (string) ($record['contact'] ?? ''));
            order_mail_copy((string) ($record['subject'] ?? ''), '', $body, (string) ($record['site'] ?? ''));
            intake_queue_mark($queueDir, $id, null, ['spooled' => $ok, 'spool_error' => $ok ? null : 'spool unavailable']);
            return $ok;
        }

        if (order_spool_deliver($spool)) {
            order_spool_cleanup($spool);
        }
        order_mail_copy((string) ($record['subject'] ?? ''), '', $body, (string) ($record['site'] ?? ''));

        intake_queue_mark($queueDir, $id, null, ['spooled' => true, 'spool_error' => null]);
        return true;
    }
}
