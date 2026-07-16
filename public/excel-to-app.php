<?php
/**
 * A2 — Excel-to-app request intake.
 *
 * Backend for the "Загрузите Excel — получите приложение" landing form (#303).
 * Flow:
 *   1. Accept a multipart/form-data POST with contact fields and Excel
 *      attachments.
 *   2. Guard against spam (same-origin check, SmartCaptcha, per-IP rate limit).
 *   3. Commit each attachment to a GitHub repository via the Contents API.
 *   4. Create a GitHub issue describing the order, linking the attachments.
 *   5. Notify the owner's Telegram bot that a new order arrived.
 *
 * Secrets are read from the environment (see telegram-config.example.php):
 *   GITHUB_TOKEN, GITHUB_ISSUE_REPO, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, …
 * telegram-config.php (git-ignored) may also define them, but the environment
 * always wins. No token is ever stored in the repository.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/intake-shared.php';

// Optional config file with define()s (git-ignored). Environment still wins.
$config_file = __DIR__ . '/telegram-config.php';
if (file_exists($config_file)) {
    require_once $config_file;
}

/** Emit a JSON response and stop. */
function intake_respond(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

// ── Method + same-origin guard ────────────────────────────────────────────────
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    intake_respond(405, ['ok' => false, 'error' => 'Method not allowed.']);
}

if (!intake_config_flag('INTAKE_SKIP_HOST_CHECK')) {
    $referer    = $_SERVER['HTTP_REFERER'] ?? null;
    $serverHost = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';
    if (!intake_is_same_host($referer, $serverHost)) {
        intake_respond(403, ['ok' => false, 'error' => 'Forbidden: request must originate from the same host.']);
    }
}

// ── Read fields (multipart form) ──────────────────────────────────────────────
$name    = trim((string) ($_POST['name']    ?? ''));
$company = trim((string) ($_POST['company'] ?? ''));
$contact = trim((string) ($_POST['contact'] ?? ''));
// The landing labels this field "тематика"; accept a couple of aliases.
$topic   = trim((string) ($_POST['topic'] ?? $_POST['task'] ?? $_POST['theme'] ?? ''));

// Which landing form the request came from. Drives the issue/notification
// wording so a "сопоставление каталогов" заявка doesn't read as "Excel → app".
// Same source vocabulary as telegram-notify.php; defaults to the original form.
$source = trim((string) ($_POST['source'] ?? 'excel-to-app'));
$SOURCE_LABELS = [
    'catalog-matching'  => 'Сопоставление каталогов',
    'excel-to-app'      => 'Excel → приложение',
    'excel-constructor' => 'Конструктор приложений вместо Excel',
];
$sourceLabel = $SOURCE_LABELS[$source] ?? ($source !== '' ? $source : 'Excel → приложение');

// ── Spam protection: SmartCaptcha (skipped for known logged-in users) ─────────
$hasIdbCookie = intake_has_idb_cookie($_COOKIE);
$captchaToken = trim((string) ($_POST['captcha_token'] ?? ''));
$serverKey    = (string) intake_config('SMARTCAPTCHA_SERVER_KEY', '');
if (!$hasIdbCookie && !intake_verify_captcha($captchaToken, $serverKey, $_SERVER['REMOTE_ADDR'] ?? '')) {
    intake_respond(400, ['ok' => false, 'error' => 'Проверка капчи не пройдена. Попробуйте ещё раз.']);
}

// ── Spam protection: per-IP rate limit ────────────────────────────────────────
$rateMax    = (int) intake_config('INTAKE_RATE_LIMIT_MAX', '5');
$rateWindow = (int) intake_config('INTAKE_RATE_LIMIT_WINDOW', '3600');
$rateDir    = (string) intake_config('INTAKE_RATE_LIMIT_DIR', sys_get_temp_dir() . '/excel-to-app-rl');
$clientIp   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!intake_rate_limit($clientIp, $rateMax, $rateWindow, $rateDir)) {
    intake_respond(429, ['ok' => false, 'error' => 'Слишком много заявок. Попробуйте позже.']);
}

// ── Basic validation ──────────────────────────────────────────────────────────
if ($contact === '') {
    intake_respond(400, ['ok' => false, 'error' => 'Укажите контакт (Email или Telegram), чтобы мы могли прислать результат.']);
}

