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
// Вид заявки (issue #596): demo — «пришлите Excel, соберём приложение»,
// razbor — запись на платный разбор заготовки, express — модальная заявка на
// экспресс-разработку из карточек цен (issue #619).
$kind    = in_array($data['kind'] ?? '', ['demo', 'express'], true) ? $data['kind'] : 'razbor';
// Отметка формы демонстрации (issue #659): человек хочет не только ссылку на
// приложение, но и практикум — час разбора с ведущим. Для сборки это та же
// заявка demo; меняются только тема и строка в тексте для оператора.
$praktikum = $kind === 'demo' && ($data['format'] ?? '') === 'praktikum';
// Карточка цен, с которой открыта модальная заявка; только для учёта.
$plan    = mb_substr(trim(preg_replace('/[\x00-\x1F]+/', ' ', (string) ($data['plan'] ?? ''))), 0, 200);
// Посадочная, с которой пришла заявка (issue #657): `page` — адрес страницы
// (`?from=<slug>`), `utm` — метки рекламы. Только для учёта.
$page    = preg_replace('/[^a-z0-9-]/', '', mb_substr((string) ($data['page'] ?? ''), 0, 80));
$utm     = mb_substr(trim(preg_replace('/[\x00-\x1F]+/', ' ', (string) ($data['utm'] ?? ''))), 0, 500);

// Honeypot: живой посетитель этого поля не видит, значит заполнить его мог
// только автомат. Отвечаем успехом, чтобы боту нечего было узнать из ответа.
if ($trap !== '') {
    order_respond(200, ['ok' => true]);
}

// Обязателен только контакт (issue #596): имя и описание не должны мешать
// человеку просто прислать файл. Пустое описание допустимо, если есть файлы
// (проверка ниже, после разбора вложений).
if ($contact === '') {
    order_respond(400, ['ok' => false, 'error' => 'Укажите контакт — почту, телефон или телеграм, куда ответить.']);
}
if ($consent === '') {
    order_respond(400, ['ok' => false, 'error' => 'Без согласия на обработку данных отправить нельзя.']);
}
if (mb_strlen($task) > 5000 || mb_strlen($name) > 200 || mb_strlen($contact) > 200) {
    order_respond(400, ['ok' => false, 'error' => 'Слишком длинно — сократите, пожалуйста.']);
}

// ── Вложения (issue #596): Excel и ТЗ из формы демонстрации ─────────────────
// До 5 файлов по 10 МБ; после текста заявки уходят тем же ботом (sendDocument).
$ORDER_MAX_FILES  = 5;
$ORDER_MAX_BYTES  = 10 * 1024 * 1024;
$ORDER_ALLOWED    = ['xlsx', 'xls', 'csv', 'ods', 'doc', 'docx', 'pdf', 'txt'];

