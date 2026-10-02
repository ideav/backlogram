<?php
/**
 * A2 — Excel-to-app request intake.
 *
 * Backend for the "Загрузите Excel — получите приложение" landing form (#303).
 * Flow:
 *   1. Accept a multipart/form-data POST with contact fields and Excel
 *      attachments.
 *   2. Guard against spam (same-origin check, SmartCaptcha, per-IP rate limit).
 *   3. Заявки с email — в очередь со статусом pending_confirmation, клиенту
 *      уходит письмо со ссылкой подтверждения (double opt-in, issue #624).
 *      Публикация и сборка начинаются только из excel-to-app-confirm.php.
 *   4. Заявки без email (телеграм-контакт) публикуются сразу, как и раньше:
 *      вложения → GitHub, issue, уведомление в Telegram.
 *
 * Почему подтверждение именно в начале: сборку делает ИИ-агент, каждая заявка
 * стоит денег, и форма без подтверждения адреса — это оплаченная сборка на
 * любой опечатку и любой чужой адрес.
 *
 * Secrets are read from the environment (see telegram-config.example.php):
 *   GITHUB_TOKEN, GITHUB_ISSUE_REPO, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, …
 * telegram-config.php (git-ignored) may also define them, but the environment
 * always wins. No token is ever stored in the repository.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/intake-shared.php';
require_once __DIR__ . '/intake-publish.php';
require_once __DIR__ . '/intake-queue.php';
require_once __DIR__ . '/intake-mail.php';

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
    'uc-zayavki'        => 'Заявки / обращения',
    'uc-proekty'        => 'Проекты и задачи',
    'uc-proizvodstvo'   => 'Производственное планирование',
    'uc-sklad'          => 'Складской учёт',
    'uc-zakupki'        => 'Закупки и поставщики',
    'uc-finansy'        => 'Финансовый учёт',
    'uc-kadry'          => 'Кадровый учёт',
    'uc-crm'            => 'CRM / клиенты',
    'uc-dokumenty'      => 'Документооборот / договоры',
    'uc-otchetnost'     => 'Управленческий учёт',
    'uc-tmc-ds'         => 'Движение ТМЦ и денег',
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
// xlsm — рабочие книги с макросами; на производстве присылают именно их,
// а лендинг их принимал, пока сервер отбивал.
$allowedExt = array_filter(array_map('trim', explode(',', (string) intake_config('INTAKE_ALLOWED_EXT', 'xlsx,xls,xlsm,csv,ods'))));

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

// ── Double opt-in: заявки с email ждут подтверждения адреса (#624) ────────────
// Подтверждение нужно там, где за заявкой стоит автоматическая сборка. Формы
// вроде «сопоставление каталогов» — это обращение к оператору, сборку они не
// запускают, и лишний шаг там только теряет лид; список источников настраивается.
$confirmSources = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) intake_config('INTAKE_CONFIRM_SOURCES', 'excel-to-app,excel-constructor'))
)));
$needsConfirmation = intake_config_flag('INTAKE_CONFIRM_REQUIRED', true)
    && in_array($source, $confirmSources, true)
    && intake_is_email($contact);

if ($needsConfirmation) {
    // Отдельный лимит по адресу: IP-лимит выше не мешает нагенерить заявок на
    // один и тот же чужой адрес с разных адресов сети.
    $perEmailMax = (int) intake_config('INTAKE_CONFIRM_MAX_PER_EMAIL', '3');
    if (!intake_rate_limit('email:' . strtolower($contact), $perEmailMax, 86400, $rateDir)) {
        intake_respond(429, ['ok' => false, 'error' => 'На этот адрес уже отправлено несколько заявок. Проверьте почту или напишите нам в Telegram.']);
    }

    $queueDir = intake_queue_dir();
    $ttl      = intake_confirm_ttl();
    $created  = intake_queue_create($queueDir, [
        'source'       => $source,
        'source_label' => $sourceLabel,
        'name'         => $name,
        'company'      => $company,
        'contact'      => $contact,
        'topic'        => $topic,
        'ip'           => $clientIp,
    ], $uploads, $ttl);

    if ($created !== null) {
        $confirmUrl = intake_confirm_url(
            $created['token'],
            $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '',
            ($_SERVER['HTTPS'] ?? '') !== '' || ($_SERVER['REQUEST_SCHEME'] ?? 'https') === 'https'
        );
        $body = intake_render_template(intake_mail_confirm_template(), [
            'confirm_url' => $confirmUrl,
            'ttl_hours'   => (string) max(1, (int) round($ttl / 3600)),
            'тематика'    => $topic !== '' ? "Тематика: $topic" : '',
            'файлы'       => $uploads ? "\nФайлов приложено: " . count($uploads) . '.' : '',
            'сайт'        => (string) ($_SERVER['HTTP_HOST'] ?? 'ideav.ru'),
        ]);
        $mailed = intake_mail_send($contact, intake_mail_confirm_subject(), $body);

        if ($mailed) {
            intake_respond(200, [
                'ok'         => true,
                'status'     => 'pending_confirmation',
                'request_id' => $created['id'],
                'message'    => 'Мы отправили письмо на ' . $contact . '. Перейдите по ссылке из письма — и мы начнём собирать приложение. Ссылка действует '
                    . max(1, (int) round($ttl / 3600)) . ' ч.',
            ]);
        }

        // Письмо не ушло (почта хоста легла) — заявку не теряем: убираем её из
        // очереди и публикуем сразу, как делали до #624. Оператор увидит заявку
        // в Telegram и ответит руками.
        error_log('excel-to-app.php: письмо-подтверждение не отправлено, публикуем заявку напрямую: ' . $created['id']);
        $uploads = intake_queue_files($queueDir, $created['id']);
        $uploads = array_map(
            static fn(array $f): array => ['name' => $f['name'], 'tmp_name' => $f['path'], 'size' => (int) @filesize($f['path']), 'error' => UPLOAD_ERR_OK],
            $uploads
        );
        $requestId = $created['id'];
    } else {
        error_log('excel-to-app.php: очередь недоступна, публикуем заявку напрямую');
    }
}

// ── Публикация заявки: вложения → GitHub, issue, Telegram ─────────────────────
// Group all attachments of one request under a unique directory so the issue
// body can link to them. We avoid Date/random helpers being unavailable here —
// PHP has them — using a timestamp + short random suffix.
$requestId = $requestId ?? intake_queue_new_id();

$published = intake_publish_order(
    [
        'id'           => $requestId,
        'source_label' => $sourceLabel,
        'name'         => $name,
        'company'      => $company,
        'contact'      => $contact,
        'topic'        => $topic,
    ],
    array_map(static fn(array $f): array => ['name' => $f['name'], 'path' => $f['tmp_name']], $uploads)
);

if (!$published['ok']) {
    intake_respond($published['status'], array_filter([
        'ok'      => false,
        'error'   => $published['error'] ?? 'Не удалось принять заявку.',
        'details' => $published['details'] ?? null,
    ], static fn($v) => $v !== null));
}

intake_respond(200, [
    'ok'           => true,
    'status'       => 'accepted',
    'message'      => 'Заявка принята. Мы свяжемся с вами в ближайшее время.',
    'issue_url'    => $published['issue_url'],
    'issue_number' => $published['issue_number'],
    'attachments'  => count($published['attachments']),
    'telegram'     => $published['telegram'],
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
