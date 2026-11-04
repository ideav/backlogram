<?php
/**
 * Приём заявок сайта finmo.integram.io (issue #873). Заменяет формы Тильды.
 *
 * Самостоятельный файл, без внешних сервисов. Защита от спама: проверка
 * источника (Referer — этот же хост), honeypot и лимит по IP.
 *
 * Доставка: телеграм первым, почта вторым — дублем, если задан ORDER_EMAIL_TO.
 * Посетителю отвечаем успехом, если дошло хотя бы одним каналом.
 *
 * Конфигурация — из окружения или из order-config.php рядом (в git не входит,
 * образец — order-config.example.php). Окружение важнее. Секретов в репозитории нет.
 *
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID  уведомление в телеграм
 *   TELEGRAM_API_BASE                     прокси к Bot API (по умолчанию api.telegram.org)
 *   ORDER_EMAIL_TO                        почта для дубля
 *   ORDER_EMAIL_FROM                      отправитель (по умолчанию welcome@ideav.ru)
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

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
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Одна строка без управляющих символов, не длиннее $max символов. */
function order_clean($value, int $max): string {
    $value = preg_replace('/[\x00-\x1F\x7F]+/', ' ', (string) $value);
    return mb_substr(trim((string) $value), 0, $max);
}

function order_tg_send(string $text): bool {
    $token = order_config('TELEGRAM_BOT_TOKEN');
    $chat  = order_config('TELEGRAM_CHAT_ID');
    if ($token === null || $chat === null || !function_exists('curl_init')) {
        return false;
    }
    $base = rtrim((string) order_config('TELEGRAM_API_BASE', 'https://api.telegram.org'), '/');
    for ($i = 0; $i < 2; $i++) {
        $ch = curl_init($base . '/bot' . $token . '/sendMessage');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => ['chat_id' => $chat, 'text' => $text],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 6,
            CURLOPT_CONNECTTIMEOUT => 6,
        ]);
        $raw  = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($raw !== false && $code === 200) {
            $data = json_decode((string) $raw, true);
            if (!empty($data['ok'])) {
                return true;
            }
            error_log('finmo order.php: telegram API error: ' . substr((string) $raw, 0, 200));
            return false;
        }
    }
    return false;
}

function order_mail_send(string $subject, string $body): bool {
    $to = order_config('ORDER_EMAIL_TO');
    if ($to === null) {
        return false;
    }
    $from = order_config('ORDER_EMAIL_FROM', 'welcome@ideav.ru');
    // Тема и тело в base64: ни кириллица, ни длинные строки не ломают письмо.
    $headers = implode("\r\n", [
        'From: ' . $from,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
    ]);
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    return @mail($to, $encodedSubject, chunk_split(base64_encode($body)), $headers);
}

// ── Метод и источник ─────────────────────────────────────────────────────────
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    order_respond(405, ['ok' => false, 'error' => 'Метод не поддерживается.']);
}

$referer_host = strtolower(preg_replace('/:\d+$/', '', (string) parse_url($_SERVER['HTTP_REFERER'] ?? '', PHP_URL_HOST)));
$server_host  = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
if ($referer_host === '' || $referer_host !== $server_host) {
    order_respond(403, ['ok' => false, 'error' => 'Запрос должен приходить с этого сайта.']);
}

// ── Данные ───────────────────────────────────────────────────────────────────
$data = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($data)) {
    $data = $_POST;
}

// Honeypot: живой посетитель поля не видит. Боту отвечаем успехом.
if (trim((string) ($data['website'] ?? '')) !== '') {
    order_respond(200, ['ok' => true]);
}

$forms = [
    'callme' => 'Есть вопросы? Заказать звонок',
];
$form = (string) ($data['form'] ?? '');
if (!isset($forms[$form])) {
    order_respond(400, ['ok' => false, 'error' => 'Неизвестная форма.']);
}

$name  = order_clean($data['name'] ?? '', 200);
$phone = order_clean($data['phone'] ?? '', 50);
$email = order_clean($data['email'] ?? '', 200);
$task  = mb_substr(trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/', ' ', (string) ($data['task'] ?? ''))), 0, 2000);
$page  = order_clean($data['page'] ?? '', 200);
$utm   = order_clean($data['utm'] ?? '', 500);

if ($phone === '' && $email === '') {
    order_respond(400, ['ok' => false, 'error' => 'Укажите телефон или почту, чтобы мы могли ответить.']);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    order_respond(400, ['ok' => false, 'error' => 'Проверьте адрес почты.']);
}
if ($phone !== '' && preg_match_all('/\d/', $phone) < 5) {
    order_respond(400, ['ok' => false, 'error' => 'Проверьте номер телефона.']);
}

// ── Лимит: 3 заявки с одного IP за 10 минут ─────────────────────────────────
$ip    = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$stamp = sys_get_temp_dir() . '/finmo-order-' . sha1($ip);
$now   = time();
$hits  = [];
if (is_readable($stamp)) {
    $hits = array_filter(
        (array) json_decode((string) file_get_contents($stamp), true),
        static fn($t) => is_int($t) && $t > $now - 600
    );
}
if (count($hits) >= 3) {
    order_respond(429, ['ok' => false, 'error' => 'Слишком много заявок подряд. Попробуйте через несколько минут.']);
}
$hits[] = $now;
@file_put_contents($stamp, json_encode(array_values($hits)), LOCK_EX);

// ── Уведомление ──────────────────────────────────────────────────────────────
$subject = 'Заявка с ' . $server_host . ': ' . $forms[$form];
$lines = [$subject, '', 'Форма: ' . $form];
if ($name !== '')  { $lines[] = 'Имя: ' . $name; }
if ($phone !== '') { $lines[] = 'Телефон: ' . $phone; }
if ($email !== '') { $lines[] = 'Email: ' . $email; }
if ($task !== '')  { $lines[] = 'Задача: ' . $task; }
if ($page !== '')  { $lines[] = 'Страница: ' . $page; }
if ($utm !== '')   { $lines[] = 'UTM: ' . $utm; }
$body = implode("\n", $lines);

$sent_tg   = order_tg_send($body);
$sent_mail = order_mail_send($subject, $body);

if (!$sent_tg && !$sent_mail) {
    error_log('finmo order.php: заявка не доставлена ни в телеграм, ни почтой (форма ' . $form . ')');
    order_respond(500, ['ok' => false, 'error' => 'Не смогли отправить заявку. Напишите, пожалуйста, нам в телеграм или на почту support@ideav.online.']);
}

order_respond(200, ['ok' => true]);
