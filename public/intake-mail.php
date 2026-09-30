<?php
/**
 * Почтовый транспорт для эндпоинтов приёма заявок (issue #624).
 *
 * Одна точка отправки на два письма замкнутого контура:
 *   1. письмо-подтверждение (double opt-in) — из excel-to-app.php;
 *   2. письмо «приложение готово» — из excel-to-app-build.php (action=deliver),
 *      по шаблону docs/marketing/email-template-app-ready.md (форма #622:
 *      одна ссылка и доступ администратора, пароли ролей — на info.html).
 *
 * Почему именно так:
 *   - тема MIME-кодируется (=?UTF-8?B?…?=) — иначе кириллица в теме бьётся;
 *   - конверт подписывается `-f welcome@ideav.ru`: у домена ideav.ru настроены
 *     SPF/DKIM/DMARC, у остальных — нет, и письмо ложится в спам;
 *   - тело — text/plain; charset=UTF-8, 8bit: письмо читаемое и без вложений,
 *     HTML-версия тут только добавила бы поводов попасть в спам;
 *   - адрес получателя проверяется до сборки заголовков, а сами заголовки
 *     собираются из значений без CR/LF — заявка приходит из формы, и подставить
 *     через неё «Bcc:» посторонним не должно получиться.
 *
 * Транспорт переключается конфигом INTAKE_MAIL_TRANSPORT:
 *   mail (по умолчанию) — mail() хоста; file — дописать письмо строкой JSON в
 *   INTAKE_MAIL_FILE и ничего не отправлять (сухой прогон и тесты).
 */

