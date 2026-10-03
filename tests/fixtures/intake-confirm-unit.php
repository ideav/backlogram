<?php
/**
 * Unit-проверки чистых функций замкнутого контура (issue #624):
 * public/intake-mail.php и public/intake-queue.php.
 *
 * Выход 0 — всё сошлось; иначе печатает провалившиеся проверки и выходит с 1.
 */

require __DIR__ . '/../../public/intake-mail.php';
require __DIR__ . '/../../public/intake-queue.php';

$failures = 0;
function check(string $label, bool $cond): void {
    global $failures;
    if (!$cond) {
        fwrite(STDERR, "FAIL: $label\n");
        $failures++;
    }
}

// ── intake_is_email ──────────────────────────────────────────────────────────
check('email распознан', intake_is_email('ivan@example.com'));
check('email с пробелами по краям', intake_is_email('  ivan@example.com  '));
check('телеграм — не email', !intake_is_email('@ivanov'));
check('телефон — не email', !intake_is_email('+7 999 000-00-00'));
check('email с хвостом — не email', !intake_is_email('ivan@example.com или @ivanov'));
check('пустой контакт — не email', !intake_is_email(''));
// Инъекция заголовка: перевод строки в адресе не должен пройти дальше.
check('перевод строки в адресе отбит', !intake_is_email("ivan@example.com\nBcc: evil@example.com"));
check('возврат каретки в адресе отбит', !intake_is_email("ivan@example.com\r\nBcc: evil@example.com"));

