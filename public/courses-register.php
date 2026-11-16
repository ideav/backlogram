<?php
/**
 * Запись участника в базу портала ideav.ru/courses.
 *
 * Решение владельца (16.11.2026): учётные записи и персональные данные участников
 * курсов живут только в базе courses. Регистрация на эфир (telegram-notify.php,
 * source=efir) после записи в jsonl и до/вместе с Telegram дополнительно:
 *   1. находит или создаёт «Пользователь» (логин = почта в нижнем регистре, без пароля);
 *   2. создаёт или обновляет «Профиль» (Имя, Телефон, Компания, Должность, Отрасль);
 *   3. создаёт «Заявку» (Курс = COURSES_EFIR_COURSE, по умолчанию «efir»; Статус = «регистрация»),
 *      если такой заявки у пользователя ещё нет.
 *
 * Вызовы API ядра — те же, что у портала (download/courses/js/api.js в ideav/crm) и у
 * lms/schema.mjs в ideav/courses: токен в X-Authorization, _xsrf для записи,
 * _m_new/<таблица>?JSON&up=1, _m_set/<id>?JSON, object/<таблица>/?JSON_OBJ.
 * id таблиц и реквизитов берутся из metadata по именам, поэтому в коде их нет;
 * схема с полями Телефон/Компания/Должность/Отрасль должна быть накатана
 * (ideav/courses PR #140). Нет полей профиля — пишем остальные и сообщаем в error_log.
 *
 * Серверный путь регистрации в самом портале не найден (пользователей заводит ядро и
 * lms/schema.mjs), поэтому второго пути не плодим, а повторяем вызовы API.
 *
 * Конфигурация (intake_config: переменная окружения или define в telegram-config.php,
 * вне репозитория): COURSES_TOKEN (обязателен; нет — запись отключена), COURSES_BASE_URL
 * (https://ideav.ru), COURSES_DB (courses), COURSES_EFIR_COURSE (efir),
 * COURSES_TIMEOUT (общий бюджет, секунд, 4).
 *
 * Ошибки не бросаются наружу: courses_register_participant() возвращает ['ok' => false, 'error' => …];
 * jsonl и Telegram остаются запасным путём.
 */

require_once __DIR__ . '/intake-shared.php';