if (!defined('INTAKE_MAIL_LOADED')) {
    define('INTAKE_MAIL_LOADED', true);

    require_once __DIR__ . '/intake-shared.php';

    /**
     * Контакт из формы — это email?
     *
     * Строго: целиком адрес и ничего кроме. «ivan@mail.ru или @ivan» — не email;
     * такие заявки идут прежним ручным путём, а не в double opt-in, потому что
     * письмо-подтверждение туда всё равно не уйдёт.
     */
    function intake_is_email(string $contact): bool {
        $contact = trim($contact);
        if ($contact === '' || strpbrk($contact, "\r\n") !== false) {
            return false;
        }
        return filter_var($contact, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * MIME-кодировать значение заголовка (RFC 2047), если в нём есть не-ASCII.
     *
     * Кодированное слово не должно превышать 75 символов, поэтому текст режется
     * по символам (не по байтам — иначе рвётся UTF-8) кусками до 45 байт: 45
     * байт дают 60 символов base64, плюс обвязка `=?UTF-8?B?…?=` — умещается.
     */
    function intake_mime_encode_header(string $text): string {
        if (preg_match('/^[\x20-\x7E]*$/', $text) === 1) {
            return $text;
        }
        $chunks  = [];
        $current = '';
        foreach (preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $char) {
            if (strlen($current) + strlen($char) > 45) {
                $chunks[] = $current;
                $current  = '';
            }
            $current .= $char;
        }
        if ($current !== '') {
            $chunks[] = $current;
        }
        $encoded = array_map(static fn(string $c): string => '=?UTF-8?B?' . base64_encode($c) . '?=', $chunks);
        // Складка длинного заголовка: CRLF + пробел (продолжение строки).
        return implode("\r\n ", $encoded);
    }

    /** Убрать из значения заголовка всё, чем можно вклинить свой заголовок. */
    function intake_mail_header_value(string $value): string {
        return trim((string) preg_replace('/[\r\n\0]+/', ' ', $value));
    }

    /**
     * Собрать письмо: MIME-тема и заголовки.
     *
     * @param array{from?:string, from_name?:string, reply_to?:string, bcc?:string} $opts
     * @return array{subject:string, headers:string, from:string, bcc:string}
     */
    function intake_mail_build(string $subject, array $opts = []): array {
        $from     = intake_mail_header_value((string) ($opts['from']      ?? intake_config('INTAKE_MAIL_FROM', 'welcome@ideav.ru')));
        $fromName = intake_mail_header_value((string) ($opts['from_name'] ?? intake_config('INTAKE_MAIL_FROM_NAME', 'Интеграм')));
        $replyTo  = intake_mail_header_value((string) ($opts['reply_to']  ?? intake_config('INTAKE_MAIL_REPLY_TO', 'abc@integram.io')));
        $bcc      = intake_mail_header_value((string) ($opts['bcc']       ?? intake_config('INTAKE_MAIL_BCC', '')));

        $headers = [];
        $headers[] = $fromName !== ''
            ? 'From: ' . intake_mime_encode_header($fromName) . ' <' . $from . '>'
            : 'From: ' . $from;
        if ($replyTo !== '') {
            $headers[] = 'Reply-To: ' . $replyTo;
        }
        // Копия себе — контроль того, что письмо вообще ушло.
        if ($bcc !== '' && intake_is_email($bcc)) {
            $headers[] = 'Bcc: ' . $bcc;
        }
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: 8bit';
        $headers[] = 'Auto-Submitted: auto-generated';

        return [
            'subject' => intake_mime_encode_header(intake_mail_header_value($subject)),
            'headers' => implode("\r\n", $headers),
            'from'    => $from,
            'bcc'     => $bcc,
        ];
    }

    /**
     * Отправить письмо. false — не отправлено (звонящий решает, что делать).
     *
     * @param array{from?:string, from_name?:string, reply_to?:string, bcc?:string} $opts
     * @param callable|null $mailer function(string $to, string $subject, string $body, string $headers, string $params): bool
     */
    function intake_mail_send(string $to, string $subject, string $body, array $opts = [], ?callable $mailer = null): bool {
        if (!intake_is_email($to)) {
            return false;
        }
        $mail = intake_mail_build($subject, $opts);
        // Нормализуем переводы строк: в письме — CRLF, иначе часть клиентов
        // показывает тело одной строкой.
        $body = str_replace(["\r\n", "\r"], "\n", $body);
        $body = str_replace("\n", "\r\n", $body);

        $transport = strtolower((string) intake_config('INTAKE_MAIL_TRANSPORT', 'mail'));
        if ($mailer === null && $transport === 'file') {
            return intake_mail_write_to_file($to, $mail, $body);
        }

        $mailer = $mailer ?? static function (string $to, string $subject, string $body, string $headers, string $params): bool {
            return @mail($to, $subject, $body, $headers, $params);
        };
        return (bool) $mailer($to, $mail['subject'], $body, $mail['headers'], '-f' . $mail['from']);
    }

    /** Сухой прогон: письмо строкой JSON в файл (INTAKE_MAIL_FILE). */
    function intake_mail_write_to_file(string $to, array $mail, string $body): bool {
        $file = (string) intake_config('INTAKE_MAIL_FILE', '');
        if ($file === '') {
            return false;
        }
        $line = json_encode([
            'to'      => $to,
            'subject' => $mail['subject'],
            'headers' => $mail['headers'],
            'body'    => $body,
            'sent_at' => time(),
        ], JSON_UNESCAPED_UNICODE);
        return @file_put_contents($file, $line . "\n", FILE_APPEND | LOCK_EX) !== false;
    }

    /**
     * Подставить значения в шаблон: {{ключ}} → значение.
     * Неизвестные плейсхолдеры остаются как есть — в письме они заметны,
     * и лучше увидеть «{{app_url}}», чем отправить пустое место.
     *
     * @param array<string, string> $vars
     */
    function intake_render_template(string $template, array $vars): string {
        $replacements = [];
        foreach ($vars as $key => $value) {
            $replacements['{{' . $key . '}}'] = (string) $value;
        }
        return strtr($template, $replacements);
    }

    /** Тема письма-подтверждения. */
    function intake_mail_confirm_subject(): string {
        return 'Подтвердите заявку — и мы начнём собирать приложение';
    }

    /**
     * Письмо-подтверждение (double opt-in).
     * Плейсхолдеры: {{confirm_url}}, {{ttl_hours}}, {{тематика}}, {{файлы}}.
     */
    function intake_mail_confirm_template(): string {
        return <<<'TEXT'
Здравствуйте!

Вы оставили заявку на сервисе «Из Excel — приложение» на ideav.ru.
{{тематика}}{{файлы}}
Остался один шаг: подтвердите, что это ваш адрес, — и мы начнём собирать
приложение по вашим данным.

Подтвердить заявку:
{{confirm_url}}

Ссылка действует {{ttl_hours}} ч. Пока вы по ней не перешли, мы ничего не
запускаем: сборку делает ИИ-агент, и мы не хотим тратить её на адреса, которые
вписали по ошибке.

Как только подтвердите — приложение собирается примерно за 45 минут, и мы
пришлём на этот же адрес ссылку и доступ администратора.

Если заявку оставляли не вы — просто не переходите по ссылке, через {{ttl_hours}} ч
она сама перестанет работать, а файлы мы удалим.

Вопросы — ответьте на это письмо или напишите в Telegram: @qdmadept.

С уважением,
команда Интеграм
https://ideav.ru
TEXT;
    }

    /** Тема письма «приложение готово». */
    function intake_mail_app_ready_subject(string $topicShort): string {
        $topicShort = trim($topicShort);
        return $topicShort !== ''
            ? "Ваше приложение для $topicShort готово — Интеграм"
            : 'Ваше приложение готово — Интеграм';
    }

    /**
     * Письмо «приложение готово» — текст из
     * docs/marketing/email-template-app-ready.md (форма #622).
     * Плейсхолдеры: {{тематика}}, {{app_url}}, {{admin_login}},
     * {{admin_password}}, {{что_внутри}}, {{цена_разбора}}, {{вилка_разработки}}.
     */
    function intake_mail_app_ready_template(): string {
        return <<<'TEXT'
Здравствуйте!

Вы оставляли заявку на сервисе «Из Excel — приложение» (тематика: {{тематика}}).
Приложение готово — мы собрали его из вашего файла, и его уже можно посмотреть
и потрогать.

Ссылка на приложение:
{{app_url}}

Доступ администратора:
    логин: {{admin_login}}
    пароль: {{admin_password}}

На главной странице приложения — описание: что в нём есть, какие роли
(например, продавец) и под какими логинами войти, чтобы посмотреть приложение
глазами сотрудника.

Что внутри:
{{что_внутри}}

Когда закончите тестировать, нажмите внизу главной страницы кнопку «Удалить
тестовые пароли» и смените пароли пользователей — дальше доступы знаете только вы.

Это бесплатная демонстрация — заготовка на ваших данных, чтобы убедиться, что
идея рабочая. Дальше, если захотите довести её до полноценного рабочего решения,
следующий шаг — разбор процесса за {{цена_разбора}}: по нему мы с помощью ИИ
пишем техническое задание и называем стоимость разработки (обычно
{{вилка_разработки}}, включая эти деньги за разбор).

Если что-то поправить в демо или обсудить разбор — ответьте на это письмо или
напишите нам в Telegram: @qdmadept, либо на почту abc@integram.io.

С уважением,
команда Интеграм
https://ideav.ru
TEXT;
    }
}