// ── intake_mime_encode_header ────────────────────────────────────────────────
check('ascii-тема не кодируется', intake_mime_encode_header('Order is ready') === 'Order is ready');
$encoded = intake_mime_encode_header('Приложение готово');
check('кириллица кодируется как =?UTF-8?B?', str_starts_with($encoded, '=?UTF-8?B?'));
check('кодированное слово закрыто', str_ends_with($encoded, '?='));
check(
    'кодированная тема декодируется обратно',
    iconv_mime_decode($encoded, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8') === 'Приложение готово'
);
// Длинная кириллическая тема должна разбиться на несколько кодированных слов,
// каждое — короче 76 символов (RFC 2047), иначе тема бьётся у части клиентов.
$long    = intake_mime_encode_header(str_repeat('Приложение для интернет-магазина ', 4));
$words   = explode("\r\n ", $long);
check('длинная тема разбита на несколько слов', count($words) > 1);
check('каждое кодированное слово короче 76 символов', count(array_filter($words, static fn($w) => strlen($w) > 75)) === 0);
check(
    'длинная тема декодируется без потерь',
    iconv_mime_decode($long, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8') === str_repeat('Приложение для интернет-магазина ', 4)
);

// ── intake_mail_header_value ─────────────────────────────────────────────────
check('из заголовка вычищен CRLF', intake_mail_header_value("a\r\nBcc: x@y.z") === 'a Bcc: x@y.z');

// ── intake_mail_build ───────────────────────────────────────────────────────
$mail = intake_mail_build('Тема', ['from' => 'welcome@ideav.ru', 'from_name' => 'Интеграм', 'reply_to' => 'abc@integram.io']);
check('конверт подписан адресом отправителя', $mail['from'] === 'welcome@ideav.ru');
check('From собран с именем', str_contains($mail['headers'], '<welcome@ideav.ru>'));
check('имя отправителя MIME-кодировано', str_contains($mail['headers'], '=?UTF-8?B?'));
check('Reply-To на месте', str_contains($mail['headers'], 'Reply-To: abc@integram.io'));
check('тело объявлено UTF-8', str_contains($mail['headers'], 'Content-Type: text/plain; charset=UTF-8'));
check('кодировка передачи 8bit', str_contains($mail['headers'], 'Content-Transfer-Encoding: 8bit'));
check('без Bcc, если не задан', !str_contains($mail['headers'], 'Bcc:'));
$withBcc = intake_mail_build('Тема', ['bcc' => 'me@ideav.ru']);
check('Bcc добавляется, если задан', str_contains($withBcc['headers'], 'Bcc: me@ideav.ru'));
$badBcc = intake_mail_build('Тема', ['bcc' => 'не адрес']);
check('мусорный Bcc не попадает в заголовки', !str_contains($badBcc['headers'], 'Bcc:'));

// ── intake_mail_send: адрес проверяется до отправки ─────────────────────────
$sent = [];
$spy  = function (string $to, string $subject, string $body, string $headers, string $params) use (&$sent): bool {
    $sent[] = compact('to', 'subject', 'body', 'headers', 'params');
    return true;
};
check('письмо на кривой адрес не отправляется', !intake_mail_send('не адрес', 'Тема', 'Тело', [], $spy));
check('на кривой адрес транспорт не зовётся', $sent === []);
check('письмо на нормальный адрес отправляется', intake_mail_send('ivan@example.com', 'Тема', "стр1\nстр2", [], $spy));
check('транспорт получил конверт -f', isset($sent[0]) && str_starts_with($sent[0]['params'], '-f'));
check('тело переведено в CRLF', isset($sent[0]) && str_contains($sent[0]['body'], "стр1\r\nстр2"));

// ── intake_render_template ──────────────────────────────────────────────────
check(
    'плейсхолдеры подставляются, в том числе кириллические',
    intake_render_template('{{app_url}} / {{тематика}}', ['app_url' => 'https://x', 'тематика' => 'чай']) === 'https://x / чай'
);
check(
    'неизвестный плейсхолдер остаётся видимым',
    intake_render_template('{{нет_такого}}', ['a' => 'b']) === '{{нет_такого}}'
);

// ── Шаблоны писем ───────────────────────────────────────────────────────────
$confirm = intake_mail_confirm_template();
check('в письме-подтверждении есть ссылка', str_contains($confirm, '{{confirm_url}}'));
check('в письме-подтверждении назван срок', str_contains($confirm, '{{ttl_hours}}'));
$ready = intake_mail_app_ready_template();
foreach (['{{app_url}}', '{{admin_login}}', '{{admin_password}}', '{{что_внутри}}', '{{цена_разбора}}', '{{вилка_разработки}}'] as $ph) {
    check("в письме-результате есть $ph", str_contains($ready, $ph));
}
// Форма #622: в письме только доступ администратора, остальные пароли — на info.html.
check('письмо-результат отправляет за паролями ролей на страницу приложения', str_contains($ready, 'главной странице приложения'));
check('письмо-результат не раздаёт пароли ролей', !str_contains($ready, '{{password}}'));
check('тема результата содержит тематику', intake_mail_app_ready_subject('интернет-магазина') === 'Ваше приложение для интернет-магазина готово — Интеграм');
check('тема результата без тематики не ломается', intake_mail_app_ready_subject('') === 'Ваше приложение готово — Интеграм');

// ── Вебрут в CLI: DOCUMENT_ROOT задан, но пуст ─────────────────────────────
// PHP CLI кладёт в $_SERVER['DOCUMENT_ROOT'] пустую строку, а не оставляет
// ключ незаданным, поэтому `?? __DIR__` на него не срабатывает. Из-за этого
// крон доставки лендинга считал путь спула от «» и две недели молча выходил.
$savedRoot = $_SERVER['DOCUMENT_ROOT'] ?? null;
$_SERVER['DOCUMENT_ROOT'] = '';
check(
    'пустой DOCUMENT_ROOT не даёт пути от корня',
    strpos(intake_queue_dir(), '/excel-to-app-queue') > 1
);
$_SERVER['DOCUMENT_ROOT'] = '/var/www/site.ru';
check(
    'заданный DOCUMENT_ROOT берётся как есть',
    intake_queue_dir() === '/var/www/excel-to-app-queue'
);
if ($savedRoot === null) {
    unset($_SERVER['DOCUMENT_ROOT']);
} else {
    $_SERVER['DOCUMENT_ROOT'] = $savedRoot;
}

// ── Сторож зависшего спула ─────────────────────────────────────────────────
// Доставку чинить некому, если о поломке никто не узнаёт: раньше о заявке,
// висящей в спуле, писалось только в лог через 14 дней.
$spoolDir = sys_get_temp_dir() . '/intake-spool-unit-' . bin2hex(random_bytes(4));
mkdir($spoolDir, 0700, true);
$meta = ['created' => 1000, 'body' => 'Заявка на демонстрацию, текст для оператора'];

$sentTo = [];
$capture = static function (string $to) use (&$sentTo): bool {
    $sentTo[] = $to;
    return true;
};
putenv('INTAKE_MAIL_TRANSPORT=file');
putenv('INTAKE_MAIL_FILE=' . $spoolDir . '/alert-mail.log');
putenv('INTAKE_SPOOL_STUCK_AFTER=3600');

check('свежая заявка тревоги не поднимает', intake_spool_alert($spoolDir, $meta, 'тест', 1000 + 60) === false);
check('метки ещё нет', !file_exists($spoolDir . '/alerted'));
check('залежавшаяся заявка поднимает тревогу', intake_spool_alert($spoolDir, $meta, 'тест', 1000 + 7200) === true);
check('повторно не дёргает', intake_spool_alert($spoolDir, $meta, 'тест', 1000 + 10800) === false);
$alertLog = (string) @file_get_contents($spoolDir . '/alert-mail.log');
check('в письме есть текст заявки — её можно отработать руками', str_contains($alertLog, 'текст для оператора'));
check('в письме сказано, какой спул', str_contains($alertLog, 'тест'));
check('заявка без времени создания тревоги не поднимает', intake_spool_alert($spoolDir . '/nope', ['body' => 'x'], 'тест', 99999) === false);
putenv('INTAKE_MAIL_TRANSPORT');
putenv('INTAKE_MAIL_FILE');
putenv('INTAKE_SPOOL_STUCK_AFTER');
@unlink($spoolDir . '/alerted');
@unlink($spoolDir . '/alert-mail.log');
@rmdir($spoolDir);

// ── intake_queue_path: id из URL не должен выводить из каталога ─────────────
check('нормальный id даёт путь', intake_queue_path('/q', '20260929-210000-1a2b3c4d') === '/q/20260929-210000-1a2b3c4d');
check('обход каталога отбит', intake_queue_path('/q', '../../etc') === null);
check('абсолютный путь отбит', intake_queue_path('/q', '/etc/passwd') === null);
check('пустой id отбит', intake_queue_path('/q', '') === null);
check('id с точками отбит', intake_queue_path('/q', '20260929-210000-1a2b3c4d/..') === null);

// ── intake_queue_parse_token ────────────────────────────────────────────────
$secret = str_repeat('ab', 32);
$parsed = intake_queue_parse_token('20260929-210000-1a2b3c4d.' . $secret);
check('токен разобран', is_array($parsed) && $parsed['id'] === '20260929-210000-1a2b3c4d' && $parsed['secret'] === $secret);
check('токен без точки отбит', intake_queue_parse_token('20260929-210000-1a2b3c4d') === null);
check('токен с двумя точками отбит', intake_queue_parse_token('a.b.c') === null);
check('короткий секрет отбит', intake_queue_parse_token('20260929-210000-1a2b3c4d.abc') === null);
check('секрет не в hex отбит', intake_queue_parse_token('20260929-210000-1a2b3c4d.' . str_repeat('z', 64)) === null);
check('пустой токен отбит', intake_queue_parse_token('') === null);

// ── intake_confirm_url ─────────────────────────────────────────────────────
putenv('INTAKE_CONFIRM_URL');
$url = intake_confirm_url('20260929-210000-1a2b3c4d.' . $secret, 'ideav.ru');
check('ссылка собрана по хосту', str_starts_with($url, 'https://ideav.ru/excel-to-app-confirm.php?token='));
check('токен в ссылке целиком', str_contains($url, '20260929-210000-1a2b3c4d.' . $secret));
putenv('INTAKE_CONFIRM_URL=https://example.com/c.php?x=1');
check('заданная база уважается и параметр добавляется через &',
    intake_confirm_url('t.' . $secret) === 'https://example.com/c.php?x=1&token=' . rawurlencode('t.' . $secret));
putenv('INTAKE_CONFIRM_URL');

// ── intake_confirm_ttl: по решению владельца — 24 часа ─────────────────────
putenv('INTAKE_CONFIRM_TTL');
check('TTL по умолчанию — 24 часа', intake_confirm_ttl() === 86400);
putenv('INTAKE_CONFIRM_TTL=3600');
check('TTL настраивается', intake_confirm_ttl() === 3600);
putenv('INTAKE_CONFIRM_TTL=0');
check('нулевой TTL не отключает подтверждение', intake_confirm_ttl() === 86400);
putenv('INTAKE_CONFIRM_TTL');

// ── Полный цикл очереди на настоящем каталоге ──────────────────────────────
$queue = sys_get_temp_dir() . '/intake-queue-unit-' . bin2hex(random_bytes(4));
$src   = sys_get_temp_dir() . '/intake-upload-' . bin2hex(random_bytes(4)) . '.csv';
file_put_contents($src, "a;b\n1;2\n");

$created = intake_queue_create($queue, [
    'source'       => 'excel-to-app',
    'source_label' => 'Excel → приложение',
    'contact'      => 'ivan@example.com',
    'topic'        => 'учёт заказов',
], [['name' => 'заказы.csv', 'tmp_name' => $src, 'size' => filesize($src)]], 86400, 1000);

check('заявка создана', is_array($created) && isset($created['id'], $created['token']));
$id = (string) $created['id'];
check('статус — ожидание подтверждения', ($created['record']['status'] ?? '') === INTAKE_STATUS_PENDING);
check('срок подтверждения посчитан от «сейчас»', (int) ($created['record']['confirm_expires'] ?? 0) === 1000 + 86400);

$record = intake_queue_load($queue, $id);
check('заявка читается с диска', is_array($record) && $record['contact'] === 'ivan@example.com');
check('в файле заявки лежит только хеш токена', !str_contains((string) json_encode($record), explode('.', (string) $created['token'])[1]));
$files = intake_queue_files($queue, $id);
check('вложение перенесено в очередь', count($files) === 1 && is_file($files[0]['path']));
check('содержимое вложения сохранено', file_get_contents($files[0]['path']) === "a;b\n1;2\n");
check('имя вложения обезврежено', $files[0]['name'] !== '' && !str_contains($files[0]['name'], '/'));

// ── Заявка с байтами не в UTF-8 ────────────────────────────────────────────
// Найдено при выкатке 03.10.2026: json_encode отказывался кодировать такую
// запись, file_put_contents молча писал пустую строку и возвращал 0 (не false),
// и в очереди оставался request.json на 0 байт. Снаружи всё выглядело успешно:
// клиенту сказали «письмо отправлено», а подтверждать было уже нечего.
$broken = intake_queue_create($queue, [
    'source'  => 'excel-to-app',
    'contact' => 'cp1251@example.com',
    // «Диагностика» в CP1251 — так приходит текст от клиента со старой кодировкой.
    'topic'   => hex2bin('c4e8e0e3edeef1f2e8eae0'),
], [], 86400, 1000);
check('заявка с битой кодировкой всё равно создаётся', is_array($broken));
$brokenId = (string) ($broken['id'] ?? '');
check(
    'request.json не пустой',
    $brokenId !== '' && filesize($queue . '/' . $brokenId . '/request.json') > 0
);
check('заявка с битой кодировкой читается обратно', is_array(intake_queue_load($queue, $brokenId)));
check(
    'битые байты заменены, остальное на месте',
    (intake_queue_load($queue, $brokenId)['contact'] ?? '') === 'cp1251@example.com'
);
check(
    'подтвердить такую заявку можно',
    intake_queue_confirm($queue, (string) $broken['token'], 1000 + 60)['status'] === 'ok'
);
check(
    'после подтверждения запись не обнулилась',
    filesize($queue . '/' . $brokenId . '/request.json') > 0
        && (intake_queue_load($queue, $brokenId)['status'] ?? '') === INTAKE_STATUS_CONFIRMED
);
intake_queue_remove($queue, $brokenId);

// Чужой токен той же заявки не подходит.
$wrong = intake_queue_confirm($queue, $id . '.' . str_repeat('cd', 32));
check('подтверждение чужим секретом не проходит', $wrong['status'] === 'not_found');
check('после неудачной попытки заявка всё ещё ждёт', (intake_queue_load($queue, $id)['status'] ?? '') === INTAKE_STATUS_PENDING);

// Просроченная ссылка.
$expired = intake_queue_confirm($queue, (string) $created['token'], 1000 + 86401);
check('просроченная ссылка отбита', $expired['status'] === 'expired');
check('просроченная попытка не подтверждает заявку', (intake_queue_load($queue, $id)['status'] ?? '') === INTAKE_STATUS_PENDING);

// Подтверждение в срок.
$ok = intake_queue_confirm($queue, (string) $created['token'], 1000 + 60);
check('ссылка в срок подтверждает заявку', $ok['status'] === 'ok');
check('статус стал confirmed', (intake_queue_load($queue, $id)['status'] ?? '') === INTAKE_STATUS_CONFIRMED);
check('время подтверждения записано', (int) (intake_queue_load($queue, $id)['confirmed_at'] ?? 0) === 1000 + 60);

// Повторный переход по той же ссылке — «уже подтверждено», не вторая сборка.
$again = intake_queue_confirm($queue, (string) $created['token'], 1000 + 120);
check('повторный переход идемпотентен', $again['status'] === 'already');
check('хеш токена остаётся — одноразовость держит статус', isset(intake_queue_load($queue, $id)['token_hash']));

// Сборщик забирает работу: confirmed → building, второй раз уже нечего брать.
$claimed = intake_queue_claim($queue, 5, 2000);
check('сборщик забрал подтверждённую заявку', count($claimed) === 1 && $claimed[0]['id'] === $id);
check('статус стал building', (intake_queue_load($queue, $id)['status'] ?? '') === INTAKE_STATUS_BUILDING);
check('повторный claim ничего не выдаёт', intake_queue_claim($queue, 5, 2001) === []);

// Отчёт о доставке.
intake_queue_mark($queue, $id, INTAKE_STATUS_DELIVERED, ['delivered_at' => 3000], 3000);
check('статус стал delivered', (intake_queue_load($queue, $id)['status'] ?? '') === INTAKE_STATUS_DELIVERED);
check('история переходов ведётся', count((array) (intake_queue_load($queue, $id)['history'] ?? [])) >= 4);

// Уборка: неподтверждённая заявка с истёкшим TTL удаляется вместе с файлами.
file_put_contents($src, "c;d\n3;4\n");
$stale = intake_queue_create($queue, ['contact' => 'ghost@example.com'], [
    ['name' => 'x.csv', 'tmp_name' => $src, 'size' => filesize($src)],
], 86400, 1000);
$staleId   = (string) $stale['id'];
$stalePath = intake_queue_path($queue, $staleId);
check('вторая заявка создана', is_dir((string) $stalePath));
$purge = intake_queue_purge($queue, 30 * 86400, 1000 + 86401);
check('просроченная неподтверждённая заявка удалена', $purge['expired'] === 1);
check('каталог просроченной заявки исчез', !is_dir((string) $stalePath));
check('доставленная заявка пока не тронута', is_dir((string) intake_queue_path($queue, $id)));
$purge2 = intake_queue_purge($queue, 30 * 86400, 3000 + 31 * 86400);
check('старая доставленная заявка убрана', $purge2['purged'] === 1);
check('очередь пуста', intake_queue_list($queue) === []);

// Уборка стенда.
@unlink($src);
@rmdir($queue);

if ($failures > 0) {
    fwrite(STDERR, "$failures assertion(s) failed\n");
    exit(1);
}
echo "all intake confirm unit assertions passed\n";
