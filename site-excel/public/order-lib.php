<?php
/**
 * Доставка заявок лендинга в Telegram через нестабильный канал (issue #596).
 *
 * Маршрут ideav-сервер → Telegram-прокси теряет большинство TCP-соединений
 * (замер 2026-09-16: 2 из 10 https-запросов доходят), поэтому доставка
 * устроена как спул: заявка и файлы сначала сохраняются в каталог-очередь,
 * попытка отправки идёт после, а недоставленное добирает cron
 * (order-deliver.php) — каждая попытка имеет шанс, и за несколько заходов
 * заявка доходит практически наверняка.
 *
 * Секреты — те же, что у order.php: order-config.php / окружение.
 */

if (!defined('ORDER_LIB_LOADED')) {
    define('ORDER_LIB_LOADED', true);

    if (!function_exists('order_config')) {
        $order_config_file = __DIR__ . '/order-config.php';
        if (file_exists($order_config_file)) {
            require_once $order_config_file;
        }
        function order_config(string $name, ?string $default = null): ?string {
            $env = getenv($name);
            if ($env !== false && $env !== '') {
                return $env;
            }
            if (defined($name)) {
                $value = (string) constant($name);
                if ($value !== '') {
                    return $value;
                }
            }
            return $default;
        }
    }

    /** Каталог очереди — вне вебрута, чтобы содержимое не раздавалось наружу. */
    function order_spool_dir(): string {
        $configured = order_config('ORDER_SPOOL_DIR');
        if ($configured !== null) {
            return rtrim($configured, '/');
        }
        $root = $_SERVER['DOCUMENT_ROOT'] ?? __DIR__;
        return rtrim(dirname($root), '/') . '/tg-spool';
    }

    /**
     * Сохранить заявку в очередь. Возвращает путь каталога заявки или null,
     * если записать не удалось.
     *
     * @param array{subject:string, body:string, contact:string} $message
     * @param array<array{tmp:string, name:string, size:int}>    $attachments
     */
    function order_spool_save(string $spool, array $message, array $attachments): ?string {
        if (!is_dir($spool) && !@mkdir($spool, 0700, true) && !is_dir($spool)) {
            return null;
        }
        $dir = $spool . '/' . date('Ymd-His') . '-' . bin2hex(random_bytes(4));
        if (!@mkdir($dir, 0700)) {
            return null;
        }
        $files = [];
        foreach ($attachments as $i => $a) {
            $dest = $dir . '/file' . $i;
            $moved = is_uploaded_file($a['tmp']) ? @move_uploaded_file($a['tmp'], $dest) : @copy($a['tmp'], $dest);
            if ($moved) {
                $files[] = ['path' => $dest, 'name' => $a['name']];
            }
        }
        $meta = [
            'subject' => $message['subject'],
            'body'    => $message['body'],
            'contact' => $message['contact'],
            'files'   => $files,
            'created' => time(),
        ];
        if (@file_put_contents($dir . '/meta.json', json_encode($meta, JSON_UNESCAPED_UNICODE), LOCK_EX) === false) {
            return null;
        }
        return $dir;
    }

    /** POST к Bot API через прокси с ретраями; поля могут содержать CURLFile. */
    function order_tg_call(string $method, array $fields, int $tries = 2, int $timeout = 6): bool {
        $token = order_config('TELEGRAM_BOT_TOKEN');
        if ($token === null || !function_exists('curl_init')) {
            return false;
        }
        $base = rtrim((string) order_config('TELEGRAM_API_BASE', 'https://api.telegram.org'), '/');
        $url  = $base . '/bot' . $token . '/' . $method;
        for ($i = 0; $i < $tries; $i++) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $fields,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => $timeout,
                CURLOPT_CONNECTTIMEOUT => $timeout,
            ]);
            $raw  = curl_exec($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($raw !== false && $code === 200) {
                $data = json_decode((string) $raw, true);
                if (!empty($data['ok'])) {
                    return true;
                }
                // 200 с ok:false — ошибка API (не сети), ретрай не поможет.
                error_log('order-lib: telegram API error: ' . substr((string) $raw, 0, 200));
                return false;
            }
        }
        return false;
    }

    function order_deliver_message(string $body): bool {
        $chatId = order_config('TELEGRAM_CHAT_ID');
        if ($chatId === null) {
            return false;
        }
        return order_tg_call('sendMessage', ['chat_id' => $chatId, 'text' => $body]);
    }

    /** @param array<array{tmp?:string, path?:string, name:string}> $files */
    function order_deliver_files(array $files, string $contact): bool {
        $chatId = order_config('TELEGRAM_CHAT_ID');
        if ($chatId === null) {
            return $files === [];
        }
        $ok = true;
        foreach ($files as $f) {
            $path = $f['path'] ?? $f['tmp'] ?? '';
            if ($path === '' || !is_readable($path)) {
                continue;
            }
            $sent = order_tg_call('sendDocument', [
                'chat_id'  => $chatId,
                'caption'  => mb_substr('Файл к заявке от ' . $contact, 0, 1024),
                'document' => new CURLFile($path, 'application/octet-stream', $f['name']),
            ], 2, 30);
            $ok = $ok && $sent;
        }
        return $ok;
    }

    /** Доставить заявку из каталога очереди. true — всё ушло. */
    function order_spool_deliver(string $dir): bool {
        $meta = json_decode((string) @file_get_contents($dir . '/meta.json'), true);
        if (!is_array($meta)) {
            return false;
        }
        if (empty($meta['message_sent'])) {
            if (!order_deliver_message((string) $meta['body'])) {
                return false;
            }
            $meta['message_sent'] = true;
            @file_put_contents($dir . '/meta.json', json_encode($meta, JSON_UNESCAPED_UNICODE), LOCK_EX);
        }
        return order_deliver_files((array) ($meta['files'] ?? []), (string) ($meta['contact'] ?? ''));
    }

    /** Удалить каталог доставленной заявки. */
    function order_spool_cleanup(string $dir): void {
        foreach (glob($dir . '/*') ?: [] as $f) {
            @unlink($f);
        }
        @rmdir($dir);
    }

    /** Почтовый дубль (без гарантий: у доменов нет DMARC, письма часто в спаме). */
    function order_mail_copy(string $subject, string $name, string $body, string $host): void {
        $to = order_config('ORDER_EMAIL_TO');
        if ($to === null) {
            return;
        }
        $from    = order_config('ORDER_EMAIL_FROM', 'noreply@' . $host);
        $headers = ['From: Excel-лендинг <' . $from . '>', 'Content-Type: text/plain; charset=UTF-8'];
        @mail($to, $subject . ': ' . $name, $body, implode("\r\n", $headers));
    }
}
