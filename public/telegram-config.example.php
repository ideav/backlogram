<?php
/**
 * Telegram Bot Configuration — EXAMPLE FILE
 *
 * Copy this file to telegram-config.php and fill in your credentials.
 * Never commit telegram-config.php to version control.
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
 */

define('TELEGRAM_BOT_TOKEN',        'YOUR_BOT_TOKEN_HERE');
define('TELEGRAM_CHAT_ID',          'YOUR_CHAT_ID_HERE');
define('SMARTCAPTCHA_SERVER_KEY',   'ysc2_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
