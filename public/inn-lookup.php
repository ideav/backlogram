<?php
/**
 * Данные компании по ИНН из открытых источников ФНС (backlogram#913).
 *
 * GET /inn-lookup.php?inn=7734454184 → JSON с тем, что нужно калькулятору
 * потерь /poteri-po-inn.html: дата регистрации, ОКВЭД, выручка и расходы
 * последнего года, среднесписочная численность, уплаченные страховые взносы.
 *
 * Источник — сервис ФНС «Прозрачный бизнес» (pb.nalog.ru): без ключа, но
 * асинхронный — запрос ставится в очередь, ответ забирается по id. Браузер
 * туда напрямую не ходит (CORS), поэтому прокси здесь.
 *
 * Бережём ФНС и себя: ответ кэшируется на 7 дней (промах — на сутки), свежих
 * запросов не больше INN_RATE_MAX за INN_RATE_WINDOW секунд с одного IP.
 * Наружу отдаём только сведения об организации; у ИП — без ФИО.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

const INN_CACHE_TTL = 7 * 86400;
const INN_MISS_TTL = 86400;
const INN_RATE_MAX = 20;
const INN_RATE_WINDOW = 600;
const PB = 'https://pb.nalog.ru';

function inn_out(int $code, array $body): void
{
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Контрольные цифры ИНН: 10 знаков — юрлицо, 12 — ИП/физлицо. */
function inn_valid(string $inn): bool
{
    $d = array_map('intval', str_split($inn));
    $sum = static function (array $w) use ($d): int {
        $s = 0;
        foreach ($w as $i => $k) {
            $s += $k * $d[$i];
        }
        return $s % 11 % 10;
    };
    if (strlen($inn) === 10) {
        return $sum([2, 4, 10, 3, 5, 9, 4, 6, 8]) === $d[9];
    }
    if (strlen($inn) === 12) {
        return $sum([7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === $d[10]
            && $sum([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === $d[11];
    }
    return false;
}

function inn_dir(string $sub): string
{
    $dir = rtrim(sys_get_temp_dir(), '/\\') . '/ideav-inn/' . $sub;
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir;
}

/** true — лимит исчерпан. Считаются только свежие запросы в ФНС, кэш бесплатен. */
function inn_rate_limited(): bool
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $file = inn_dir('rate') . '/' . sha1($ip);
    $now = time();
    $fh = @fopen($file, 'c+');
    if (!$fh) {
        return false;
    }
    flock($fh, LOCK_EX);
    $hits = array_filter(
        array_map('intval', explode(',', (string) stream_get_contents($fh))),
        static fn (int $t): bool => $t > $now - INN_RATE_WINDOW
    );
    $limited = count($hits) >= INN_RATE_MAX;
    if (!$limited) {
        $hits[] = $now;
    }
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, implode(',', $hits));
    flock($fh, LOCK_UN);
    fclose($fh);
    return $limited;
}

function pb_post(string $path, array $form): ?array
{
    $ch = curl_init(PB . $path);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($form),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'X-Requested-With: XMLHttpRequest'],
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; ideav.ru loss calculator)',
    ]);
    $raw = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($raw === false || $code !== 200) {
        return null;
    }
    $json = json_decode((string) $raw, true);
    return is_array($json) ? $json : null;
}

/**
 * Асинхронный запрос «Прозрачного бизнеса»: ставим в очередь, забираем ответ
 * по id. Пока ответ не готов, сервис отдаёт объект без полезных ключей —
 * ждём, пока появится $readyKey.
 */
function pb_async(string $path, array $request, array $keep, string $readyKey): ?array
{
    $req = pb_post($path, $request);
    if (!$req || !empty($req['captchaRequired']) || empty($req['id'])) {
        return null;
    }
    for ($i = 0; $i < 8; $i++) {
        usleep($i === 0 ? 400000 : 700000);
        $resp = pb_post($path, $keep + ['id' => $req['id'], 'method' => 'get-response']);
        if ($resp && array_key_exists($readyKey, $resp)) {
            return $resp;
        }
    }
    return null;
}

/** «06.05.2022» → «2022-05-06». */
function pb_date(?string $s): ?string
{
    if (!$s) {
        return null;
    }
    if (preg_match('/^(\d{2})\.(\d{2})\.(\d{4})$/', $s, $m)) {
        return "$m[3]-$m[2]-$m[1]";
    }
    return preg_match('/^\d{4}-\d{2}-\d{2}/', $s) ? substr($s, 0, 10) : null;
}

/** Последний год с данными из списка [{yearcode, field}] → ['year' => …, 'value' => …]. */
function pb_last(?array $rows, string $field): ?array
{
    $best = null;
    foreach ($rows ?? [] as $r) {
        if (!is_array($r) || !isset($r[$field]) || !empty($r['empty'])) {
            continue;
        }
        $y = (int) ($r['yearcode'] ?? 0);
        if ($best === null || $y > $best['year']) {
            $best = ['year' => $y, 'value' => (float) $r[$field]];
        }
    }
    return $best;
}

