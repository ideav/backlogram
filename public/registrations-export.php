<?php
/**
 * Служебная команда (только CLI): выгрузить список участников в CSV.
 *
 *   php registrations-export.php efir > efir.csv
 *
 * Одна строка на почту (повторная регистрация обновляет поля, время — первой).
 * CSV для Excel: UTF-8 с BOM, разделитель «;».
 * Каталог списков — REGISTRATIONS_DIR из окружения/telegram-config.php,
 * по умолчанию ../registrations рядом с вебрутом (см. intake-shared.php).
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/intake-shared.php';
$config = __DIR__ . '/telegram-config.php';
if (is_file($config)) { require_once $config; }

$source = $argv[1] ?? '';
if (!preg_match('/^[a-z0-9-]{1,40}$/', $source)) {
    fwrite(STDERR, "Использование: php registrations-export.php <источник>, например efir\n");
    exit(1);
}
$file = intake_registrations_dir() . '/' . $source . '.jsonl';
if (!is_file($file)) {
    fwrite(STDERR, "Нет списка: $file\n");
    exit(1);
}

$cols = ['time' => 'Зарегистрирован', 'name' => 'Имя', 'email' => 'Почта', 'phone' => 'Телефон',
         'company' => 'Компания', 'role' => 'Должность', 'industry' => 'Отрасль'];
// Защита от формул в Excel (поля вводит посетитель): «=…», «@…», «+SUM(…)»
// гасим апострофом; телефоны «+7 …» и «-» с цифрой не трогаем.
$cell = fn (string $v): string => preg_match('/^(?:[=@\t\r]|[+\-](?![\d\s(]))/', $v) ? "'" . $v : $v;
$rows = intake_registrations_read($file);
$out = fopen('php://stdout', 'w');
fwrite($out, "\xEF\xBB\xBF");
fputcsv($out, array_values($cols), ';');
foreach ($rows as $r) {
    fputcsv($out, array_map(fn ($k) => $cell($r[$k] ?? ''), array_keys($cols)), ';');
}
fwrite(STDERR, count($rows) . " участник(ов)\n");
