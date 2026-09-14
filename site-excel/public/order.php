<?php
/**
 * Приём заявок лендинга «Excel → приложение» на отдельном домене.
 *
 * Самостоятельный файл: с эндпоинтами основного сайта кода не делит, потому что
 * те завязаны на движок и капчу, которых на этом хосте нет. Защита от спама
 * низкотехнологичная и без внешних сервисов — проверка источника, honeypot и
 * лимит по IP; страница не делает ни одного запроса наружу.
 *
 * Доставка: телеграм первым, почта вторым. Так, а не наоборот, потому что у
 * доменов компании нет DMARC и письма ложатся в спам — заявка, ушедшая только
 * почтой, с высокой вероятностью не будет прочитана.
 *
 * Конфигурация — из окружения или из order-config.php рядом (в git не входит),
 * который define()-ит те же имена. Окружение всегда важнее. Секретов в
 * репозитории нет.
 *
 *   TELEGRAM_BOT_TOKEN  токен бота для уведомления
 *   TELEGRAM_CHAT_ID    чат, куда падают заявки
 *   ORDER_EMAIL_TO      почта для дубля уведомления
 *   ORDER_EMAIL_FROM    отправитель конверта  (по умолчанию noreply@<host>)
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
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
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
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

$name    = trim((string) ($data['name'] ?? ''));
$contact = trim((string) ($data['contact'] ?? ''));
$task    = trim((string) ($data['task'] ?? ''));
$consent = (string) ($data['consent'] ?? '');
$trap    = trim((string) ($data['website'] ?? ''));

// Honeypot: живой посетитель этого поля не видит, значит заполнить его мог
// только автомат. Отвечаем успехом, чтобы боту нечего было узнать из ответа.
if ($trap !== '') {
    order_respond(200, ['ok' => true]);
}

if ($name === '' || $contact === '' || $task === '') {
    order_respond(400, ['ok' => false, 'error' => 'Заполните имя, контакт и пару слов о задаче.']);
}
if ($consent === '') {
    order_respond(400, ['ok' => false, 'error' => 'Без согласия на обработку данных отправить нельзя.']);
}
if (mb_strlen($task) > 5000 || mb_strlen($name) > 200 || mb_strlen($contact) > 200) {
    order_respond(400, ['ok' => false, 'error' => 'Слишком длинно — сократите, пожалуйста.']);
}

// ── Лимит: 3 заявки с одного IP за 10 минут ─────────────────────────────────
$ip    = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$stamp = sys_get_temp_dir() . '/excel-order-' . sha1($ip);
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
$lines = [
    'Заявка на разбор с ' . $server_host,
    '',
    'Имя:     ' . $name,
    'Контакт: ' . $contact,
    '',
    'Задача:',
    $task,
];
$body = implode("\n", $lines);

$sent = false;

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
    $sent   = $result !== false;
}

$to = order_config('ORDER_EMAIL_TO');
if ($to !== null) {
    $from    = order_config('ORDER_EMAIL_FROM', 'noreply@' . $server_host);
    $headers = [
        'From: Excel-лендинг <' . $from . '>',
        'Content-Type: text/plain; charset=UTF-8',
    ];
    $sent = @mail($to, 'Заявка на разбор: ' . $name, $body, implode("\r\n", $headers)) || $sent;
}

if (!$sent) {
    // Иначе заявка просто исчезает — честнее сказать, чем показать успех.
    error_log('order.php: канал доставки не настроен или доставка не удалась');
    order_respond(500, ['ok' => false, 'error' => 'Не смогли доставить заявку. Напишите, пожалуйста, в телеграм @Integrammbot.']);
}

order_respond(200, ['ok' => true]);
