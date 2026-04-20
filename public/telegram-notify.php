<?php
/**
 * Telegram Form Notification Script
 *
 * Place this file on your server alongside telegram-config.php.
 * The config file should define TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.
 *
 * Security: only accepts requests from the same host (same-origin check).
 */

header('Content-Type: application/json');

// ── Same-host verification ────────────────────────────────────────────────────
// Compare the HTTP_REFERER origin against the current server host.
// Requests without a Referer header or from a different host are rejected.
function is_same_host(): bool {
    if (empty($_SERVER['HTTP_REFERER'])) {
        return false;
    }

    $referer_host = parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST);
    $server_host  = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';

    // Strip port from both sides for a clean comparison.
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

// ── Read and validate input ───────────────────────────────────────────────────
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

// Fall back to regular POST fields if body is not JSON.
if (!is_array($data)) {
    $data = $_POST;
}

$name    = trim($data['name']    ?? '');
$company = trim($data['company'] ?? '');
$contact = trim($data['contact'] ?? '');
$task    = trim($data['task']    ?? '');

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

$captchaToken = trim($data['captcha_token'] ?? '');
if (!verifyCaptcha($captchaToken)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Проверка капчи не пройдена. Попробуйте ещё раз.']);
    exit;
}

if ($contact === '' && $task === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'At least contact or task must be provided.']);
    exit;
}

// ── Build Telegram message ────────────────────────────────────────────────────
function esc(string $text): string {
    // Escape MarkdownV2 special characters.
    return preg_replace('/([_*\[\]()~`>#+\-=|{}.!\\\\])/', '\\\\$1', $text);
}

$lines = ["*Новая заявка с сайта*"];

if ($name !== '')    $lines[] = "👤 *Имя:* " . esc($name);
if ($company !== '') $lines[] = "🏢 *Компания:* " . esc($company);
if ($contact !== '') $lines[] = "📬 *Контакт:* " . esc($contact);
if ($task !== '')    $lines[] = "📝 *Задача:*\n" . esc($task);

$message = implode("\n", $lines);

// ── Send to Telegram ──────────────────────────────────────────────────────────
$url     = 'https://api.telegram.org/bot' . TELEGRAM_BOT_TOKEN . '/sendMessage';
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

echo json_encode(['ok' => true, 'message' => 'Сообщение отправлено.']);
