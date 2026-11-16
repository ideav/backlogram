<?php
/**
 * Прогон courses_register_participant() против фальшивого API ядра в памяти (без сети).
 * Печатает JSON: результаты сценариев и журнал вызовов. Запуск: php courses-fake-run.php
 */
require __DIR__ . '/../../public/courses-register.php';

function fake_meta(bool $withProfileExtras = true): array {
    $profReqs = [['id' => 506, 'val' => 'Пользователь'], ['id' => 507, 'val' => 'Имя']];
    if ($withProfileExtras) {
        foreach ([[601, 'Телефон'], [602, 'Компания'], [603, 'Должность'], [604, 'Отрасль']] as [$i, $v]) {
            $profReqs[] = ['id' => $i, 'val' => $v];
        }
    }
    return [
        ['id' => 18, 'up' => '0', 'val' => 'Пользователь', 'reqs' => [['id' => 115, 'val' => 'Роль'], ['id' => 33, 'val' => 'Имя']]],
        ['id' => 471, 'up' => '0', 'val' => 'Профиль', 'reqs' => $profReqs],
        ['id' => 472, 'up' => '0', 'val' => 'Заявка', 'reqs' => [
            ['id' => 514, 'val' => 'Пользователь'], ['id' => 515, 'val' => 'Курс'], ['id' => 517, 'val' => 'Код промокода'],
            ['id' => 518, 'val' => 'Статус'], ['id' => 519, 'val' => 'Дата и время']]],
    ];
}

/** Фальшивое ядро: хранит строки таблиц, фильтры F_ игнорирует (клиент обязан проверять точно). */
function make_fake(array &$db, array &$log, bool $extras = true, int $failCode = 0): callable {
    return function (string $method, string $url, array $headers, ?string $body, float $timeout) use (&$db, &$log, $extras, $failCode) {
        $path = preg_replace('#^https://ideav\.ru/courses/#', '', $url);
        parse_str((string) $body, $form);
        $log[] = ['m' => $method, 'p' => $path, 'auth' => in_array('X-Authorization: tok-secret', $headers, true), 'f' => $form, 't' => $timeout];
        if ($failCode) {
            return [$failCode, 'boom'];
        }
        if ($path === 'metadata?JSON') return [200, json_encode(fake_meta($extras))];
        if ($path === 'xsrf?JSON') return [200, json_encode(['_xsrf' => 'x1'])];
        if (preg_match('#^object/42/#', $path)) return [200, json_encode([['i' => 541, 'r' => ['Ученик']], ['i' => 568, 'r' => ['Куратор']]])];
        if (preg_match('#^object/(\d+)/#', $path, $m)) {
            $rows = [];
            foreach ($db[(int) $m[1]] ?? [] as $id => $r) $rows[] = ['i' => $id, 'r' => $r['r']];
            return [200, json_encode($rows)];
        }
        if (preg_match('#^_m_new/(\d+)\?#', $path, $m)) {
            $tid = (int) $m[1];
            $id = 1000 + count($db, COUNT_RECURSIVE);
            $meta = array_column(fake_meta(true), null, 'id')[$tid];
            $r = [$form['t' . $tid] ?? ''];
            foreach ($meta['reqs'] as $q) {
                $v = $form['t' . $q['id']] ?? '';
                $r[] = ($q['val'] === 'Пользователь' && $v !== '') ? $v . ':login' : $v;
            }
            $db[$tid][$id] = ['r' => $r];
            return [200, json_encode(['id' => $id])];
        }
        if (preg_match('#^_m_set/(\d+)\?#', $path, $m)) {
            foreach ($db as $tid => $rows) {
                if (!isset($rows[(int) $m[1]])) continue;
                $meta = array_column(fake_meta(true), null, 'id')[$tid];
                foreach ($meta['reqs'] as $i => $q) {
                    if (isset($form['t' . $q['id']])) $db[$tid][(int) $m[1]]['r'][$i + 1] = $form['t' . $q['id']];
                }
            }
            return [200, json_encode(['id' => (int) $m[1]])];
        }
        return [404, 'no route ' . $path];
    };
}

$cfg = ['token' => 'tok-secret', 'base' => 'https://ideav.ru', 'db' => 'courses', 'course' => 'efir', 'budget' => 4.0];
$out = [];

// 1. новая регистрация, затем повтор той же почты в другом регистре с другой должностью
$db = []; $log = [];
$http = make_fake($db, $log);
$p = ['name' => 'Анна', 'email' => 'Anna@Example.ru', 'phone' => '+7 900', 'company' => 'Завод', 'role' => 'ИТ-директор', 'industry' => 'Логистика'];
$out['first'] = courses_register_participant($cfg, $p, $http);
$out['afterFirst'] = ['users' => count($db[18] ?? []), 'profiles' => count($db[471] ?? []), 'requests' => count($db[472] ?? []), 'db' => $db];
$out['second'] = courses_register_participant($cfg, ['email' => 'ANNA@example.ru', 'role' => 'Директор', 'name' => '', 'phone' => '', 'company' => '', 'industry' => ''], $http);
$out['afterSecond'] = ['users' => count($db[18] ?? []), 'profiles' => count($db[471] ?? []), 'requests' => count($db[472] ?? []), 'db' => $db];
$out['allAuth'] = count(array_filter($log, fn($l) => !$l['auth'])) === 0;
$out['maxTimeout'] = max(array_column($log, 't'));

// 2. другая почта — отдельный пользователь
$out['third'] = courses_register_participant($cfg, ['email' => 'b@example.ru', 'name' => 'Б'], $http);
$out['usersAfterThird'] = count($db[18]);

// 3. ядро недоступно — не бросает
$db2 = []; $log2 = [];
$out['down'] = courses_register_participant($cfg, $p, make_fake($db2, $log2, true, 500));

// 4. схема без полей профиля — остальное пишется, пропуски в skipped
$db3 = []; $log3 = [];
$out['noExtras'] = courses_register_participant($cfg, $p, make_fake($db3, $log3, false));

// 5. не настроено / плохая почта / бюджет исчерпан
$out['noConfig'] = courses_config();
$out['badEmail'] = courses_register_participant($cfg, ['email' => 'не-почта'], $http);
$out['noBudget'] = courses_register_participant(['budget' => 1.0] + $cfg, $p, $http, microtime(true) - 100);

echo json_encode($out, JSON_UNESCAPED_UNICODE);
