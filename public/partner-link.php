<?php
/**
 * Точка входа /m/<токен> (правило в .htaccess): пишет событие и перенаправляет
 * на материал. Адрес назначения берётся только из materials.json — из запроса
 * его подставить нельзя (нет открытого редиректа).
 */
require_once __DIR__ . '/partner-link-lib.php';

$config = __DIR__ . '/partner-config.php';
if (is_file($config)) {
    require_once $config;
}
$dir = defined('PARTNER_DATA_DIR') ? PARTNER_DATA_DIR
     : dirname(rtrim($_SERVER['DOCUMENT_ROOT'] ?? __DIR__, '/')) . '/partner-data';
$salt = defined('PARTNER_IP_SALT') ? PARTNER_IP_SALT : '';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer-when-downgrade');

if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD'], true)) {
    http_response_code(405);
    exit;
}

$token = $_GET['t'] ?? '';
$hit = pl_resolve(pl_load_json($dir . '/links.json'), pl_load_json($dir . '/materials.json'), $token);
if ($hit === null) {
    http_response_code(404);
    echo 'Ссылка не найдена';
    exit;
}

$visitor = $_COOKIE['pvid'] ?? '';
$first = false;
if (!preg_match('/^[a-f0-9]{16}$/', $visitor)) {
    $visitor = bin2hex(random_bytes(8));
    $first = true;
    header('Set-Cookie: pvid=' . $visitor . '; Max-Age=31536000; Path=/; Secure; HttpOnly; SameSite=Lax', false);
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'HEAD') {
    $refHost = (string)parse_url($_SERVER['HTTP_REFERER'] ?? '', PHP_URL_HOST);
    pl_append_event($dir, pl_build_event($hit['partner'], $hit['material'], $_SERVER['HTTP_USER_AGENT'] ?? '',
        $_SERVER['REMOTE_ADDR'] ?? '', $visitor, $first, $refHost, $salt));
}
header('Location: ' . pl_target_url($hit['info'], $hit['partner']), true, 302);
