<?php
/**
 * Служебная команда (только CLI):
 *   php partner-links-admin.php issue <партнёр>   — выдать токены на все материалы
 *   php partner-links-admin.php report            — сводка открытий по партнёрам
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/partner-link-lib.php';
$config = __DIR__ . '/partner-config.php';
if (is_file($config)) { require_once $config; }
$dir = defined('PARTNER_DATA_DIR') ? PARTNER_DATA_DIR : __DIR__ . '/../partner-data';
$host = getenv('PARTNER_HOST') ?: 'https://ideav.ru';
$cmd = $argv[1] ?? '';
if ($cmd === 'issue' && !empty($argv[2])) {
    foreach (pl_issue($dir, $argv[2]) as $m => $tok) { echo $m, "\t", $host, '/m/', $tok, "\n"; }
} elseif ($cmd === 'report') {
    foreach (pl_report($dir) as $p => $ms) { foreach ($ms as $m => $v) {
        echo "партнёр $p\t$m\tоткрытий {$v['open']}\tуникальных {$v['unique']}\tботов {$v['bot']}\tпоследнее {$v['last']}\n"; } }
} else { fwrite(STDERR, "Использование: issue <партнёр> | report\n"); exit(1); }
