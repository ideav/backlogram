<?php
/**
 * Персональные ссылки партнёров на материалы (/m/<токен>).
 *
 * Библиотека без побочных эффектов при подключении. Совместима с PHP 7.2+.
 * Источник правды — таблицы базы my на ideav.ru (их читает кабинет партнёра):
 *   «Ссылка партнёра» 238510 — токен, партнёр, материал;
 *   «Событие партнёра» 238518 — открытия материалов (тип material_open).
 * Файлы в каталоге данных (PARTNER_DATA_DIR, вне вебрута):
 *   materials.json   {"video_excel": {"title": "...", "url": "https://...", "aff": true}}
 *   links-cache.json найденные токены — на случай, если API недоступно
 *   events.jsonl     очередь событий, которые не удалось записать в API
 */

const PL_LINKS = 238510;          // «Ссылка партнёра», первая колонка — токен
const PL_LINK_USER = 238511;      // Пользователь (партнёр)
const PL_LINK_MATERIAL = 238513;  // Материал
const PL_LINK_TITLE = 238515;     // Название
const PL_LINK_KIND = 238517;      // Вид: material | bot
const PL_EVENTS = 238518;         // «Событие партнёра», первая колонка — тип
const PL_EV_USER = 238519;
const PL_EV_MATERIAL = 238521;
const PL_EV_TIME = 238523;        // DATETIME: unix-время, ядро хранит его как есть
const PL_EV_VISITOR = 238525;
const PL_EV_BOT = 238527;         // 1 — событие из Telegram-бота
const PL_EV_TEXT = 238529;

function pl_valid_token($t): bool {
    return is_string($t) && preg_match('/^[A-Za-z0-9_-]{16,64}$/', $t) === 1;
}

function pl_load_json(string $file): array {
    if (!is_file($file)) {
        return [];
    }
    $d = json_decode((string)file_get_contents($file), true);
    return is_array($d) ? $d : [];
}