// ── Collect uploaded files ────────────────────────────────────────────────────
$maxBytes   = (int) intake_config('INTAKE_UPLOAD_MAX_BYTES', (string) (10 * 1024 * 1024));
$maxFiles   = (int) intake_config('INTAKE_UPLOAD_MAX_FILES', '10');
$allowedExt = array_filter(array_map('trim', explode(',', (string) intake_config('INTAKE_ALLOWED_EXT', 'xlsx,xls,csv,ods'))));

$uploads = intake_collect_uploads($_FILES);
if (count($uploads) > $maxFiles) {
    intake_respond(400, ['ok' => false, 'error' => "Слишком много файлов (максимум $maxFiles)."]);
}
foreach ($uploads as $file) {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        intake_respond(400, ['ok' => false, 'error' => 'Ошибка загрузки файла: ' . $file['name']]);
    }
    if (!intake_is_allowed_upload($file['name'], (int) $file['size'], $maxBytes, $allowedExt)) {
        intake_respond(400, [
            'ok'    => false,
            'error' => 'Недопустимый файл: ' . $file['name'] . '. Разрешены: ' . implode(', ', $allowedExt) . '; до ' . (int) round($maxBytes / 1048576) . ' МБ.',
        ]);
    }
}

// ── GitHub configuration ──────────────────────────────────────────────────────
$githubToken  = (string) intake_config('GITHUB_TOKEN', '');
$issueRepo    = (string) intake_config('GITHUB_ISSUE_REPO', '');
$uploadRepo   = (string) intake_config('GITHUB_UPLOAD_REPO', $issueRepo);
$uploadBranch = (string) intake_config('GITHUB_UPLOAD_BRANCH', 'main');
$apiBase      = (string) intake_config('GITHUB_API_BASE', 'https://api.github.com');
$labels       = array_values(array_filter(array_map('trim', explode(',', (string) intake_config('GITHUB_ISSUE_LABELS', '')))));

if ($githubToken === '' || $issueRepo === '') {
    intake_respond(500, ['ok' => false, 'error' => 'GitHub integration is not configured.']);
}

// ── Upload attachments to the repository ──────────────────────────────────────
// Group all attachments of one request under a unique directory so the issue
// body can link to them. We avoid Date/random helpers being unavailable here —
// PHP has them — using a timestamp + short random suffix.
$requestId = date('Ymd-His') . '-' . substr(bin2hex(random_bytes(4)), 0, 8);
$uploadDir = 'orders/' . $requestId;

$attachmentLinks = [];
foreach ($uploads as $index => $file) {
    $safeName = intake_sanitize_filename($file['name']);
    $repoPath = $uploadDir . '/' . sprintf('%02d-%s', $index + 1, $safeName);
    $contents = file_get_contents($file['tmp_name']);
    if ($contents === false) {
        intake_respond(500, ['ok' => false, 'error' => 'Не удалось прочитать загруженный файл.']);
    }
    $result = intake_github_upload_file(
        $uploadRepo,
        $repoPath,
        $contents,
        "chore(orders): attachment for $requestId",
        $uploadBranch,
        $githubToken,
        $apiBase
    );
    if (!$result['ok']) {
        intake_respond(502, [
            'ok'      => false,
            'error'   => 'Не удалось сохранить вложение в репозитории.',
            'details' => $result['body']['message'] ?? $result['error'] ?? null,
        ]);
    }
    $attachmentLinks[] = [
        'name' => $safeName,
        'url'  => $result['body']['content']['html_url'] ?? ($result['body']['content']['download_url'] ?? ''),
    ];
}

// ── Create the issue ──────────────────────────────────────────────────────────
$issueTitle = "Заявка: $sourceLabel" . ($company !== '' ? " — $company" : ($name !== '' ? " — $name" : ''));
$issueBody  = intake_build_issue_body($sourceLabel, $name, $company, $contact, $topic, $attachmentLinks, $requestId);

$issueResult = intake_github_create_issue($issueRepo, $issueTitle, $issueBody, $labels, $githubToken, $apiBase);
if (!$issueResult['ok']) {
    intake_respond(502, [
        'ok'      => false,
        'error'   => 'Не удалось создать issue.',
        'details' => $issueResult['body']['message'] ?? $issueResult['error'] ?? null,
    ]);
}
$issueUrl    = $issueResult['body']['html_url'] ?? '';
$issueNumber = $issueResult['body']['number'] ?? null;

