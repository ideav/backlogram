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

// Общие хелперы (лимиты вложений, sendDocument) — issue #399.
require_once __DIR__ . '/intake-shared.php';

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
$source  = trim($data['source']  ?? '');

// Человекочитаемые названия источников заявки (по какой странице/форме пришла).
$SOURCE_LABELS = [
    'catalog-matching'    => 'Сопоставление каталогов',
    'excel-to-app'        => 'Excel → приложение',
    'excel-to-app-razbor' => 'Разбор ИИ-приложения — заказ звонка',
];
$source_label = $SOURCE_LABELS[$source] ?? $source;

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

$hasIdbCookie = (bool) preg_grep('/^idb_/', array_keys($_COOKIE));

$captchaToken = trim($data['captcha_token'] ?? '');
if (!$hasIdbCookie && !verifyCaptcha($captchaToken)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Проверка капчи не пройдена. Попробуйте ещё раз.']);
    exit;
}

if ($contact === '' && $task === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'At least contact or task must be provided.']);
    exit;
}

// ── Вложения (issue #399) ─────────────────────────────────────────────────────
// Файлы формы пересылаются этим же ботом прямо в Telegram-чат заявок
// (sendDocument), чтобы их не приходилось выкачивать и копировать руками.
$maxFiles   = (int) intake_config('INTAKE_UPLOAD_MAX_FILES', '10');
$maxBytes   = (int) intake_config('INTAKE_UPLOAD_MAX_BYTES', (string) (10 * 1024 * 1024));
$allowedExt = array_values(array_filter(array_map('trim', explode(',', strtolower(
    (string) intake_config('NOTIFY_ALLOWED_EXT', 'xlsx,xls,csv,ods,doc,docx,pdf,png,jpg,jpeg,txt')
)))));

$attachments = []; // [{tmp, name, size}]
if (!empty($_FILES['files'])) {
    $f     = $_FILES['files'];
    $names = is_array($f['name'])     ? $f['name']     : [$f['name']];
    $tmps  = is_array($f['tmp_name']) ? $f['tmp_name'] : [$f['tmp_name']];
    $sizes = is_array($f['size'])     ? $f['size']     : [$f['size']];
    $errs  = is_array($f['error'])    ? $f['error']    : [$f['error']];

    if (count($names) > $maxFiles) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => "Не больше $maxFiles файлов на заявку."]);
        exit;
    }
    foreach ($names as $i => $origName) {
        $err = $errs[$i] ?? UPLOAD_ERR_NO_FILE;
        if ($err === UPLOAD_ERR_NO_FILE) continue;
        $size = (int) ($sizes[$i] ?? 0);
        if ($err !== UPLOAD_ERR_OK
            || !is_uploaded_file((string) ($tmps[$i] ?? ''))
            || !intake_is_allowed_upload((string) $origName, $size, $maxBytes, $allowedExt)) {
            http_response_code(400);
            echo json_encode([
                'ok'    => false,
                'error' => 'Файл «' . $origName . '» не принят: до ' . round($maxBytes / 1048576) . ' МБ, форматы ' . implode(', ', $allowedExt) . '.',
            ]);
            exit;
        }
        // Имя оставляем человекочитаемым (кириллица ок для Telegram) — режем
        // только пути и управляющие символы.
        $safeName = trim(preg_replace('/[\x00-\x1F]+/', ' ', basename(str_replace('\\', '/', (string) $origName))));
        $attachments[] = ['tmp' => (string) $tmps[$i], 'name' => $safeName !== '' ? $safeName : 'file', 'size' => $size];
    }
}

// ── Build Telegram message ────────────────────────────────────────────────────
function esc(string $text): string {
    // Escape MarkdownV2 special characters.
    return preg_replace('/([_*\[\]()~`>#+\-=|{}.!\\\\])/', '\\\\$1', $text);
}

$lines = ["*Новая заявка с сайта*"];

if ($source_label !== '') $lines[] = "🔖 *Источник:* " . esc($source_label);
if ($name !== '')    $lines[] = "👤 *Имя:* " . esc($name);
if ($company !== '') $lines[] = "🏢 *Компания:* " . esc($company);
if ($contact !== '') $lines[] = "📬 *Контакт:* " . esc($contact);
if ($task !== '')    $lines[] = "📝 *Задача:*\n" . esc($task);
if ($attachments)    $lines[] = "📎 *Файлы:* " . esc(count($attachments) . ' шт — придут следом');

$message = implode("\n", $lines);

// ── Доставка через спул (issue #598) ─────────────────────────────────────────
// Канал до Telegram-прокси нестабилен (теряет большинство TCP-соединений),
// поэтому заявка СНАЧАЛА сохраняется на диск, и только потом делается попытка
// доставить. Не доставилось — доберёт cron (tg-deliver.php). Посетителю в
// обоих случаях отвечаем успехом: заявка уже не потеряется.
$caption = 'Файл к заявке' . ($contact !== '' ? ' от ' . $contact : '');
$spool   = intake_spool_dir();
$saved   = intake_spool_save($spool, [
    'text'       => $message,
    'parse_mode' => 'MarkdownV2',
    'caption'    => $caption,
], $attachments);

if ($saved === null) {
    // Спул недоступен (нет прав/места) — доставляем в лоб, как раньше.
    $base = defined('TELEGRAM_API_BASE') ? rtrim(TELEGRAM_API_BASE, '/') : 'https://api.telegram.org';
    $res  = intake_telegram_send_message(TELEGRAM_BOT_TOKEN, (string) TELEGRAM_CHAT_ID, $message, $base, 'MarkdownV2');
    if (!$res['ok']) {
        http_response_code(502);
        echo json_encode(['ok' => false, 'error' => 'Не удалось отправить заявку. Напишите, пожалуйста, в Telegram @qdmadept.']);
        exit;
    }
    foreach ($attachments as $a) {
        intake_telegram_send_document(TELEGRAM_BOT_TOKEN, (string) TELEGRAM_CHAT_ID, $a['tmp'], $a['name'], $caption, $base);
    }
    echo json_encode(['ok' => true, 'message' => 'Сообщение отправлено.']);
    exit;
}

// Попытка доставить сразу (в большинстве случаев дойдёт, cron ничего не добирает).
if (intake_spool_deliver($saved)) {
    intake_spool_cleanup($saved);
}
echo json_encode(['ok' => true, 'message' => 'Заявка принята.']);
