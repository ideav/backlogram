<?php
/**
 * Служебная команда (только CLI): напоминания участникам эфира за сутки и за час.
 *
 *   php efir-reminders.php [--dry-run]     разослать то, чьё окно открыто сейчас
 *   php efir-reminders.php --ics           вывести файл .ics эфира (для статики)
 *
 * Запускать из cron раз в 10–15 минут, например:
 *   0,10,20,30,40,50 * * * * php /путь/к/вебруту/efir-reminders.php >> /var/log/efir-reminders.log 2>&1
 *
 * Окна: «за сутки» — от начала-24 ч до начала-12 ч (2 декабря с 11:00 МСК),
 * «за час» — от начала-1 ч до начала (3 декабря с 10:00 МСК). Что уже отправлено,
 * записано в <REGISTRATIONS_DIR>/efir.sent.json — повторный запуск не шлёт дважды.
 * Отказавшиеся (по одной почте на строку) — в <REGISTRATIONS_DIR>/efir.cancelled.txt.
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/efir-mail.php';
$config = __DIR__ . '/telegram-config.php';
if (is_file($config)) { require_once $config; }

$args = array_slice($argv, 1);
if (in_array('--ics', $args, true)) {
    echo efir_ics(efir_config());
    exit(0);
}
$dry = in_array('--dry-run', $args, true);
$cfg = efir_config();
$dir = intake_registrations_dir();
if (!is_file($dir . '/' . $cfg['source'] . '.jsonl')) {
    fwrite(STDERR, "Нет списка участников: $dir/{$cfg['source']}.jsonl\n");
    exit(1);
}
$r = efir_send_reminders($dir, $dry);
if ($r['kind'] === null) {
    echo date('c') . " вне окон напоминаний, ничего не делаю\n";
    exit(0);
}
echo date('c') . " {$r['kind']}: отправлено {$r['sent']}, ошибок {$r['failed']}, пропущено {$r['skipped']}, в очереди {$r['pending']}"
    . ($dry ? ' (dry-run)' : '') . "\n";
exit($r['failed'] > 0 ? 2 : 0);