// ── Notify Telegram (best effort: never fail the order if Telegram is down) ───
$telegramSent = false;
$botToken = (string) intake_config('TELEGRAM_BOT_TOKEN', '');
$chatId   = (string) intake_config('TELEGRAM_CHAT_ID', '');
if ($botToken !== '' && $chatId !== '') {
    $tgBase  = (string) intake_config('TELEGRAM_API_BASE', 'https://api.telegram.org');
    $message = intake_build_telegram_message($sourceLabel, $name, $company, $contact, $topic, $attachmentLinks, $issueUrl);
    $tg = intake_telegram_send_message($botToken, $chatId, $message, $tgBase);
    $telegramSent = $tg['ok'];
}

intake_respond(200, [
    'ok'           => true,
    'message'      => 'Заявка принята. Мы свяжемся с вами в ближайшее время.',
    'issue_url'    => $issueUrl,
    'issue_number' => $issueNumber,
    'attachments'  => count($attachmentLinks),
    'telegram'     => $telegramSent,
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalise $_FILES (which may hold a single file or an array of files under
 * the "files"/"files[]"/"file" field) into a flat list of file descriptors.
 *
 * @return array<int, array{name:string, tmp_name:string, size:int, error:int}>
 */
function intake_collect_uploads(array $files): array {
    $out = [];
    foreach (['files', 'file', 'attachments'] as $field) {
        if (!isset($files[$field])) {
            continue;
        }
        $f = $files[$field];
        if (is_array($f['name'])) {
            $count = count($f['name']);
            for ($i = 0; $i < $count; $i++) {
                if (($f['error'][$i] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
                    continue;
                }
                $out[] = [
                    'name'     => (string) $f['name'][$i],
                    'tmp_name' => (string) $f['tmp_name'][$i],
                    'size'     => (int) $f['size'][$i],
                    'error'    => (int) $f['error'][$i],
                ];
            }
        } else {
            if (($f['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            $out[] = [
                'name'     => (string) $f['name'],
                'tmp_name' => (string) $f['tmp_name'],
                'size'     => (int) $f['size'],
                'error'    => (int) $f['error'],
            ];
        }
    }
    return $out;
}

/** Compose the GitHub issue body (Markdown). */
function intake_build_issue_body(string $heading, string $name, string $company, string $contact, string $topic, array $attachments, string $requestId): string {
    $lines = ["## Новая заявка «$heading»", ''];
    if ($name !== '')    $lines[] = "- **Имя:** $name";
    if ($company !== '') $lines[] = "- **Компания:** $company";
    if ($contact !== '') $lines[] = "- **Контакт:** $contact";
    $lines[] = "- **ID заявки:** `$requestId`";
    $lines[] = '';
    if ($topic !== '') {
        $lines[] = '### Тематика';
        $lines[] = $topic;
        $lines[] = '';
    }
    $lines[] = '### Вложения';
    if ($attachments) {
        foreach ($attachments as $a) {
            $lines[] = $a['url'] !== '' ? "- [{$a['name']}]({$a['url']})" : "- {$a['name']}";
        }
    } else {
        $lines[] = '_Файлы не приложены._';
    }
    $lines[] = '';
    $lines[] = '---';
    $lines[] = '_Создано автоматически обработчиком приёма заявок (A2)._';
    return implode("\n", $lines);
}

/** Compose the Telegram notification (MarkdownV2). */
function intake_build_telegram_message(string $heading, string $name, string $company, string $contact, string $topic, array $attachments, string $issueUrl): string {
    $e = 'intake_escape_markdown';
    $lines = ['*Новая заявка «' . $heading . '»*'];
    if ($name !== '')    $lines[] = '👤 *Имя:* ' . $e($name);
    if ($company !== '') $lines[] = '🏢 *Компания:* ' . $e($company);
    if ($contact !== '') $lines[] = '📬 *Контакт:* ' . $e($contact);
    if ($topic !== '')   $lines[] = "📝 *Тематика:*\n" . $e($topic);
    $lines[] = '📎 *Файлов:* ' . $e((string) count($attachments));
    if ($issueUrl !== '') {
        $lines[] = '🔗 ' . $e($issueUrl);
    }
    return implode("\n", $lines);
}
