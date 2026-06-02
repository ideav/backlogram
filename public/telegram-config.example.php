<?php
/**
 * Telegram Bot + GitHub intake Configuration — EXAMPLE FILE
 *
 * Copy this file to telegram-config.php and fill in your credentials.
 * Never commit telegram-config.php to version control (it is git-ignored).
 *
 * SECURITY: prefer environment variables over this file. Every value below is
 * resolved with environment-variable-first lookup (see intake-shared.php), so
 * on a real server you can set GITHUB_TOKEN, TELEGRAM_BOT_TOKEN, … in the
 * web-server / PHP-FPM environment and never place a secret on disk at all.
 * The define()s here are only a convenient fallback for simple hosting.
 *
 * How to get your credentials:
 *   1. Bot token  — create a bot via @BotFather on Telegram; it will give you a token
 *                   in the format  123456789:ABCdefGHIjklMNOpqrsTUVwxyz
 *   2. Chat ID    — can be a personal chat ID, a group ID, or a channel username.
 *                   To find your chat ID send a message to @userinfobot on Telegram.
 *                   Group/channel IDs are usually negative numbers, e.g. -1001234567890.
 *   3. SmartCaptcha keys — create a captcha at https://console.yandex.cloud/
 *                          and copy the client (public) key and server (secret) key.
 *                          Leave as stubs to disable captcha verification.
 *   4. GitHub token — a fine-grained PAT (or app token) with "Contents: read/write"
 *                     and "Issues: read/write" on the target repository. Keep it in
 *                     the environment (GITHUB_TOKEN), not in this file.
 */

// ── Telegram (used by telegram-notify.php and excel-to-app.php) ───────────────
define('TELEGRAM_BOT_TOKEN',        'YOUR_BOT_TOKEN_HERE');
define('TELEGRAM_CHAT_ID',          'YOUR_CHAT_ID_HERE');

// ── SmartCaptcha (server-side secret key) ────────────────────────────────────
define('SMARTCAPTCHA_SERVER_KEY',   'ysc2_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');

// ── GitHub intake (used by excel-to-app.php — A2) ────────────────────────────
// Prefer setting these as environment variables instead of defining them here.
//
// define('GITHUB_TOKEN',          'github_pat_xxx');     // fine-grained PAT (env recommended!)
// define('GITHUB_ISSUE_REPO',     'owner/repo');         // where order issues are created
// define('GITHUB_UPLOAD_REPO',    'owner/repo');         // where attachments are committed
//                                                        // (defaults to GITHUB_ISSUE_REPO;
//                                                        //  use a PRIVATE repo for customer data)
// define('GITHUB_UPLOAD_BRANCH',  'main');               // branch for attachment commits
// define('GITHUB_ISSUE_LABELS',   'excel-to-app,order'); // comma-separated labels (optional)

// ── Spam protection / upload limits (optional; sensible defaults apply) ───────
// define('INTAKE_RATE_LIMIT_MAX',    '5');               // max requests per IP per window
// define('INTAKE_RATE_LIMIT_WINDOW', '3600');            // window in seconds
// define('INTAKE_UPLOAD_MAX_BYTES',  '10485760');        // 10 MiB per file
// define('INTAKE_UPLOAD_MAX_FILES',  '10');              // max attachments per request
// define('INTAKE_ALLOWED_EXT',       'xlsx,xls,csv,ods');// allowed attachment extensions
