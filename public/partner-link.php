<?php
/**
 * Точка входа /m/<токен> (правило в .htaccess): находит ссылку в таблице
 * «Ссылка партнёра», перенаправляет на материал и пишет «Событие партнёра».
 * Адрес назначения берётся только из materials.json — из запроса его
 * подставить нельзя (нет открытого редиректа).
 */
require_once __DIR__ . '/partner-link-lib.php';

$config = __DIR__ . '/partner-config.php';
if (is_file($config)) {
    require_once $config;
}
$dir = defined('PARTNER_DATA_DIR') ? PARTNER_DATA_DIR
     : dirname(rtrim($_SERVER['DOCUMENT_ROOT'] ?? __DIR__, '/')) . '/partner-data';
$cfg = pl_api_cfg();

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer-when-downgrade');

if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD'], true)) {
    http_response_code(405);
    exit;
}

$hit = pl_resolve($dir, $cfg, pl_load_json($dir . '/materials.json'), $_GET['t'] ?? '');
if ($hit === null) {
    http_response_code(404);
    echo 'Ссылка не найдена';
    exit;
}

$visitor = $_COOKIE['pvid'] ?? '';
if (!preg_match('/^[a-f0-9]{16}$/', $visitor)) {
    $visitor = bin2hex(random_bytes(8));
    header('Set-Cookie: pvid=' . $visitor . '; Max-Age=31536000; Path=/; Secure; HttpOnly; SameSite=Lax', false);
}
header('Location: ' . pl_target_url($hit['info'], $hit['partner']), true, 302);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'HEAD') {
    exit;
}
// Посетитель уже ушёл на материал; запись события его не задерживает.
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}
pl_record_event($dir, $cfg, pl_build_event($hit['partner'], $hit['material'], (string)($hit['info']['title'] ?? ''),
    $_SERVER['HTTP_USER_AGENT'] ?? '', $visitor, (string)parse_url($_SERVER['HTTP_REFERER'] ?? '', PHP_URL_HOST)));
