<?php
/**
 * Мост «подтверждённая заявка → сборщик → письмо клиенту» (issue #624).
 *
 * Вторая половина контура. Сборку выполняет @Integrammbot из приватного
 * репозитория, и связка сделана **очередью, которую забирает сборщик**, а не
 * вызовом сборщика из PHP:
 *   - веб-хост не достаёт до машины сборщика (и не должен: это значило бы
 *     держать во фронтовом PHP доступ в контур сборки);
 *   - pull переживает перезапуски и обновления бота: работа лежит в очереди и
 *     дождётся, а не теряется в неудавшемся исходящем запросе;
 *   - claim/deliver делают шаг идемпотентным: заявка уходит в сборку один раз,
 *     повторный claim её уже не видит.
 *
 * Протокол (POST, `Authorization: Bearer <INTAKE_BUILD_TOKEN>`):
 *   action=claim   [limit=1..20]      → забрать подтверждённые заявки (confirmed → building)
 *   action=deliver request_id, app_url, admin_login, admin_password, what_inside…
 *                                     → отправить клиенту письмо «приложение готово», building → delivered
 *   action=fail    request_id, reason → building → failed + сигнал оператору в Telegram
 *   action=status  request_id         → текущее состояние заявки
 *
 * Токен моста живёт только в окружении (INTAKE_BUILD_TOKEN). Не задан —
 * эндпоинт отвечает 503 и ничего не делает: открытым он не бывает.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/intake-shared.php';
require_once __DIR__ . '/intake-queue.php';
require_once __DIR__ . '/intake-mail.php';

// Optional config file with define()s (git-ignored). Environment still wins.
$config_file = __DIR__ . '/telegram-config.php';
if (file_exists($config_file)) {
    require_once $config_file;
}

function build_respond(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Bearer-токен из заголовка (или X-Build-Token — не все прокси пропускают Authorization). */
function build_request_token(array $server): string {
    $auth = (string) ($server['HTTP_AUTHORIZATION'] ?? $server['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (preg_match('/^Bearer\s+(.+)$/i', trim($auth), $m) === 1) {
        return trim($m[1]);
    }
    return trim((string) ($server['HTTP_X_BUILD_TOKEN'] ?? ''));
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    build_respond(405, ['ok' => false, 'error' => 'Method not allowed.']);
}

$expectedToken = (string) intake_config('INTAKE_BUILD_TOKEN', '');
if ($expectedToken === '') {
    build_respond(503, ['ok' => false, 'error' => 'Build bridge is not configured.']);
}
if (!hash_equals($expectedToken, build_request_token($_SERVER))) {
    build_respond(401, ['ok' => false, 'error' => 'Unauthorized.']);
}

// Поля принимаем и формой, и JSON-телом — сборщику удобнее JSON.
$input = $_POST;
if (!$input) {
    $decoded = json_decode((string) file_get_contents('php://input'), true);
    if (is_array($decoded)) {
        $input = $decoded;
    }
}

$action   = trim((string) ($input['action'] ?? ''));
$queueDir = intake_queue_dir();

// ── claim: забрать подтверждённые заявки в работу ────────────────────────────
if ($action === 'claim') {
    $limit = (int) ($input['limit'] ?? 5);
    $limit = max(1, min(20, $limit));
    $jobs  = [];
    foreach (intake_queue_claim($queueDir, $limit) as $record) {
        $jobs[] = [
            'id'           => (string) $record['id'],
            'source'       => (string) ($record['source'] ?? ''),
            'source_label' => (string) ($record['source_label'] ?? ''),
            'name'         => (string) ($record['name'] ?? ''),
            'company'      => (string) ($record['company'] ?? ''),
            'contact'      => (string) ($record['contact'] ?? ''),
            'topic'        => (string) ($record['topic'] ?? ''),
            'confirmed_at' => (int) ($record['confirmed_at'] ?? 0),
            'issue_url'    => (string) ($record['issue_url'] ?? ''),
            'issue_number' => $record['issue_number'] ?? null,
            'attachments'  => array_values((array) ($record['attachments'] ?? [])),
        ];
    }
    build_respond(200, ['ok' => true, 'jobs' => $jobs, 'count' => count($jobs)]);
}

// Остальные действия работают с конкретной заявкой.
$requestId = trim((string) ($input['request_id'] ?? ''));
$record    = $requestId !== '' ? intake_queue_load($queueDir, $requestId) : null;
if ($record === null) {
    build_respond(404, ['ok' => false, 'error' => 'Заявка не найдена: ' . $requestId]);
}

// ── status: посмотреть состояние заявки ──────────────────────────────────────
if ($action === 'status') {
    unset($record['token_hash']);
    build_respond(200, ['ok' => true, 'request' => $record]);
}

// ── deliver: сборка готова → письмо клиенту ──────────────────────────────────
if ($action === 'deliver') {
    if (($record['status'] ?? '') === INTAKE_STATUS_DELIVERED) {
        // Повторный отчёт о той же сборке: второго письма клиент не получит.
        build_respond(200, ['ok' => true, 'already' => true, 'status' => INTAKE_STATUS_DELIVERED]);
    }

    $appUrl = trim((string) ($input['app_url'] ?? ''));
    $login  = trim((string) ($input['admin_login'] ?? ''));
    $pass   = trim((string) ($input['admin_password'] ?? ''));
    $inside = trim((string) ($input['what_inside'] ?? ''));
    if ($appUrl === '' || $login === '' || $pass === '') {
        build_respond(400, ['ok' => false, 'error' => 'Нужны app_url, admin_login и admin_password.']);
    }

    $contact = (string) ($record['contact'] ?? '');
    if (!intake_is_email($contact)) {
        build_respond(409, ['ok' => false, 'error' => 'У заявки не email-контакт — результат отправляется вручную: ' . $contact]);
    }

    $topic      = trim((string) ($input['topic'] ?? ($record['topic'] ?? '')));
    $topicShort = trim((string) ($input['topic_short'] ?? ''));
    $body = intake_render_template(intake_mail_app_ready_template(), [
        'тематика'         => $topic !== '' ? $topic : 'ваша задача из заявки',
        'app_url'          => $appUrl,
        'admin_login'      => $login,
        'admin_password'   => $pass,
        'что_внутри'       => $inside !== '' ? $inside : '— Приложение собрано по вашему файлу: справочники, рабочие места и логика, которую в нём видно.',
        'цена_разбора'     => trim((string) ($input['price_razbor'] ?? '20 000 ₽')),
        'вилка_разработки' => trim((string) ($input['dev_range'] ?? '50–100 тыс. ₽')),
    ]);

    $sent = intake_mail_send($contact, intake_mail_app_ready_subject($topicShort), $body);
    if (!$sent) {
        // Статус не двигаем: сборщик может повторить deliver, и письмо уйдёт
        // со второй попытки. Молча «доставленной» заявка не станет.
        error_log('excel-to-app-build.php: письмо-результат не отправлено для ' . $requestId);
        build_respond(502, ['ok' => false, 'error' => 'Письмо не отправлено — повторите запрос.']);
    }

    intake_queue_mark($queueDir, $requestId, INTAKE_STATUS_DELIVERED, [
        'delivered_at' => time(),
        'app_url'      => $appUrl,
    ]);
    build_respond(200, ['ok' => true, 'status' => INTAKE_STATUS_DELIVERED, 'mailed_to' => $contact]);
}

// ── fail: сборка не удалась → к оператору ────────────────────────────────────
if ($action === 'fail') {
    $reason = trim((string) ($input['reason'] ?? 'без объяснения'));
    intake_queue_mark($queueDir, $requestId, INTAKE_STATUS_FAILED, ['fail_reason' => $reason]);

    $botToken = (string) intake_config('TELEGRAM_BOT_TOKEN', '');
    $chatId   = (string) intake_config('TELEGRAM_CHAT_ID', '');
    if ($botToken !== '' && $chatId !== '') {
        $tgBase  = (string) intake_config('TELEGRAM_API_BASE', 'https://api.telegram.org');
        $message = "*Сборка не удалась*\n"
            . '🆔 ' . intake_escape_markdown($requestId) . "\n"
            . '📬 ' . intake_escape_markdown((string) ($record['contact'] ?? '')) . "\n"
            . '⚠️ ' . intake_escape_markdown($reason);
        intake_telegram_send_message($botToken, $chatId, $message, $tgBase);
    }
    build_respond(200, ['ok' => true, 'status' => INTAKE_STATUS_FAILED]);
}

build_respond(400, ['ok' => false, 'error' => 'Неизвестное действие: ' . $action]);
