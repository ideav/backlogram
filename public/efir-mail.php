<?php
/**
 * Письма участникам эфира «ИИ-агенты на предприятии»: подтверждение сразу после
 * регистрации (telegram-notify.php) и напоминания за сутки и за час
 * (efir-reminders.php, cron).
 *
 * Отправка — только через intake_mail_send() из intake-mail.php: там MIME-тема,
 * конверт -f welcome@ideav.ru (SPF/DKIM/DMARC проходят), фолд строк по БАЙТАМ
 * (exim режет >998), Bcc из INTAKE_MAIL_BCC. Своего отправителя здесь нет.
 *
 * Параметры эфира — в efir_config(): значения по умолчанию, любое переопределяется
 * через intake_config (окружение или telegram-config.php: define('EFIR_DATE', ...)).
 * Следующий эфир = правка конфига + `php efir-reminders.php --ics > <файл .ics>`.
 */

if (!defined('EFIR_MAIL_LOADED')) {
    define('EFIR_MAIL_LOADED', true);

    require_once __DIR__ . '/intake-shared.php';
    require_once __DIR__ . '/intake-mail.php';

    /** Параметры эфира: умолчания + переопределение через intake_config. */
    function efir_config(): array {
        $c = static fn (string $name, string $default): string => (string) intake_config($name, $default);
        $date = $c('EFIR_DATE', '2026-12-03');
        return [
            'source'    => $c('EFIR_SOURCE', 'efir'),
            'date'      => $date,                        // Y-m-d, по Москве
            'time'      => $c('EFIR_TIME', '11:00'),     // начало, МСК
            'end_time'  => $c('EFIR_END_TIME', '12:15'), // конец, МСК
            'title'     => $c('EFIR_TITLE', 'ИИ-агенты на предприятии'),
            'url'       => $c('EFIR_URL', 'https://telemost.yandex.ru/j/81637970749787'),
            'page_url'  => $c('EFIR_PAGE_URL', 'https://ideav.ru/ai-transform/efir.html'),
            'ics_url'   => $c('EFIR_ICS_URL', 'https://ideav.ru/ai-transform/efir-' . $date . '.ics'),
            'uid'       => $c('EFIR_UID', 'efir-' . str_replace('-', '', $date) . '@ideav.ru'),
            'reply_to'  => $c('EFIR_REPLY_TO', 'care@integram.io'),
            'cooldown'  => (int) $c('EFIR_MAIL_COOLDOWN', '600'),   // не чаще раза в N с на почту
            'batch'     => (int) $c('EFIR_REMIND_BATCH', '200'),    // писем за один запуск cron
            'min_gap'   => (int) $c('EFIR_REMIND_MIN_GAP', '1800'), // не напоминать сразу после подтверждения
        ];
    }

    /** Начало и конец эфира как DateTimeImmutable (UTC). */
    function efir_times(array $cfg): array {
        $tz  = new DateTimeZone('Europe/Moscow');
        $utc = new DateTimeZone('UTC');
        $start = new DateTimeImmutable($cfg['date'] . ' ' . $cfg['time'], $tz);
        $end   = new DateTimeImmutable($cfg['date'] . ' ' . $cfg['end_time'], $tz);
        return [$start->setTimezone($utc), $end->setTimezone($utc)];
    }

    /** Дата словами: «3 декабря 2026». */
    function efir_date_text(array $cfg, bool $withYear = true): string {
        $months = [1 => 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        $d = new DateTimeImmutable($cfg['date'], new DateTimeZone('Europe/Moscow'));
        return (int) $d->format('j') . ' ' . $months[(int) $d->format('n')] . ($withYear ? ' ' . $d->format('Y') : '');
    }

    /** «четверг, 3 декабря 2026, 11:00–12:15 (МСК)». */
    function efir_when_text(array $cfg): string {
        $days = [1 => 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
        $d = new DateTimeImmutable($cfg['date'], new DateTimeZone('Europe/Moscow'));
        return $days[(int) $d->format('N')] . ', ' . efir_date_text($cfg) . ', ' . $cfg['time'] . '–' . $cfg['end_time'] . ' (МСК)';
    }

    /** Обращение по имени: первое слово поля «Имя и фамилия»; странное — просто «Здравствуйте!». */
    function efir_greeting(string $name): string {
        $name  = trim((string) preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $name));
        $first = preg_split('/\s+/u', $name, 2)[0] ?? '';
        if ($first === '' || mb_strlen($first) > 40 || preg_match('/^\p{L}[\p{L}\-]*$/u', $first) !== 1) {
            return 'Здравствуйте!';
        }
        return 'Здравствуйте, ' . $first . '!';
    }

    /**
     * Тема и текст письма вида confirm | remind24 | remind1h.
     *
     * @return array{0:string,1:string}
     */
    function efir_compose(string $kind, array $cfg, string $name): array {
        $title = $cfg['title'];
        $when  = efir_when_text($cfg);
        $hello = efir_greeting($name);
        $short = efir_date_text($cfg, false);
        $link  = "Ссылка для подключения (Яндекс Телемост):\n{$cfg['url']}";
        $cal   = "Добавить в календарь (файл .ics):\n{$cfg['ics_url']}";
        $sign  = "С уважением,\nкоманда Интеграм\n{$cfg['page_url']}";

        if ($kind === 'confirm') {
            $subject = "Вы зарегистрированы: эфир «{$title}», {$short}, {$cfg['time']} МСК";
            $body = "{$hello}\n\n"
                . "Вы зарегистрированы на онлайн-эфир «{$title}».\n\n"
                . "Когда: {$when}\n\n"
                . "{$link}\n\n"
                . "{$cal}\n\n"
                . "Что взять с собой: компьютер или телефон с интернетом. Телемост открывается в браузере, "
                . "регистрироваться в нём не нужно. Заранее подумайте об одном процессе в вашей компании, "
                . "где много ручной работы с документами и запросами, — на эфире разберём, с чего такое начинать.\n\n"
                . "Мы напомним об эфире ещё дважды: за сутки и за час до начала. "
                . "Запись и материалы пришлём зарегистрированным после эфира.\n\n"
                . "Если не получится присоединиться или регистрация оформлена по ошибке — просто ответьте "
                . "на это письмо, мы отменим её и больше не будем писать.\n\n"
                . $sign;
        } elseif ($kind === 'remind24') {
            $subject = "Завтра эфир «{$title}» в {$cfg['time']} МСК";
            $body = "{$hello}\n\n"
                . "Напоминаем: завтра, {$short}, в {$cfg['time']} по Москве начнётся онлайн-эфир «{$title}». "
                . "Он продлится до {$cfg['end_time']}.\n\n"
                . "{$link}\n\n"
                . "{$cal}\n\n"
                . "Если планы изменились — ответьте на это письмо, мы отменим регистрацию.\n\n"
                . $sign;
        } elseif ($kind === 'remind1h') {
            $subject = "Через час эфир «{$title}» — ссылка для подключения";
            $body = "{$hello}\n\n"
                . "Через час, в {$cfg['time']} по Москве, начинается онлайн-эфир «{$title}» (до {$cfg['end_time']}).\n\n"
                . "{$link}\n\n"
                . "Подключиться можно прямо из браузера, за несколько минут до начала.\n\n"
                . $sign;
        } else {
            throw new InvalidArgumentException("unknown efir mail kind: $kind");
        }
        return [$subject, $body];
    }

    /** Нормализованный ключ почты в учёте отправленного. */
    function efir_email_key(string $email): string {
        return mb_strtolower(trim($email));
    }

    /** Файл учёта отправленного — рядом со списком участников. */
    function efir_state_file(string $dir, string $source): string {
        return rtrim($dir, '/') . '/' . $source . '.sent.json';
    }

    /**
     * Атомарно изменить учёт: flock на файле, fn(array &$state): mixed.
     * Структура: ['confirm' => [почта => unix-время], 'remind24' => [...], 'remind1h' => [...]].
     * Возвращает результат fn; null — файл недоступен.
     */
    function efir_state_update(string $file, callable $fn) {
        $fh = @fopen($file, 'c+');
        if ($fh === false) {
            return null;
        }
        try {
            if (!flock($fh, LOCK_EX)) {
                return null;
            }
            $state = json_decode((string) stream_get_contents($fh), true);
            $state = is_array($state) ? $state : [];
            $result = $fn($state);
            ftruncate($fh, 0);
            rewind($fh);
            fwrite($fh, json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            fflush($fh);
            flock($fh, LOCK_UN);
            return $result;
        } finally {
            fclose($fh);
        }
    }

    /** Отправить письмо участнику через intake_mail_send. $bcc === null — Bcc по умолчанию (INTAKE_MAIL_BCC). */
    function efir_deliver(string $kind, array $cfg, string $email, string $name, ?string $bcc, ?callable $mailer): bool {
        [$subject, $body] = efir_compose($kind, $cfg, $name);
        $opts = ['reply_to' => $cfg['reply_to']];
        if ($bcc !== null) {
            $opts['bcc'] = $bcc;
        }
        return intake_mail_send($email, $subject, $body, $opts, $mailer);
    }

    /**
     * Письмо-подтверждение сразу после регистрации. Не бросает.
     * Не чаще раза в cooldown секунд на почту (форму можно жать подряд).
     * Копия Bcc — INTAKE_MAIL_BCC, как у остальных писем intake.
     *
     * @return string sent | throttled | invalid | failed
     */
    function efir_send_confirmation(string $dir, array $reg, ?callable $mailer = null, ?int $now = null): string {
        try {
            $cfg   = efir_config();
            $email = trim((string) ($reg['email'] ?? ''));
            if (!intake_is_email($email)) {
                return 'invalid';
            }
            $now  = $now ?? time();
            $key  = efir_email_key($email);
            $file = efir_state_file($dir, $cfg['source']);
            if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
                error_log("efir-mail: no registrations dir $dir");
                return 'failed';
            }
            // Слот занимаем до отправки: параллельные запросы не пошлют письмо дважды.
            $prev = null;
            $claimed = efir_state_update($file, function (array &$st) use ($key, $now, $cfg, &$prev) {
                $prev = $st['confirm'][$key] ?? null;
                if ($prev !== null && $now - (int) $prev < $cfg['cooldown']) {
                    return false;
                }
                $st['confirm'][$key] = $now;
                return true;
            });
            if ($claimed === null) {
                error_log("efir-mail: state file unavailable ($file), confirmation not sent to $email");
                return 'failed';
            }
            if ($claimed === false) {
                return 'throttled';
            }
            $ok = efir_deliver('confirm', $cfg, $email, (string) ($reg['name'] ?? ''), null, $mailer);
            if (!$ok) {
                error_log("efir-mail: confirmation not sent to $email");
                // Слот возвращаем: повторная регистрация может попробовать снова.
                efir_state_update($file, function (array &$st) use ($key, $prev) {
                    if ($prev === null) { unset($st['confirm'][$key]); } else { $st['confirm'][$key] = $prev; }
                });
                return 'failed';
            }
            return 'sent';
        } catch (Throwable $e) {
            error_log('efir-mail: confirmation error: ' . $e->getMessage());
            return 'failed';
        }
    }

    /** Окно отправки напоминания: [от, до) в unix-времени. */
    function efir_reminder_window(string $kind, int $startTs): array {
        return $kind === 'remind24'
            ? [$startTs - 24 * 3600, $startTs - 12 * 3600]   // «завтра» верно, пока до начала > 12 ч
            : [$startTs - 3600, $startTs];                   // «через час» — последний час до старта
    }

    /** Почты из файла отказавшихся (<source>.cancelled.txt, по одной на строку, # — комментарий). */
    function efir_cancelled(string $dir, string $source): array {
        $out = [];
        foreach (@file(rtrim($dir, '/') . '/' . $source . '.cancelled.txt', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $l) {
            $l = trim($l);
            if ($l !== '' && $l[0] !== '#') {
                $out[efir_email_key($l)] = true;
            }
        }
        return $out;
    }

    /**
     * Разослать напоминание, окно которого открыто сейчас. Идемпотентно: учёт —
     * в <source>.sent.json, успешно отправленное повторно не шлётся; неудачное
     * повторится на следующем запуске, пока окно открыто.
     *
     * @return array{kind:?string, sent:int, failed:int, skipped:int, pending:int}
     */
    function efir_send_reminders(string $dir, bool $dry = false, ?callable $mailer = null, ?int $now = null): array {
        $cfg = efir_config();
        $now = $now ?? time();
        [$start] = efir_times($cfg);
        $startTs = $start->getTimestamp();
        $res = ['kind' => null, 'sent' => 0, 'failed' => 0, 'skipped' => 0, 'pending' => 0];
        foreach (['remind24', 'remind1h'] as $k) {
            [$from, $to] = efir_reminder_window($k, $startTs);
            if ($now >= $from && $now < $to) {
                $res['kind'] = $k;
                break;
            }
        }
        if ($res['kind'] === null) {
            return $res;
        }
        $kind      = $res['kind'];
        $rows      = intake_registrations_read(rtrim($dir, '/') . '/' . $cfg['source'] . '.jsonl');
        $cancelled = efir_cancelled($dir, $cfg['source']);
        $file      = efir_state_file($dir, $cfg['source']);
        $state     = json_decode((string) @file_get_contents($file), true);
        $state     = is_array($state) ? $state : [];
        $budget    = max(1, $cfg['batch']);

        foreach ($rows as $r) {
            $email = trim((string) ($r['email'] ?? ''));
            $key   = efir_email_key($email);
            if (!intake_is_email($email) || isset($cancelled[$key]) || isset($state[$kind][$key])) {
                $res['skipped']++;
                continue;
            }
            // Только что получил подтверждение — напоминание подождёт следующего запуска.
            if (isset($state['confirm'][$key]) && $now - (int) $state['confirm'][$key] < $cfg['min_gap']) {
                $res['pending']++;
                continue;
            }
            if ($budget <= 0) {
                $res['pending']++;
                continue;
            }
            $budget--;
            if ($dry) {
                $res['sent']++;
                echo "[dry-run] $kind -> $email\n";
                continue;
            }
            // Напоминания без Bcc: копия каждого из сотен писем владельцу не нужна.
            $ok = false;
            try {
                $ok = efir_deliver($kind, $cfg, $email, (string) ($r['name'] ?? ''), '', $mailer);
            } catch (Throwable $e) {
                error_log('efir-reminders: ' . $e->getMessage());
            }
            if ($ok) {
                efir_state_update($file, function (array &$st) use ($kind, $key, $now) { $st[$kind][$key] = $now; });
                $res['sent']++;
            } else {
                error_log("efir-reminders: $kind not sent to $email");
                $res['failed']++;
            }
        }
        return $res;
    }

    /** Экранирование текстового значения iCalendar (RFC 5545 §3.3.11). */
    function efir_ics_escape(string $s): string {
        return str_replace(["\\", ';', ',', "\r\n", "\n", "\r"], ['\\\\', '\;', '\,', '\n', '\n', '\n'], $s);
    }

    /** Сложить строку iCalendar по 75 октетов (продолжение — CRLF + пробел), не рвя UTF-8. */
    function efir_ics_fold(string $line): string {
        $out   = '';
        $limit = 75;
        while (strlen($line) > $limit) {
            $cut = $limit;
            while ($cut > 0 && (ord($line[$cut]) & 0xC0) === 0x80) {
                $cut--;
            }
            $out  .= substr($line, 0, $cut) . "\r\n ";
            $line  = substr($line, $cut);
            $limit = 74; // пробел продолжения тоже считается
        }
        return $out . $line;
    }

    /** Файл .ics с одним VEVENT. DTSTAMP стабильный (за 30 дней до начала), не «сейчас»: файл статический. */
    function efir_ics(array $cfg): string {
        [$start, $end] = efir_times($cfg);
        $fmt  = static fn (DateTimeImmutable $d): string => $d->format('Ymd\THis\Z');
        $desc = "Онлайн-эфир «{$cfg['title']}». Подключение: {$cfg['url']}\nСтраница эфира: {$cfg['page_url']}";
        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Integram//Efir//RU',
            'CALSCALE:GREGORIAN',
            'BEGIN:VEVENT',
            'UID:' . $cfg['uid'],
            'DTSTAMP:' . $fmt($start->modify('-30 days')),
            'DTSTART:' . $fmt($start),
            'DTEND:' . $fmt($end),
            'SUMMARY:' . efir_ics_escape('Эфир «' . $cfg['title'] . '»'),
            'DESCRIPTION:' . efir_ics_escape($desc),
            'LOCATION:' . $cfg['url'],
            'URL:' . $cfg['url'],
            'BEGIN:VALARM',
            'ACTION:DISPLAY',
            'DESCRIPTION:' . efir_ics_escape('Через 30 минут эфир «' . $cfg['title'] . '»'),
            'TRIGGER:-PT30M',
            'END:VALARM',
            'END:VEVENT',
            'END:VCALENDAR',
        ];
        return implode("\r\n", array_map('efir_ics_fold', $lines)) . "\r\n";
    }
}
