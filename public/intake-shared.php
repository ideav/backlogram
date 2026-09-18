<?php
/**
 * Shared helpers for site form-intake endpoints.
 *
 * Used by:
 *   - telegram-notify.php   (simple CTA form → Telegram)
 *   - excel-to-app.php      (A2: file → GitHub issue → Telegram)
 *
 * The functions here are deliberately dependency-injectable (they take their
 * inputs as arguments instead of reading superglobals) so they can be unit
 * tested with plain `php -r` from the Node test runner.
 *
 * Secrets (Telegram token, GitHub token, captcha key) are resolved with
 * intake_config(), which prefers environment variables over the optional
 * telegram-config.php defines. Nothing secret is ever stored in the repo.
 */

if (!defined('INTAKE_SHARED_LOADED')) {
    define('INTAKE_SHARED_LOADED', true);

    /**
     * Resolve a configuration value.
     *
     * Lookup order: environment variable → PHP constant (telegram-config.php) →
     * provided default. Empty strings are treated as "not set" so that an empty
     * env var falls through to the next source.
     */
    function intake_config(string $name, ?string $default = null): ?string {
        $env = getenv($name);
        if ($env !== false && $env !== '') {
            return $env;
        }
        if (defined($name)) {
            $value = constant($name);
            if ($value !== '' && $value !== null) {
                return (string) $value;
            }
        }
        return $default;
    }

    /** Truthy check for boolean-ish config flags ("1", "true", "yes", "on"). */
    function intake_config_flag(string $name, bool $default = false): bool {
        $raw = intake_config($name, $default ? '1' : '0');
        return in_array(strtolower((string) $raw), ['1', 'true', 'yes', 'on'], true);
    }

    /**
     * Same-origin guard: the request's Referer host must match the server host.
     * Requests without a Referer (or from another host) are rejected.
     */
    function intake_is_same_host(?string $referer, ?string $serverHost): bool {
        if (empty($referer)) {
            return false;
        }
        $refererHost = parse_url($referer, PHP_URL_HOST);
        $refererHost = strtolower(preg_replace('/:\d+$/', '', $refererHost ?? ''));
        $serverHost  = strtolower(preg_replace('/:\d+$/', '', $serverHost ?? ''));
        return $refererHost !== '' && $refererHost === $serverHost;
    }

    /** Any cookie whose name starts with "idb_" marks a returning logged-in user. */
    function intake_has_idb_cookie(array $cookies): bool {
        return (bool) preg_grep('/^idb_/', array_keys($cookies));
    }

    /** Escape text for Telegram MarkdownV2. */
    function intake_escape_markdown(string $text): string {
        return preg_replace('/([_*\[\]()~`>#+\-=|{}.!\\\\])/', '\\\\$1', $text);
    }

    /** Build a filesystem-safe filename from an arbitrary upload name. */
    function intake_sanitize_filename(string $name): string {
        $name = basename($name);
        // Collapse anything that is not alphanumeric / dot / dash / underscore.
        $name = preg_replace('/[^A-Za-z0-9._-]+/', '_', $name);
        $name = trim($name, '._');
        return $name !== '' ? $name : 'file';
    }

    /**
     * Validate a single uploaded file by extension and size.
     *
     * @param string   $filename     Original client filename.
     * @param int      $size         Size in bytes.
     * @param int      $maxBytes     Maximum allowed size in bytes.
     * @param string[] $allowedExt   Lower-case extensions without the dot.
     */
    function intake_is_allowed_upload(string $filename, int $size, int $maxBytes, array $allowedExt): bool {
        if ($size <= 0 || $size > $maxBytes) {
            return false;
        }
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        return $ext !== '' && in_array($ext, $allowedExt, true);
    }

    /**
     * Verify a Yandex SmartCaptcha token.
     *
     * Returns true (captcha disabled) when no real server key is configured so
     * that local/preview environments keep working. The HTTP call is injectable
     * via $httpPost for testing.
     *
     * @param callable|null $httpPost function(string $url, array $params): string|false
     */
    function intake_verify_captcha(string $token, string $serverKey, string $ip = '', ?callable $httpPost = null): bool {
        $stub = 'ysc2_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
        if ($serverKey === '' || $serverKey === $stub) {
            return true;
        }
        if ($token === '') {
            return false;
        }
        $httpPost = $httpPost ?? 'intake_http_post_form';
        $result = $httpPost('https://smartcaptcha.yandexcloud.net/validate', [
            'secret' => $serverKey,
            'token'  => $token,
            'ip'     => $ip,
        ]);
        if ($result === false) {
            return false;
        }
        $data = json_decode($result, true);
        return isset($data['status']) && $data['status'] === 'ok';
    }

    /** Minimal application/x-www-form-urlencoded POST used by the captcha check. */
    function intake_http_post_form(string $url, array $params) {
        $context = stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
                'content' => http_build_query($params),
                'timeout' => 5,
            ],
        ]);
        return @file_get_contents($url, false, $context);
    }

    /**
     * Sliding-window, file-based rate limiter keyed by client IP.
     *
     * Returns true when the request is allowed. State lives in $dir as small
     * JSON files; missing/unwritable directories fail open (allow) so the
     * limiter never takes the form down on its own.
     */
    function intake_rate_limit(string $key, int $maxRequests, int $windowSeconds, string $dir, ?int $now = null): bool {
        if ($maxRequests <= 0) {
            return true; // limiter disabled
        }
        $now = $now ?? time();
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
            return true; // cannot persist state → fail open
        }
        $file = rtrim($dir, '/') . '/rl_' . sha1($key) . '.json';
        $timestamps = [];
        if (is_file($file)) {
            $decoded = json_decode((string) @file_get_contents($file), true);
            if (is_array($decoded)) {
                $timestamps = $decoded;
            }
        }
        // Drop timestamps outside the window.
        $cutoff = $now - $windowSeconds;
        $timestamps = array_values(array_filter($timestamps, static fn($t) => is_int($t) && $t > $cutoff));
        if (count($timestamps) >= $maxRequests) {
            return false;
        }
        $timestamps[] = $now;
        @file_put_contents($file, json_encode($timestamps), LOCK_EX);
        return true;
    }

    /**
     * Perform a GitHub REST API request.
     *
     * @return array{ok:bool, http_code:int, body:mixed, raw:string, error:?string}
     */
    function intake_github_request(string $method, string $path, string $token, ?array $payload, string $apiBase = 'https://api.github.com'): array {
        $url = rtrim($apiBase, '/') . '/' . ltrim($path, '/');
        $headers = [
            'Accept: application/vnd.github+json',
            'Authorization: Bearer ' . $token,
            'User-Agent: backlogram-intake',
            'X-GitHub-Api-Version: 2022-11-28',
        ];
        $ch = curl_init($url);
        $opts = [
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 20,
        ];
        if ($payload !== null) {
            $opts[CURLOPT_POSTFIELDS] = json_encode($payload);
            $headers[] = 'Content-Type: application/json';
            $opts[CURLOPT_HTTPHEADER] = $headers;
        }
        curl_setopt_array($ch, $opts);
        $raw   = curl_exec($ch);
        $code  = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($raw === false) {
            return ['ok' => false, 'http_code' => 0, 'body' => null, 'raw' => '', 'error' => $error ?: 'request failed'];
        }
        $body = json_decode((string) $raw, true);
        return [
            'ok'        => $code >= 200 && $code < 300,
            'http_code' => $code,
            'body'      => $body,
            'raw'       => (string) $raw,
            'error'     => null,
        ];
    }

    /**
     * Commit a file to a repository via the Contents API.
     * Returns the API result; on success body.content.download_url is the link.
     */
    function intake_github_upload_file(string $repo, string $path, string $contents, string $message, string $branch, string $token, string $apiBase = 'https://api.github.com'): array {
        return intake_github_request('PUT', "repos/$repo/contents/" . intake_encode_path($path), $token, [
            'message' => $message,
            'content' => base64_encode($contents),
            'branch'  => $branch,
        ], $apiBase);
    }

    /** Create an issue in a repository. */
    function intake_github_create_issue(string $repo, string $title, string $body, array $labels, string $token, string $apiBase = 'https://api.github.com'): array {
        $payload = ['title' => $title, 'body' => $body];
        if ($labels) {
            $payload['labels'] = $labels;
        }
        return intake_github_request('POST', "repos/$repo/issues", $token, $payload, $apiBase);
    }

    /** URL-encode each path segment while preserving the slashes. */
    function intake_encode_path(string $path): string {
        return implode('/', array_map('rawurlencode', explode('/', $path)));
    }

    /**
     * Send a Telegram text message.
     *
     * @return array{ok:bool, http_code:int, description:?string}
     */
    function intake_telegram_send_message(string $botToken, string $chatId, string $text, string $apiBase = 'https://api.telegram.org', string $parseMode = 'MarkdownV2'): array {
        $url = rtrim($apiBase, '/') . '/bot' . $botToken . '/sendMessage';
        $fields = ['chat_id' => $chatId, 'text' => $text];
        if ($parseMode !== '') {
            $fields['parse_mode'] = $parseMode;
        }
        $payload = json_encode($fields);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
        ]);
        $response = curl_exec($ch);
        $code     = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error    = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            return ['ok' => false, 'http_code' => 0, 'description' => $error ?: 'request failed'];
        }
        $data = json_decode((string) $response, true);
        return [
            'ok'          => $code === 200 && !empty($data['ok']),
            'http_code'   => $code,
            'description' => $data['description'] ?? null,
        ];
    }

    /**
     * Send a file to a Telegram chat via sendDocument (multipart upload;
     * Bot API limit — 50 MB per file). Attachments from the site form land
     * straight in the intake chat, so nothing has to be copied over by hand
     * (issue #399).
     *
     * @return array{ok:bool, http_code:int, description:?string}
     */
    function intake_telegram_send_document(string $botToken, string $chatId, string $filePath, string $filename, string $caption = '', string $apiBase = 'https://api.telegram.org'): array {
        $url = rtrim($apiBase, '/') . '/bot' . $botToken . '/sendDocument';
        $fields = [
            'chat_id'  => $chatId,
            'document' => new CURLFile($filePath, 'application/octet-stream', $filename),
        ];
        if ($caption !== '') {
            // Telegram caps captions at 1024 characters; plain text (no parse_mode).
            $fields['caption'] = function_exists('mb_substr') ? mb_substr($caption, 0, 1024) : substr($caption, 0, 1024);
        }
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $fields,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 60,
        ]);
        $response = curl_exec($ch);
        $code     = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error    = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            return ['ok' => false, 'http_code' => 0, 'description' => $error ?: 'request failed'];
        }
        $data = json_decode((string) $response, true);
        return [
            'ok'          => $code === 200 && !empty($data['ok']),
            'http_code'   => $code,
            'description' => $data['description'] ?? null,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Спул доставки заявок (issue #598)
    //
    //  Канал ideav-сервер → Telegram-прокси теряет большинство TCP-соединений
    //  (замер 2026-09-16: ~2 из 10 доходят), поэтому доставка устроена как
    //  очередь на диске: заявка и файлы сохраняются, попытка отправки идёт
    //  после, а недоставленное добирает cron (tg-deliver.php). Посетителю в
    //  обоих случаях отвечаем успехом — заявка уже не потеряется.
    //
    //  Секреты (токен, chat_id, api_base) в спуле НЕ хранятся — резолвятся
    //  из конфигурации при доставке. В meta.json лежит только текст, parse_mode
    //  и подпись к файлам.
    // ─────────────────────────────────────────────────────────────────────────

    /** Каталог очереди — вне вебрута, чтобы содержимое не раздавалось наружу. */
    function intake_spool_dir(): string {
        $configured = intake_config('NOTIFY_SPOOL_DIR');
        if ($configured !== null) {
            return rtrim($configured, '/');
        }
        $root = $_SERVER['DOCUMENT_ROOT'] ?? __DIR__;
        return rtrim(dirname($root), '/') . '/tg-spool-notify';
    }

    /**
     * Сохранить заявку в очередь. Возвращает путь каталога заявки или null.
     *
     * @param array{text:string, parse_mode:string, caption:string} $message
     * @param array<array{tmp:string, name:string}>                 $attachments
     */
    function intake_spool_save(string $spool, array $message, array $attachments): ?string {
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
            'text'       => $message['text'],
            'parse_mode' => $message['parse_mode'] ?? '',
            'caption'    => $message['caption'] ?? '',
            'files'      => $files,
            'created'    => time(),
        ];
        if (@file_put_contents($dir . '/meta.json', json_encode($meta, JSON_UNESCAPED_UNICODE), LOCK_EX) === false) {
            return null;
        }
        return $dir;
    }

    /** Доставить заявку из каталога очереди. true — всё ушло. */
    function intake_spool_deliver(string $dir): bool {
        $meta = json_decode((string) @file_get_contents($dir . '/meta.json'), true);
        if (!is_array($meta)) {
            return false;
        }
        $token  = intake_config('TELEGRAM_BOT_TOKEN');
        $chatId = intake_config('TELEGRAM_CHAT_ID');
        if ($token === null || $chatId === null) {
            return false;
        }
        $base = (string) intake_config('TELEGRAM_API_BASE', 'https://api.telegram.org');
        $parseMode = (string) ($meta['parse_mode'] ?? '');
        if (empty($meta['message_sent'])) {
            $res = intake_telegram_send_message($token, $chatId, (string) $meta['text'], $base, $parseMode);
            if (!$res['ok']) {
                return false;
            }
            $meta['message_sent'] = true;
            @file_put_contents($dir . '/meta.json', json_encode($meta, JSON_UNESCAPED_UNICODE), LOCK_EX);
        }
        $ok = true;
        foreach ((array) ($meta['files'] ?? []) as $f) {
            $path = $f['path'] ?? '';
            if ($path === '' || !is_readable($path)) {
                continue;
            }
            $sent = intake_telegram_send_document($token, $chatId, $path, (string) $f['name'], (string) ($meta['caption'] ?? ''), $base);
            $ok = $ok && $sent['ok'];
        }
        return $ok;
    }

    /** Удалить каталог доставленной заявки. */
    function intake_spool_cleanup(string $dir): void {
        foreach (glob($dir . '/*') ?: [] as $f) {
            @unlink($f);
        }
        @rmdir($dir);
    }
}
