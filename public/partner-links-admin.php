<?php
/**
 * Служебная команда (только CLI):
 *   php partner-links-admin.php issue <номер партнёра>  — выдать ссылки в таблице «Ссылка партнёра»
 *   php partner-links-admin.php flush                   — дослать в «Событие партнёра» события,
 *                                                         которые не записались (очередь events.jsonl)
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/partner-link-lib.php';
$config = __DIR__ . '/partner-config.php';
if (is_file($config)) { require_once $config; }
$dir = defined('PARTNER_DATA_DIR') ? PARTNER_DATA_DIR : __DIR__ . '/../partner-data';
$host = getenv('PARTNER_HOST') ?: 'https://ideav.ru';
$cfg = pl_api_cfg();
$cmd = $argv[1] ?? '';
if ($cfg['token'] === '') { fwrite(STDERR, "Не задан PARTNER_API_TOKEN в partner-config.php\n"); exit(1); }
if ($cmd === 'issue' && preg_match('/^\d+$/', $argv[2] ?? '')) {
    foreach (pl_issue($cfg, pl_load_json($dir . '/materials.json'), $argv[2]) as $m => [$tok, $kind]) {
        echo $m, "\t", $kind === 'bot' ? "https://t.me/Integrammbot?start=$tok" : "$host/m/$tok", "\n";
    }
} elseif ($cmd === 'flush') {
    [$sent, $left] = pl_flush($dir, $cfg);
    echo "отправлено $sent, осталось в очереди $left\n";
    exit($left > 0 ? 2 : 0);
} else { fwrite(STDERR, "Использование: issue <номер партнёра> | flush\n"); exit(1); }
