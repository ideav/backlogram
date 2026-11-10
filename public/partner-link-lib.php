<?php
/**
 * Персональные ссылки партнёров на материалы (/m/<токен>).
 *
 * Библиотека без побочных эффектов при подключении: разбор токена, поиск
 * партнёра и материала, фильтр ботов-превью, запись событий и отчёт.
 * Совместима с PHP 7.2+. Данные лежат ВНЕ вебрута (PARTNER_DATA_DIR):
 *   links.json      {"<токен>": {"partner": "12", "material": "video_excel"}}
 *   materials.json  {"video_excel": {"title": "...", "url": "https://...", "aff": true}}
 *   events.jsonl    по строке JSON на событие
 */

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

/** Боты-превью мессенджеров и поисковики: открытие не считаем человеческим. */
function pl_is_bot(string $ua): bool {
    if ($ua === '') {
        return true;
    }
    return preg_match('/bot|crawl|spider|preview|facebookexternalhit|slurp|whatsapp|skypeuri|vkshare|curl|wget|python-requests|headless|monitor|yandex(?!browser)/i', $ua) === 1;
}

/** Найти ссылку: [партнёр, ключ материала, материал] или null. Адрес берём только из конфига. */
function pl_resolve(array $links, array $materials, $token): ?array {
    if (!pl_valid_token($token) || !isset($links[$token])) {
        return null;
    }
    $l = $links[$token];
    $key = $l['material'] ?? '';
    if (!isset($materials[$key]['url'])) {
        return null;
    }
    return ['partner' => (string)($l['partner'] ?? ''), 'material' => $key, 'info' => $materials[$key]];
}

/** Адрес назначения; для страниц ideav.ru с флагом aff добавляем ?aff=<партнёр> (регистрация засчитается партнёру). */
function pl_target_url(array $info, string $partner): string {
    $url = (string)$info['url'];
    if (!empty($info['aff']) && $partner !== '') {
        $url .= (strpos($url, '?') === false ? '?' : '&') . 'aff=' . rawurlencode($partner);
    }
    return $url;
}

function pl_build_event(string $partner, string $material, string $ua, string $ip, string $visitor, bool $firstVisit, string $refererHost, string $salt, ?int $now = null): array {
    return [
        'ts' => gmdate('c', $now ?? time()),
        'type' => 'material_open',
        'partner' => $partner,
        'material' => $material,
        'bot' => pl_is_bot($ua),
        'visitor' => $visitor,
        'first' => $firstVisit,
        'ip' => substr(hash('sha256', $salt . $ip), 0, 12),
        'ref' => $refererHost,
        'ua' => substr($ua, 0, 120),
    ];
}

function pl_append_event(string $dir, array $event): bool {
    if (!is_dir($dir) && !@mkdir($dir, 0700, true)) {
        return false;
    }
    $line = json_encode($event, JSON_UNESCAPED_UNICODE) . "\n";
    return @file_put_contents($dir . '/events.jsonl', $line, FILE_APPEND | LOCK_EX) !== false;
}

/** Выдать партнёру токены на все материалы; повторный вызов возвращает прежние. */
function pl_issue(string $dir, string $partner): array {
    if (!is_dir($dir) && !@mkdir($dir, 0700, true)) {
        throw new RuntimeException('Не создать каталог данных');
    }
    $links = pl_load_json($dir . '/links.json');
    $materials = pl_load_json($dir . '/materials.json');
    $out = [];
    foreach (array_keys($materials) as $m) {
        $found = null;
        foreach ($links as $tok => $l) {
            if (($l['partner'] ?? '') === $partner && ($l['material'] ?? '') === $m) { $found = $tok; break; }
        }
        if ($found === null) {
            $found = rtrim(strtr(base64_encode(random_bytes(12)), '+/', '-_'), '=');
            $links[$found] = ['partner' => $partner, 'material' => $m];
        }
        $out[$m] = $found;
    }
    file_put_contents($dir . '/links.json', json_encode($links, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    return $out;
}

/** Сводка по партнёрам: открытия людьми, уникальные посетители, боты отдельно. */
function pl_report(string $dir): array {
    $file = $dir . '/events.jsonl';
    $rep = [];
    if (!is_file($file)) {
        return $rep;
    }
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $e = json_decode($line, true);
        if (!is_array($e) || ($e['type'] ?? '') !== 'material_open') { continue; }
        $p = $e['partner']; $m = $e['material'];
        if (!isset($rep[$p][$m])) { $rep[$p][$m] = ['open' => 0, 'unique' => [], 'bot' => 0, 'last' => '']; }
        if (!empty($e['bot'])) { $rep[$p][$m]['bot']++; continue; }
        $rep[$p][$m]['open']++;
        $rep[$p][$m]['unique'][$e['visitor']] = 1;
        $rep[$p][$m]['last'] = $e['ts'];
    }
    foreach ($rep as $p => $ms) { foreach ($ms as $m => $v) { $rep[$p][$m]['unique'] = count($v['unique']); } }
    return $rep;
}
