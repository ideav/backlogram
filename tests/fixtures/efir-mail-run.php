<?php
/**
 * Сценарии писем эфира без сети и без реальной почты: mailer подменяется замыканием.
 * Печатает JSON. Запуск: php efir-mail-run.php
 */
require __DIR__ . '/../../public/efir-mail.php';

$dir = sys_get_temp_dir() . '/efir-mail-' . bin2hex(random_bytes(4));
mkdir($dir);
$cfg = efir_config();
[$start] = efir_times($cfg);
$S = $start->getTimestamp();

$sent = [];
$fail = false;
$mailer = function (string $to, string $subject, string $body, string $headers, string $params) use (&$sent, &$fail): bool {
    if ($fail) { return false; }
    $sent[] = compact('to', 'subject', 'body', 'headers', 'params');
    return true;
};
$take = function () use (&$sent): array { $o = $sent; $sent = []; return $o; };
$out = ['cfg' => $cfg, 'startTs' => $S];

// --- подтверждение
$reg = ['name' => 'Анна Иванова', 'email' => 'Anna@Example.ru'];
$t0 = 1000000;
$out['c1'] = efir_send_confirmation($dir, $reg, $mailer, $t0);
$out['c1mail'] = $take();
$out['c2'] = efir_send_confirmation($dir, $reg, $mailer, $t0 + 599);                 // слишком быстро
$out['c2n'] = count($take());
$out['c3'] = efir_send_confirmation($dir, ['email' => 'anna@example.ru'] + $reg, $mailer, $t0 + 601); // регистр почты не важен
$out['c3n'] = count($take());
$fail = true;
$out['c4'] = efir_send_confirmation($dir, ['email' => 'new@example.ru', 'name' => 'Пётр'], $mailer, $t0);
$fail = false;
$out['c5'] = efir_send_confirmation($dir, ['email' => 'new@example.ru', 'name' => 'Пётр'], $mailer, $t0 + 1); // слот возвращён после сбоя
$out['c5n'] = count($take());
$out['c6'] = efir_send_confirmation($dir, ['email' => 'не почта', 'name' => 'X'], $mailer, $t0);
$out['greet'] = [efir_greeting('  Анна   Иванова'), efir_greeting('=HYPERLINK("x")'), efir_greeting(''), efir_greeting("Иван\r\nBcc: x@y.z")];
$out['kinds'] = [];
foreach (['confirm', 'remind24', 'remind1h'] as $k) {
    [$sub, $body] = efir_compose($k, $cfg, 'Анна Иванова');
    $out['kinds'][$k] = ['subject' => $sub, 'body' => $body, 'maxline' => max(array_map('strlen', explode("\n", $body)))];
}

// --- напоминания
$d2 = $dir . '/rem';
mkdir($d2);
$rows = [
    ['time' => 't', 'name' => 'Анна', 'email' => 'a@example.ru'],
    ['time' => 't', 'name' => 'Анна', 'email' => 'A@example.ru'],      // дубль
    ['time' => 't', 'name' => 'Борис', 'email' => 'b@example.ru'],
    ['time' => 't', 'name' => 'Вера', 'email' => 'v@example.ru'],       // отказалась
    ['time' => 't', 'name' => 'Глеб', 'email' => 'not-an-email'],
];
file_put_contents($d2 . '/efir.jsonl', implode("\n", array_map('json_encode', $rows)) . "\n");
file_put_contents($d2 . '/efir.cancelled.txt', "# отказались\nV@example.ru\n");
$out['r_early'] = efir_send_reminders($d2, false, $mailer, $S - 25 * 3600);
ob_start();
$out['r_dry'] = efir_send_reminders($d2, true, $mailer, $S - 24 * 3600 + 60);
ob_end_clean();
$out['r_dry_state'] = file_exists($d2 . '/efir.sent.json');
$out['r24'] = efir_send_reminders($d2, false, $mailer, $S - 24 * 3600 + 60);
$m24 = $take();
$out['r24_to'] = array_column($m24, 'to');
$out['r24_headers'] = $m24[0]['headers'] ?? '';
$out['r24_again'] = efir_send_reminders($d2, false, $mailer, $S - 24 * 3600 + 120);
$out['r24_again_n'] = count($take());
$out['r_gap'] = efir_send_reminders($d2, false, $mailer, $S - 11 * 3600);          // окно закрыто
$out['r1h'] = efir_send_reminders($d2, false, $mailer, $S - 1800);
$out['r1h_to'] = array_column($take(), 'to');
$out['r1h_again'] = efir_send_reminders($d2, false, $mailer, $S - 900);
$out['after'] = efir_send_reminders($d2, false, $mailer, $S + 1);

// поздний регистрант: окно 24 ч закрыто, подтверждение только что ушло, за час придёт после min_gap
$d3 = $dir . '/late';
mkdir($d3);
file_put_contents($d3 . '/efir.jsonl', json_encode(['name' => 'Лена', 'email' => 'l@example.ru']) . "\n");
efir_send_confirmation($d3, ['email' => 'l@example.ru', 'name' => 'Лена'], $mailer, $S - 3000);
$take();
$out['late_24'] = efir_send_reminders($d3, false, $mailer, $S - 20 * 3600)['kind'];
$out['late_gap'] = efir_send_reminders($d3, false, $mailer, $S - 3000 + 600);      // подтверждение 10 мин назад
$out['late_ok'] = efir_send_reminders($d3, false, $mailer, $S - 3000 + 1900);      // прошло больше 30 мин
$out['late_n'] = count($take());

// сбой отправки не помечает отправленным
$d4 = $dir . '/fail';
mkdir($d4);
file_put_contents($d4 . '/efir.jsonl', json_encode(['name' => 'Ян', 'email' => 'y@example.ru']) . "\n");
$fail = true;
$out['f1'] = efir_send_reminders($d4, false, $mailer, $S - 1800);
$fail = false;
$out['f2'] = efir_send_reminders($d4, false, $mailer, $S - 1700);

// ICS и переопределение конфигом
$ics = efir_ics($cfg);
$out['ics'] = $ics;
$out['ics_maxline'] = max(array_map('strlen', explode("\r\n", $ics)));
putenv('EFIR_DATE=2027-01-14');
putenv('EFIR_TIME=15:30');
putenv('EFIR_END_TIME=16:30');
putenv('EFIR_URL=https://telemost.yandex.ru/j/other');
$c2 = efir_config();
$out['override'] = ['ics' => efir_ics($c2), 'when' => efir_when_text($c2), 'ics_url' => $c2['ics_url'], 'uid' => $c2['uid']];

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