function pl_save_json(string $file, array $data): void {
    @file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

/** Боты-превью мессенджеров и поисковики: открытие не считаем человеческим. */
function pl_is_bot(string $ua): bool {
    if ($ua === '') {
        return true;
    }
    return preg_match('/bot|crawl|spider|preview|facebookexternalhit|slurp|whatsapp|skypeuri|vkshare|curl|wget|python-requests|headless|monitor|yandex(?!browser)/i', $ua) === 1;
}

/** Настройки API базы my: адрес и токен пользователя с правом записи в таблицы партнёров. */
function pl_api_cfg(): array {
    return [
        'url' => rtrim(defined('PARTNER_API_URL') ? PARTNER_API_URL : 'https://ideav.ru/my', '/'),
        'token' => defined('PARTNER_API_TOKEN') ? (string)PARTNER_API_TOKEN : '',
    ];
}

/** HTTP-запрос к API: разобранный JSON или null (сеть, HTTP-ошибка, не JSON). */
function pl_http(array $cfg, string $path, ?array $post = null, int $timeout = 3): ?array {
    if ($cfg['token'] === '') {
        return null;
    }
    $opts = ['method' => $post === null ? 'GET' : 'POST', 'timeout' => $timeout, 'ignore_errors' => true,
             'header' => "X-Authorization: {$cfg['token']}\r\n"];
    if ($post !== null) {
        $opts['header'] .= "Content-Type: application/x-www-form-urlencoded\r\n";
        $opts['content'] = http_build_query($post);
    }
    $body = @file_get_contents($cfg['url'] . '/' . $path, false, stream_context_create(['http' => $opts]));
    $status = isset($http_response_header[0]) && preg_match('/\s(\d{3})\s?/', $http_response_header[0], $m) ? (int)$m[1] : 0;
    if ($body === false || $status < 200 || $status >= 300) {
        return null;
    }
    $d = json_decode($body, true);
    return is_array($d) ? $d : null;
}

/** POST в API с _xsrf (ядро требует его и для запросов по токену; значение постоянно для токена). */
function pl_api_post(array &$cfg, string $path, array $fields): ?array {
    if (!isset($cfg['xsrf'])) {
        $x = pl_http($cfg, 'xsrf?JSON');
        if (!isset($x['_xsrf'])) {
            return null;
        }
        $cfg['xsrf'] = (string)$x['_xsrf'];
    }
    $r = pl_http($cfg, $path, $fields + ['_xsrf' => $cfg['xsrf']]);
    return ($r === null || isset($r['error']) || isset($r[0]['error'])) ? null : $r;
}

/** Строка object/238510?JSON_OBJ → ['partner' => '12', 'material' => 'video_excel', 'kind' => ...]. */
function pl_link_from_row(array $row): array {
    $r = $row['r'] ?? [];
    return ['partner' => (string)strtok((string)($r[1] ?? ''), ':'), 'material' => (string)($r[2] ?? ''),
            'title' => (string)($r[3] ?? ''), 'kind' => (string)($r[4] ?? '')];
}

/**
 * Найти ссылку по токену в таблице. Ссылка или false (такой нет), null — API недоступно.
 * Фильтр ядра по колонке нечувствителен к регистру, поэтому токен сверяем ещё раз.
 */
function pl_api_link(array $cfg, string $token) {
    $rows = pl_http($cfg, 'object/' . PL_LINKS . '?JSON_OBJ&F_' . PL_LINKS . '=' . rawurlencode($token));
    if ($rows === null) {
        return null;
    }
    foreach ($rows as $row) {
        if (is_array($row) && ($row['r'][0] ?? null) === $token) {
            return pl_link_from_row($row);
        }
    }
    return false;
}

/**
 * Ссылка по токену: таблица, при недоступном API — кэш найденных раньше.
 * Возвращает [партнёр, ключ материала, материал]; адрес назначения — только из materials.json.
 */
function pl_resolve(string $dir, array $cfg, array $materials, $token): ?array {
    if (!pl_valid_token($token)) {
        return null;
    }
    $cacheFile = $dir . '/links-cache.json';
    $link = pl_api_link($cfg, $token);
    if ($link === null) {
        $link = pl_load_json($cacheFile)[$token] ?? false;
    } elseif ($link !== false) {
        $cache = pl_load_json($cacheFile);
        if (($cache[$token] ?? null) !== $link) {
            $cache[$token] = $link;
            pl_save_json($cacheFile, $cache);
        }
    }
    if (!is_array($link) || $link['partner'] === '' || !isset($materials[$link['material']]['url'])) {
        return null;
    }
    return ['partner' => $link['partner'], 'material' => $link['material'], 'info' => $materials[$link['material']]];
}

/** Адрес назначения; для страниц ideav.ru с флагом aff добавляем ?aff=<партнёр> (регистрация засчитается партнёру). */
function pl_target_url(array $info, string $partner): string {
    $url = (string)$info['url'];
    if (!empty($info['aff']) && $partner !== '') {
        $url .= (strpos($url, '?') === false ? '?' : '&') . 'aff=' . rawurlencode($partner);
    }
    return $url;
}

/** Событие открытия материала. time — unix-время (секунды UTC), так его хранит ядро. */
function pl_build_event(string $partner, string $material, string $title, string $ua, string $visitor, string $refererHost, ?int $now = null): array {
    $text = 'Открыл: ' . ($title !== '' ? $title : $material);
    if ($refererHost !== '') {
        $text .= ' (переход с ' . $refererHost . ')';
    }
    return ['type' => 'material_open', 'partner' => $partner, 'material' => $material, 'time' => $now ?? time(),
            'visitor' => $visitor, 'bot' => 0, 'text' => mb_substr($text, 0, 200), 'preview' => pl_is_bot($ua)];
}

/** Поля _m_new для «События партнёра». */
function pl_event_fields(array $e): array {
    return ['up' => 1, 't' . PL_EVENTS => $e['type'], 't' . PL_EV_USER => $e['partner'],
            't' . PL_EV_MATERIAL => $e['material'], 't' . PL_EV_TIME => (int)$e['time'],
            't' . PL_EV_VISITOR => $e['visitor'], 't' . PL_EV_BOT => (int)$e['bot'], 't' . PL_EV_TEXT => $e['text']];
}

function pl_api_add_event(array &$cfg, array $e): bool {
    $r = pl_api_post($cfg, '_m_new/' . PL_EVENTS . '?JSON=1', pl_event_fields($e));
    return isset($r['obj']) && (int)$r['obj'] > 0;
}

function pl_queue_event(string $dir, array $e): bool {
    if (!is_dir($dir) && !@mkdir($dir, 0700, true)) {
        return false;
    }
    return @file_put_contents($dir . '/events.jsonl', json_encode($e, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX) !== false;
}

/**
 * Записать событие в таблицу; не вышло — в очередь events.jsonl (её дошлёт команда flush).
 * Открытия ботами-превью мессенджеров в кабинет не идут: это не люди.
 */
function pl_record_event(string $dir, array &$cfg, array $e): string {
    if (!empty($e['preview'])) {
        return 'skipped';
    }
    unset($e['preview']);
    if (pl_api_add_event($cfg, $e)) {
        return 'api';
    }
    return pl_queue_event($dir, $e) ? 'queued' : 'lost';
}

/** Дослать очередь: [отправлено, осталось]. Неотправленные остаются в файле. */
function pl_flush(string $dir, array &$cfg): array {
    $file = $dir . '/events.jsonl';
    $fh = @fopen($file, 'c+');
    if ($fh === false) {
        return [0, 0];
    }
    flock($fh, LOCK_EX);
    $left = [];
    $sent = 0;
    while (($line = fgets($fh)) !== false) {
        $e = json_decode($line, true);
        if (!is_array($e)) {
            continue;
        }
        if (pl_api_add_event($cfg, $e)) {
            $sent++;
        } else {
            $left[] = json_encode($e, JSON_UNESCAPED_UNICODE) . "\n";
        }
    }
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, implode('', $left));
    flock($fh, LOCK_UN);
    fclose($fh);
    return [$sent, count($left)];
}

function pl_new_token(): string {
    return rtrim(strtr(base64_encode(random_bytes(12)), '+/', '-_'), '=');
}

/**
 * Выдать партнёру ссылки в таблице «Ссылка партнёра»: по одной на каждый материал
 * (кроме service — эту ссылку кабинет строит сам) и одну на Telegram-бота.
 * Повторный вызов возвращает прежние токены. Результат: [материал => [токен, вид]].
 */
function pl_issue(array &$cfg, array $materials, string $partner): array {
    $have = [];
    for ($offset = 0; ; $offset += 500) {
        $rows = pl_http($cfg, 'object/' . PL_LINKS . "?JSON_OBJ&LIMIT=$offset,500", null, 15);
        if ($rows === null) {
            throw new RuntimeException('API базы my недоступно');
        }
        foreach ($rows as $row) {
            $l = pl_link_from_row($row);
            if ($l['partner'] === $partner) {
                $have[$l['material']] = [(string)$row['r'][0], $l['kind']];
            }
        }
        if (count($rows) < 500) {
            break;
        }
    }
    $want = [];
    foreach ($materials as $key => $m) {
        if ($key !== 'service') {
            $want[$key] = ['material', (string)($m['title'] ?? $key)];
        }
    }
    $want['bot'] = ['bot', 'Telegram-бот @Integrammbot'];
    $out = [];
    foreach ($want as $key => [$kind, $title]) {
        if (!isset($have[$key])) {
            $token = pl_new_token();
            $r = pl_api_post($cfg, '_m_new/' . PL_LINKS . '?JSON=1', ['up' => 1, 't' . PL_LINKS => $token,
                't' . PL_LINK_USER => $partner, 't' . PL_LINK_MATERIAL => $key,
                't' . PL_LINK_TITLE => $title, 't' . PL_LINK_KIND => $kind]);
            if (!isset($r['obj'])) {
                throw new RuntimeException("Ссылка на $key не записана");
            }
            $have[$key] = [$token, $kind];
        }
        $out[$key] = $have[$key];
    }
    return $out;
}
