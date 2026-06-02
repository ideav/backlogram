<?php
/**
 * Unit assertions for the pure helpers in public/intake-shared.php.
 * Exits 0 on success; on the first failure prints the message and exits 1.
 */

require __DIR__ . '/../../public/intake-shared.php';

$failures = 0;
function check(string $label, bool $cond): void {
    global $failures;
    if (!$cond) {
        fwrite(STDERR, "FAIL: $label\n");
        $failures++;
    }
}

// ── intake_is_same_host ───────────────────────────────────────────────────────
check('same host matches', intake_is_same_host('https://example.com/page', 'example.com'));
check('same host ignores port', intake_is_same_host('https://example.com:443/p', 'example.com:80'));
check('different host rejected', !intake_is_same_host('https://evil.com/p', 'example.com'));
check('missing referer rejected', !intake_is_same_host(null, 'example.com'));
check('empty referer rejected', !intake_is_same_host('', 'example.com'));

// ── intake_has_idb_cookie ─────────────────────────────────────────────────────
check('idb cookie detected', intake_has_idb_cookie(['idb_abc' => '1', 'other' => '2']));
check('no idb cookie', !intake_has_idb_cookie(['session' => '1']));

// ── intake_escape_markdown ────────────────────────────────────────────────────
check('markdown escapes dot', intake_escape_markdown('a.b') === 'a\\.b');
check('markdown escapes dash', intake_escape_markdown('a-b') === 'a\\-b');

// ── intake_sanitize_filename ──────────────────────────────────────────────────
check('sanitize strips path', intake_sanitize_filename('../../etc/passwd') === 'passwd');
check('sanitize keeps ext', intake_sanitize_filename('Заказ 2024.xlsx') === 'xlsx' || str_ends_with(intake_sanitize_filename('order 2024.xlsx'), '.xlsx'));
check('sanitize replaces spaces', intake_sanitize_filename('my file.xls') === 'my_file.xls');
check('sanitize empty fallback', intake_sanitize_filename('***') === 'file');

// ── intake_is_allowed_upload ──────────────────────────────────────────────────
check('xlsx allowed', intake_is_allowed_upload('data.xlsx', 1000, 10000, ['xlsx', 'csv']));
check('exe rejected', !intake_is_allowed_upload('virus.exe', 1000, 10000, ['xlsx', 'csv']));
check('too big rejected', !intake_is_allowed_upload('data.xlsx', 20000, 10000, ['xlsx']));
check('zero size rejected', !intake_is_allowed_upload('data.xlsx', 0, 10000, ['xlsx']));
check('no extension rejected', !intake_is_allowed_upload('data', 100, 10000, ['xlsx']));

// ── intake_verify_captcha (injected http) ─────────────────────────────────────
$okPost = fn($url, $params) => json_encode(['status' => 'ok']);
$badPost = fn($url, $params) => json_encode(['status' => 'failed']);
check('captcha disabled when no key', intake_verify_captcha('', '', '', $okPost));
check('captcha disabled with stub key', intake_verify_captcha('', 'ysc2_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', '', $okPost));
check('captcha empty token fails with real key', !intake_verify_captcha('', 'ysc2_realkey', '', $okPost));
check('captcha ok status passes', intake_verify_captcha('tok', 'ysc2_realkey', '', $okPost));
check('captcha bad status fails', !intake_verify_captcha('tok', 'ysc2_realkey', '', $badPost));

// ── intake_rate_limit ─────────────────────────────────────────────────────────
$dir = sys_get_temp_dir() . '/intake-unit-rl-' . getmypid();
@array_map('unlink', glob("$dir/*") ?: []);
$now = 1000;
check('rl allows under limit 1', intake_rate_limit('1.2.3.4', 2, 60, $dir, $now));
check('rl allows under limit 2', intake_rate_limit('1.2.3.4', 2, 60, $dir, $now + 1));
check('rl blocks over limit', !intake_rate_limit('1.2.3.4', 2, 60, $dir, $now + 2));
check('rl allows after window', intake_rate_limit('1.2.3.4', 2, 60, $dir, $now + 100));
check('rl separate key allowed', intake_rate_limit('9.9.9.9', 2, 60, $dir, $now + 2));
check('rl disabled when max 0', intake_rate_limit('1.2.3.4', 0, 60, $dir, $now + 2));
@array_map('unlink', glob("$dir/*") ?: []);
@rmdir($dir);

// ── intake_config (env first) ─────────────────────────────────────────────────
putenv('INTAKE_TEST_CFG=from_env');
define('INTAKE_TEST_CFG', 'from_define');
check('config prefers env', intake_config('INTAKE_TEST_CFG') === 'from_env');
putenv('INTAKE_TEST_CFG');
check('config falls back to define', intake_config('INTAKE_TEST_CFG') === 'from_define');
check('config default when missing', intake_config('INTAKE_TOTALLY_MISSING', 'dflt') === 'dflt');

// ── intake_config_flag ────────────────────────────────────────────────────────
putenv('INTAKE_TEST_FLAG=yes');
check('flag yes truthy', intake_config_flag('INTAKE_TEST_FLAG'));
putenv('INTAKE_TEST_FLAG=0');
check('flag 0 falsy', !intake_config_flag('INTAKE_TEST_FLAG'));
putenv('INTAKE_TEST_FLAG');

// ── intake_encode_path ────────────────────────────────────────────────────────
check('encode path keeps slashes', intake_encode_path('orders/a b/c.xlsx') === 'orders/a%20b/c.xlsx');

if ($failures > 0) {
    fwrite(STDERR, "$failures assertion(s) failed\n");
    exit(1);
}
echo "all intake unit assertions passed\n";