$attachments = []; // [{tmp, name, size}]
if (!empty($_FILES['files'])) {
    $f     = $_FILES['files'];
    $names = is_array($f['name'])     ? $f['name']     : [$f['name']];
    $tmps  = is_array($f['tmp_name']) ? $f['tmp_name'] : [$f['tmp_name']];
    $sizes = is_array($f['size'])     ? $f['size']     : [$f['size']];
    $errs  = is_array($f['error'])    ? $f['error']    : [$f['error']];

    if (count($names) > $ORDER_MAX_FILES) {
        order_respond(400, ['ok' => false, 'error' => "Не больше $ORDER_MAX_FILES файлов — остальное дошлите в телеграм."]);
    }
    foreach ($names as $i => $origName) {
        $err = $errs[$i] ?? UPLOAD_ERR_NO_FILE;
        if ($err === UPLOAD_ERR_NO_FILE) continue;
        $size = (int) ($sizes[$i] ?? 0);
        $ext  = strtolower(pathinfo((string) $origName, PATHINFO_EXTENSION));
        if ($err !== UPLOAD_ERR_OK
            || !is_uploaded_file((string) ($tmps[$i] ?? ''))
            || $size <= 0 || $size > $ORDER_MAX_BYTES
            || !in_array($ext, $ORDER_ALLOWED, true)) {
            order_respond(400, [
                'ok'    => false,
                'error' => 'Файл «' . $origName . '» не принят: до 10 МБ, форматы ' . implode(', ', $ORDER_ALLOWED) . '.',
            ]);
        }
        $safe = trim(preg_replace('/[\x00-\x1F]+/', ' ', basename(str_replace('\\', '/', (string) $origName))));
        $attachments[] = ['tmp' => (string) $tmps[$i], 'name' => $safe !== '' ? $safe : 'file', 'size' => $size];
    }
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

// Демонстрации и экспресс-разработке нужен материал: файл или хотя бы пара слов о задаче.
if ($kind !== 'razbor' && $task === '' && !$attachments) {
    order_respond(400, ['ok' => false, 'error' => 'Приложите файл или напишите пару слов о задаче.']);
}

// ── Уведомление ──────────────────────────────────────────────────────────────
$subject = [
    'demo'    => 'Заявка на демонстрацию (Excel → приложение)',
    'express' => 'Заявка на экспресс-разработку приложений',
    'razbor'  => 'Заявка на разбор',
][$kind];
if ($praktikum) {
    $subject = 'Заявка на практикум «Свой первый ИИ-проект за час»';
}
$lines = [
    $subject . ' с ' . $server_host,
    '',
    'Имя:     ' . ($name !== '' ? $name : '(не указано)'),
    'Контакт: ' . $contact,
];
if ($plan !== '') {
    $lines[] = 'Карточка: ' . $plan;
}
if ($page !== '') {
    $lines[] = 'Страница: /' . $page . '/';
}
if ($utm !== '') {
    $lines[] = 'UTM: ' . $utm;
}
if ($praktikum) {
    $lines[] = 'Формат: практикум — собрать приложение и согласовать час разбора';
}
array_push($lines,
    '',
    'Задача:',
    $task !== '' ? $task : '(без описания — смотри файлы)'
);
if ($attachments) {
    $lines[] = '';
    $lines[] = 'Файлы: ' . count($attachments) . ' шт — придут следом.';
}
$body = implode("\n", $lines);

// ── Подтверждение адреса (issue #624) ───────────────────────────────────────
// Заявка на демонстрацию с email-контактом уходит оператору и сборщику не
// сразу: сначала на этот адрес идёт письмо со ссылкой. Причина — сборку делает
// ИИ-агент, и заявка с опечаткой в адресе означает оплаченную сборку, о
// которой никто не узнает. Остальные виды заявок (razbor, express) и
// телеграм-контакты идут как раньше: за ними нет автоматической сборки, а
// лишний шаг там только теряет лид.
//
// Контур, конфигурация и раскладка по серверу — docs/issue-624-double-optin-loop.md.
require_once __DIR__ . '/order-intake.php';

if (order_confirm_needed($kind, $contact)) {
    $pending = order_confirm_start($subject, $body, $contact, $attachments, $server_host);
    // null — контур не сработал (очередь недоступна): заявку не теряем и
    // доставляем обычным путём ниже.
    if ($pending !== null) {
        order_respond($pending['status'], $pending['payload']);
    }
}

// ── Очередь + доставка ──────────────────────────────────────────────────────
// Канал до Telegram-прокси нестабилен (маршрут между дата-центрами теряет
// большинство TCP-соединений), поэтому заявка СНАЧАЛА сохраняется на диск,
// и только потом делается попытка доставить. Не доставилось — доберёт cron
// (order-deliver.php). Посетителю в обоих случаях отвечаем успехом: заявка
// уже не потеряется.
require_once __DIR__ . '/order-lib.php';

$spool = order_spool_dir();
$saved = order_spool_save($spool, [
    'subject' => $subject,
    'body'    => $body,
    'contact' => $contact,
], $attachments);

if ($saved === null) {
    // Спул не записался (нет прав/места) — доставляем в лоб, как раньше;
    // при неудаче честно признаёмся.
    $ok = order_deliver_message($body) && order_deliver_files($attachments, $contact);
    order_mail_copy($subject, $name, $body, $server_host);
    if (!$ok) {
        error_log('order.php: spool недоступен и доставка не удалась');
        order_respond(500, ['ok' => false, 'error' => 'Не смогли доставить заявку. Напишите, пожалуйста, в телеграм @Integrammbot.']);
    }
    order_respond(200, ['ok' => true]);
}

// Попытка доставить сразу (2 захода) — в большинстве случаев дойдёт, и cron
// ничего добирать не придётся.
if (order_spool_deliver($saved)) {
    order_spool_cleanup($saved);
}
order_mail_copy($subject, $name, $body, $server_host);

order_respond(200, ['ok' => true]);
