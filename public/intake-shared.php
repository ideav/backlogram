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
        $payload = json_encode([
            'chat_id'    => $chatId,
            'text'       => $text,
            'parse_mode' => $parseMode,
        ]);
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
}
