<?php
/**
 * Contact-form intake for the English site (ideav.pro).
 *
 * Deliberately standalone: it shares no code with the other site's intake
 * endpoints, because those depend on a regional captcha service and on config
 * that lives on that host (issue #524).
 *
 * Spam handling here is intentionally low-tech — same-origin check, honeypot
 * field and a per-IP rate limit. No third-party captcha is loaded, so the page
 * makes no external requests at all.
 *
 * Configuration comes from environment variables, or from an optional
 * order-config.php next to this file (git-ignored) that define()s the same
 * names. The environment always wins. Nothing secret lives in the repository.
 *
 *   ORDER_EMAIL_TO      recipient of the notification   (required)
 *   ORDER_EMAIL_FROM    envelope sender                 (default: noreply@<host>)
 *   TELEGRAM_BOT_TOKEN  optional duplicate notification
 *   TELEGRAM_CHAT_ID    optional duplicate notification
 */

header('Content-Type: application/json');

$config_file = __DIR__ . '/order-config.php';
if (file_exists($config_file)) {
    require_once $config_file;
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

function order_respond(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

// ── Method and same-origin guard ─────────────────────────────────────────────
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    order_respond(405, ['ok' => false, 'error' => 'Method not allowed.']);
}

$referer_host = strtolower(preg_replace('/:\d+$/', '', (string) parse_url($_SERVER['HTTP_REFERER'] ?? '', PHP_URL_HOST)));
$server_host  = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
if ($referer_host === '' || $referer_host !== $server_host) {
    order_respond(403, ['ok' => false, 'error' => 'Request must originate from this site.']);
}

// ── Input ────────────────────────────────────────────────────────────────────
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$name    = trim((string) ($data['name'] ?? ''));
$email   = trim((string) ($data['email'] ?? ''));
$company = trim((string) ($data['company'] ?? ''));
$task    = trim((string) ($data['task'] ?? ''));
$trap    = trim((string) ($data['website'] ?? ''));

// Honeypot: a real visitor never sees this field, so anything in it is a bot.
// Answer with success so the bot has nothing to learn from the response.
if ($trap !== '') {
    order_respond(200, ['ok' => true]);
}

if ($name === '' || $task === '') {
    order_respond(400, ['ok' => false, 'error' => 'Please tell us your name and what you need.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    order_respond(400, ['ok' => false, 'error' => 'Please check the email address.']);
}
if (mb_strlen($task) > 5000 || mb_strlen($name) > 200 || mb_strlen($company) > 200) {
    order_respond(400, ['ok' => false, 'error' => 'That is longer than we can accept — please shorten it.']);
}

// ── Rate limit: 3 submissions per IP per 10 minutes ──────────────────────────
$ip    = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$stamp = sys_get_temp_dir() . '/integram-order-' . sha1($ip);
$now   = time();
$hits  = [];
if (is_readable($stamp)) {
    $hits = array_filter(
        (array) json_decode((string) file_get_contents($stamp), true),
        static fn($t) => is_int($t) && $t > $now - 600
    );
}
if (count($hits) >= 3) {
    order_respond(429, ['ok' => false, 'error' => 'Too many requests. Please try again in a few minutes.']);
}
$hits[] = $now;
@file_put_contents($stamp, json_encode(array_values($hits)), LOCK_EX);

// ── Notify ───────────────────────────────────────────────────────────────────
$lines = [
    'New enquiry from ' . $server_host,
    '',
    'Name:    ' . $name,
    'Email:   ' . $email,
    'Company: ' . ($company !== '' ? $company : '—'),
    '',
    'Task:',
    $task,
];
$body = implode("\n", $lines);

$sent = false;

$to = order_config('ORDER_EMAIL_TO');
if ($to !== null) {
    $from    = order_config('ORDER_EMAIL_FROM', 'noreply@' . $server_host);
    $headers = [
        'From: Integram site <' . $from . '>',
        'Reply-To: ' . $email,
        'Content-Type: text/plain; charset=UTF-8',
    ];
    $sent = @mail($to, 'Integram — enquiry from ' . $name, $body, implode("\r\n", $headers));
}

$token  = order_config('TELEGRAM_BOT_TOKEN');
$chatId = order_config('TELEGRAM_CHAT_ID');
if ($token !== null && $chatId !== null) {
    $context = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => http_build_query(['chat_id' => $chatId, 'text' => $body]),
            'timeout' => 5,
        ],
    ]);
    $result = @file_get_contents('https://api.telegram.org/bot' . $token . '/sendMessage', false, $context);
    $sent   = $sent || ($result !== false);
}

if (!$sent) {
    // The message is lost otherwise — say so instead of showing a fake success.
    error_log('order.php: no delivery channel configured or delivery failed');
    order_respond(500, ['ok' => false, 'error' => 'We could not deliver your message. Please email abc@integram.io directly.']);
}

order_respond(200, ['ok' => true]);