if (!defined('COURSES_REGISTER_LOADED')) {
    define('COURSES_REGISTER_LOADED', true);

    /** Настройки из конфигурации вне репозитория; null — запись в courses не настроена. */
    function courses_config(): ?array {
        $token = intake_config('COURSES_TOKEN');
        if ($token === null) {
            return null;
        }
        return [
            'token'   => $token,
            'base'    => rtrim((string) intake_config('COURSES_BASE_URL', 'https://ideav.ru'), '/'),
            'db'      => (string) intake_config('COURSES_DB', 'courses'),
            'course'  => (string) intake_config('COURSES_EFIR_COURSE', 'efir'),
            'budget'  => max(1.0, min(10.0, (float) intake_config('COURSES_TIMEOUT', '4'))),
        ];
    }

    /**
     * HTTP по умолчанию: [код, тело]. Подменяется в тестах (параметр $http).
     * $timeout — секунд на этот вызов.
     */
    function courses_http(string $method, string $url, array $headers, ?string $body, float $timeout): array {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CUSTOMREQUEST  => $method,
                CURLOPT_HTTPHEADER     => $headers,
                CURLOPT_TIMEOUT_MS     => (int) ($timeout * 1000),
                CURLOPT_CONNECTTIMEOUT_MS => (int) (min($timeout, 3) * 1000),
            ]);
            if ($body !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
            }
            $res = curl_exec($ch);
            $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            return [$code, $res === false ? 'curl: ' . $err : (string) $res];
        }
        $ctx = stream_context_create(['http' => [
            'method' => $method, 'header' => implode("\r\n", $headers), 'content' => $body ?? '',
            'timeout' => $timeout, 'ignore_errors' => true,
        ]]);
        $res = @file_get_contents($url, false, $ctx);
        $code = 0;
        foreach ($http_response_header ?? [] as $h) {
            if (preg_match('#^HTTP/\S+\s+(\d+)#', $h, $m)) {
                $code = (int) $m[1];
            }
        }
        return [$code, $res === false ? 'stream: request failed' : $res];
    }

    /** Один вызов API ядра с общим дедлайном. Бросает Exception при ошибке. */
    function courses_call(array $cfg, callable $http, float $deadline, string $method, string $path, ?array $form = null): array {
        $left = $deadline - microtime(true);
        if ($left <= 0.2) {
            throw new Exception('courses: бюджет времени исчерпан');
        }
        $sep = strpos($path, '?') === false ? '?' : '&';
        $url = $cfg['base'] . '/' . $cfg['db'] . '/' . $path . (preg_match('/[?&]JSON/', $path) ? '' : $sep . 'JSON');
        $headers = ['X-Authorization: ' . $cfg['token']];
        $body = null;
        if ($form !== null) {
            $headers[] = 'Content-Type: application/x-www-form-urlencoded; charset=utf-8';
            $body = http_build_query($form);
        }
        [$code, $res] = $http($method, $url, $headers, $body, $left);
        $d = json_decode((string) $res, true);
        $err = is_array($d) ? ($d[0]['error'] ?? (is_string($d['error'] ?? null) ? $d['error'] : null)) : null;
        if ($code < 200 || $code >= 300 || !is_array($d) || $err) {
            // токен в сообщение не попадает: оно уходит в error_log
            throw new Exception("courses: HTTP $code $method $path: " . ($err ?: substr(preg_replace('/\s+/', ' ', (string) $res), 0, 200)));
        }
        return $d;
    }

    /**
     * Таблица и реквизиты по metadata: ['id' => int, 'req' => [имя => id], 'idx' => [имя => позиция в r[]]].
     * Имя реквизита — alias (если задан) или val. null — таблицы нет.
     */
    function courses_resolve_table(array $meta, string $table): ?array {
        foreach ($meta as $t) {
            if ((string) ($t['up'] ?? '0') !== '0' || ($t['val'] ?? null) !== $table) {
                continue;
            }
            $req = [];
            $idx = [];
            foreach (($t['reqs'] ?? []) as $i => $r) {
                $name = (string) ($r['field_attrs']['alias'] ?? $r['val'] ?? '');
                $req[$name] = (int) $r['id'];
                $idx[$name] = $i + 1;
            }
            return ['id' => (int) $t['id'], 'req' => $req, 'idx' => $idx];
        }
        return null;
    }

    /** Ссылка приходит как «id:текст». */
    function courses_ref_id($v): string {
        return preg_match('/^(\d+)(:|$)/', (string) $v, $m) ? $m[1] : '';
    }

    /** Строки таблицы по фильтру на ссылку/главное значение: [['_id', '_main', имя => значение]]. */
    function courses_rows(array $cfg, callable $http, float $deadline, array $tbl, string $filterKey, string $filterValue): array {
        $q = 'object/' . $tbl['id'] . '/?JSON_OBJ&LIMIT=0,200&F_' . $filterKey . '=' . rawurlencode($filterValue);
        $out = [];
        foreach (courses_call($cfg, $http, $deadline, 'GET', $q) as $rec) {
            if (!isset($rec['r']) || !is_array($rec['r'])) {
                continue;
            }
            $row = ['_id' => (string) ($rec['i'] ?? ''), '_main' => (string) ($rec['r'][0] ?? '')];
            foreach ($tbl['idx'] as $name => $i) {
                $row[$name] = (string) ($rec['r'][$i] ?? '');
            }
            $out[] = $row;
        }
        return $out;
    }

    /** Поля формы t<req id> по именам; неизвестные имена пропускаются (их список — в $skipped). */
    function courses_fields(array $tbl, array $values, array &$skipped): array {
        $p = [];
        foreach ($values as $name => $v) {
            if (!isset($tbl['req'][$name])) {
                $skipped[] = $name;
                continue;
            }
            $p['t' . $tbl['req'][$name]] = (string) $v;
        }
        return $p;
    }

    /**
     * Записать участника. $p: name, email, phone, company, role, industry.
     * Возврат: ['ok' => bool, 'user_id' => ?string, 'created_user' => bool, 'application' => 'created'|'exists'|null,
     *           'skipped' => [поля, которых нет в схеме], 'error' => ?string]
     */
    function courses_register_participant(array $cfg, array $p, ?callable $http = null, ?float $now = null): array {
        $res = ['ok' => false, 'user_id' => null, 'created_user' => false, 'application' => null, 'skipped' => [], 'error' => null];
        $http = $http ?? 'courses_http';
        $deadline = ($now ?? microtime(true)) + $cfg['budget'];
        try {
            $login = mb_strtolower(trim((string) ($p['email'] ?? '')));
            if ($login === '' || !filter_var($login, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('courses: нужна почта для логина');
            }
            $call = fn(string $m, string $path, ?array $form = null) => courses_call($cfg, $http, $deadline, $m, $path, $form);
            $meta = $call('GET', 'metadata');
            $profile = courses_resolve_table($meta, 'Профиль');
            $request = courses_resolve_table($meta, 'Заявка');
            $users   = courses_resolve_table($meta, 'Пользователь');
            if (!$profile || !$request || !$users || !isset($profile['req']['Пользователь'], $request['req']['Пользователь'], $request['req']['Курс'], $request['req']['Статус'])) {
                throw new Exception('courses: в базе нет таблиц «Профиль»/«Заявка» с нужными полями (схема не накатана?)');
            }

            $xsrf = null;
            $write = function (string $path, array $form) use ($call, &$xsrf): array {
                $xsrf ??= (string) ($call('GET', 'xsrf')['_xsrf'] ?? '');
                return $call('POST', $path, $form + ['_xsrf' => $xsrf]);
            };

            // 1. Пользователь: фильтр ядра может быть нестрогим — точное совпадение проверяем сами.
            $uid = null;
            foreach (courses_rows($cfg, $http, $deadline, $users, (string) $users['id'], $login) as $r) {
                if (mb_strtolower(trim($r['_main'])) === $login) {
                    $uid = $r['_id'];
                    break;
                }
            }
            if ($uid === null) {
                $form = ['t' . $users['id'] => $login];
                $roleId = intake_config('COURSES_STUDENT_ROLE_ID');
                if ($roleId === null) {
                    foreach ($call('GET', 'object/42/?JSON_OBJ&LIMIT=0,200') as $rec) {
                        if (($rec['r'][0] ?? '') === 'Ученик') {
                            $roleId = (string) $rec['i'];
                        }
                    }
                }
                if ($roleId !== null && isset($users['req']['Роль'])) {
                    $form['t' . $users['req']['Роль']] = $roleId;
                }
                if (isset($users['req']['Имя']) && trim((string) ($p['name'] ?? '')) !== '') {
                    $form['t' . $users['req']['Имя']] = trim((string) $p['name']);
                }
                $d = $write('_m_new/' . $users['id'] . '?JSON&up=1', $form);
                $uid = (string) ($d['id'] ?? $d['obj'] ?? '');
                if ($uid === '') {
                    throw new Exception('courses: ядро не вернуло id пользователя');
                }
                $res['created_user'] = true;
            }
            $res['user_id'] = $uid;

            // 2. Профиль: пустые значения существующий профиль не затирают.
            $vals = [
                'Имя' => trim((string) ($p['name'] ?? '')), 'Телефон' => trim((string) ($p['phone'] ?? '')),
                'Компания' => trim((string) ($p['company'] ?? '')), 'Должность' => trim((string) ($p['role'] ?? '')),
                'Отрасль' => trim((string) ($p['industry'] ?? '')),
            ];
            $vals = array_filter($vals, fn($v) => $v !== '');
            $profId = null;
            if (!$res['created_user']) {
                foreach (courses_rows($cfg, $http, $deadline, $profile, (string) $profile['req']['Пользователь'], $login) as $r) {
                    if (courses_ref_id($r['Пользователь']) === $uid) {
                        $profId = $r['_id'];
                        break;
                    }
                }
            }
            if ($profId !== null) {
                if ($vals) {
                    $form = courses_fields($profile, $vals, $res['skipped']);
                    if ($form) {
                        $write('_m_set/' . $profId . '?JSON', $form);
                    }
                }
            } else {
                $form = courses_fields($profile, ['Пользователь' => $uid] + $vals, $res['skipped']);
                $write('_m_new/' . $profile['id'] . '?JSON&up=1', ['t' . $profile['id'] => $uid] + $form);
            }

            // 3. Заявка на эфир: одна на пользователя и курс.
            $exists = false;
            if (!$res['created_user']) {
                foreach (courses_rows($cfg, $http, $deadline, $request, (string) $request['req']['Пользователь'], $login) as $r) {
                    if (courses_ref_id($r['Пользователь']) === $uid && $r['Курс'] === $cfg['course']) {
                        $exists = true;
                        break;
                    }
                }
            }
            if ($exists) {
                $res['application'] = 'exists';
            } else {
                $fields = ['Пользователь' => $uid, 'Курс' => $cfg['course'], 'Статус' => 'регистрация'];
                if (isset($request['req']['Дата и время'])) {
                    $fields['Дата и время'] = date('d.m.Y H:i:s');
                }
                $form = courses_fields($request, $fields, $res['skipped']);
                $write('_m_new/' . $request['id'] . '?JSON&up=1', ['t' . $request['id'] => $uid . ':' . $cfg['course'] . ':' . time()] + $form);
                $res['application'] = 'created';
            }
            $res['ok'] = true;
        } catch (Throwable $e) {
            $res['error'] = $e->getMessage();
        }
        return $res;
    }

    /** Обёртка для telegram-notify.php: конфиг, вызов, строка в error_log при сбое. Ничего не бросает. */
    function courses_register_safe(array $p, ?callable $http = null): ?array {
        $cfg = courses_config();
        if ($cfg === null) {
            return null; // не настроено — запись отключена
        }
        $r = courses_register_participant($cfg, $p, $http);
        if (!$r['ok']) {
            error_log('telegram-notify: courses registration failed: ' . $r['error']);
        } elseif ($r['skipped']) {
            error_log('telegram-notify: courses fields missing in schema: ' . implode(',', array_unique($r['skipped'])));
        }
        return $r;
    }
}