/** Страховые взносы за последний год: сумма строк СВЗ.* по году. */
function pb_contributions(?array $rows): ?array
{
    $byYear = [];
    foreach ($rows ?? [] as $r) {
        if (is_array($r) && str_starts_with((string) ($r['kbk'] ?? ''), 'СВЗ')) {
            $y = (int) ($r['yearcode'] ?? 0);
            $byYear[$y] = ($byYear[$y] ?? 0) + (float) ($r['taxsum'] ?? 0);
        }
    }
    if (!$byYear) {
        return null;
    }
    krsort($byYear);
    $y = array_key_first($byYear);
    return ['year' => $y, 'value' => $byYear[$y]];
}

function inn_lookup(string $inn): ?array
{
    $isUl = strlen($inn) === 10;
    $search = pb_async('/search-proc.json', $isUl
        ? ['mode' => 'search-ul', 'queryUl' => $inn, 'page' => 1, 'pageSize' => 10]
        : ['mode' => 'search-ip', 'queryIp' => $inn, 'page' => 1, 'pageSize' => 10], [], $isUl ? 'ul' : 'ip');
    if ($search === null) {
        return null;
    }
    $row = null;
    foreach (($search[$isUl ? 'ul' : 'ip']['data'] ?? []) as $r) {
        if (($r['inn'] ?? '') === $inn) {
            $row = $r;
            break;
        }
    }
    if ($row === null) {
        return ['found' => false, 'inn' => $inn];
    }
    $card = !empty($row['token']) ? pb_async('/company-proc.json', ['token' => $row['token'], 'method' => 'get-request'], ['token' => $row['token']], 'vyp') : null;
    $vyp = $card['vyp'] ?? [];

    $revenue = pb_last($card['form1'] ?? null, 'revenue');
    $expense = pb_last($card['form1'] ?? null, 'expense');
    $staff = pb_last($card['sschr'] ?? null, 'sschr');
    return [
        'found' => true,
        'inn' => $inn,
        'kind' => $isUl ? 'ul' : 'ip',
        // У ИП в названии ФИО — персональные данные, их не отдаём.
        'name' => $isUl ? (string) ($row['namec'] ?? '') : 'Индивидуальный предприниматель',
        'regDate' => pb_date($row['dtreg'] ?? $row['dtogrn'] ?? null),
        'okved' => (string) ($row['okved2main'] ?? $row['okved2'] ?? ''),
        'okvedName' => (string) ($row['okved2mainname'] ?? $row['okved2name'] ?? ''),
        'region' => (string) ($row['regionname'] ?? ''),
        'active' => isset($row['sulst_ex']) ? (string) $row['sulst_ex'] === '10' : !((string) ($row['pr_liq'] ?? '0') === '1'),
        'revenue' => $revenue ? ['year' => $revenue['year'], 'rub' => $revenue['value']] : null,
        'expense' => $expense ? ['year' => $expense['year'], 'rub' => $expense['value']] : null,
        'employees' => $staff ? ['year' => $staff['year'], 'n' => (int) $staff['value']] : null,
        'contributions' => ($c = pb_contributions($card['taxpay'] ?? null)) ? ['year' => $c['year'], 'rub' => $c['value']] : null,
        'msp' => isset($vyp['rsmpcategory']) ? (int) $vyp['rsmpcategory'] : null,
        'source' => 'ФНС, «Прозрачный бизнес» (pb.nalog.ru)',
        'boUrl' => trim((string) ($row['bourl'] ?? '')) ?: null,
        'fetchedAt' => gmdate('c'),
    ];
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    inn_out(405, ['ok' => false, 'error' => 'method']);
}
$inn = preg_replace('/\D/', '', (string) ($_GET['inn'] ?? ''));
if (!inn_valid($inn)) {
    inn_out(400, ['ok' => false, 'error' => 'invalid_inn']);
}

$cacheFile = inn_dir('cache') . '/' . $inn . '.json';
if (is_file($cacheFile)) {
    $cached = json_decode((string) file_get_contents($cacheFile), true);
    $ttl = !empty($cached['found']) ? INN_CACHE_TTL : INN_MISS_TTL;
    if (is_array($cached) && filemtime($cacheFile) > time() - $ttl) {
        inn_out(200, ['ok' => true, 'cached' => true] + $cached);
    }
}
if (inn_rate_limited()) {
    inn_out(429, ['ok' => false, 'error' => 'rate_limited']);
}
$data = inn_lookup($inn);
if ($data === null) {
    inn_out(502, ['ok' => false, 'error' => 'source_unavailable']);
}
@file_put_contents($cacheFile, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
inn_out(200, ['ok' => true, 'cached' => false] + $data);
