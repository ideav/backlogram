<?php
/**
 * Подтверждение адреса по ссылке из письма (double opt-in, issue #624).
 *
 * Здесь замыкается первая половина контура: до перехода по этой ссылке заявка
 * лежит в очереди и ничего не запускает, после — публикуется (вложения →
 * GitHub, issue, уведомление оператору) и становится доступна сборщику
 * (см. excel-to-app-build.php, action=claim).
 *
 * Идемпотентность обязательна: по ссылке из письма прилетает не одно
 * обращение — почтовые клиенты и антивирусы предзагружают ссылки, люди жмут
 * дважды. Переход pending_confirmation → confirmed делается под flock внутри
 * intake_queue_confirm(), повторное обращение видит «уже подтверждено» и не
 * запускает вторую сборку.
 *
 * Отвечает человеку HTML-страницей (успех / просрочено / повтор), а не JSON:
 * по этой ссылке приходит клиент из почты, а не браузерный скрипт.
 */

require_once __DIR__ . '/intake-shared.php';
require_once __DIR__ . '/intake-queue.php';
require_once __DIR__ . '/intake-publish.php';

// Optional config file with define()s (git-ignored). Environment still wins.
$config_file = __DIR__ . '/telegram-config.php';
if (file_exists($config_file)) {
    require_once $config_file;
}

const CONFIRM_FORM_URL = 'https://ideav.ru/excel-to-app.html';

/** Отдать страницу и закончить. */
function confirm_page(int $status, string $heading, string $lead, string $extra = ''): void {
    http_response_code($status);
    header('Content-Type: text/html; charset=UTF-8');
    // Ссылка одноразовая и персональная — в индексе ей не место.
    header('X-Robots-Tag: noindex, nofollow');
    $h = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    echo '<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>' . $h($heading) . ' — Интеграм</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         font: 16px/1.6 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         background: #f8fafc; color: #0f172a; padding: 24px; }
  .card { max-width: 34rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px;
          padding: 40px 32px; box-shadow: 0 12px 40px rgba(15, 23, 42, .08); }
  h1 { margin: 0 0 12px; font-size: 1.6rem; line-height: 1.25; }
  p { margin: 0 0 12px; color: #475569; }
  a { color: #2563eb; }
  .muted { font-size: .875rem; color: #64748b; }
  @media (prefers-color-scheme: dark) {
    body { background: #020618; color: #e2e8f0; }
    .card { background: #0f172a; border-color: #1e293b; box-shadow: none; }
    p { color: #94a3b8; }
  }
</style>
</head>
<body>
<div class="card">
<h1>' . $h($heading) . '</h1>
<p>' . $lead . '</p>
' . $extra . '
<p class="muted">Интеграм · <a href="https://ideav.ru">ideav.ru</a> · Telegram: <a href="https://t.me/qdmadept">@qdmadept</a></p>
</div>
</body>
</html>';
    exit;
}

// ── Токен ─────────────────────────────────────────────────────────────────────
$token = trim((string) ($_GET['token'] ?? ''));
if ($token === '') {
    confirm_page(400, 'Ссылка неполная',
        'В адресе нет кода подтверждения. Откройте ссылку из письма целиком — почтовые клиенты иногда обрезают длинные адреса.',
        '<p><a href="' . CONFIRM_FORM_URL . '">Оставить заявку заново</a></p>');
}

$queueDir = intake_queue_dir();
$result   = intake_queue_confirm($queueDir, $token);

switch ($result['status']) {
    case 'expired':
        confirm_page(410, 'Ссылка устарела',
            'Подтвердить заявку можно было в течение ' . max(1, (int) round(intake_confirm_ttl() / 3600))
            . ' ч после отправки. Файлы мы удалили — как и обещали в письме.',
            '<p><a href="' . CONFIRM_FORM_URL . '">Отправить заявку заново</a> — это займёт минуту.</p>');
        // no break: confirm_page() завершает запрос

    case 'already':
        confirm_page(200, 'Заявка уже подтверждена',
            'Спасибо, подтверждение мы получили раньше — повторно ничего делать не нужно. Приложение уже в работе: ссылка и доступ придут на тот же адрес.',
            '<p class="muted">Если с момента подтверждения прошло больше двух часов, напишите нам в Telegram — проверим, что происходит.</p>');
        // no break

    case 'not_found':
        confirm_page(404, 'Ссылка не найдена',
            'Такой заявки у нас нет: ссылка могла быть скопирована не полностью или заявка уже удалена по истечении срока.',
            '<p><a href="' . CONFIRM_FORM_URL . '">Оставить заявку заново</a></p>');
        // no break
}

// ── Подтверждено: публикуем заявку и отдаём её сборщику ──────────────────────
$record = $result['record'];
$id     = (string) $record['id'];

$published = intake_publish_order([
    'id'           => $id,
    'source_label' => (string) ($record['source_label'] ?? 'Excel → приложение'),
    'name'         => (string) ($record['name'] ?? ''),
    'company'      => (string) ($record['company'] ?? ''),
    'contact'      => (string) ($record['contact'] ?? ''),
    'topic'        => (string) ($record['topic'] ?? ''),
    'confirmed'    => true,
], intake_queue_files($queueDir, $id));

if ($published['ok']) {
    intake_queue_mark($queueDir, $id, null, [
        'issue_url'    => $published['issue_url'],
        'issue_number' => $published['issue_number'],
        'attachments'  => $published['attachments'],
        'publish_error' => null,
    ]);
} else {
    // Подтверждение состоялось — откатывать его нельзя, иначе ссылка из письма
    // перестанет работать. Заявка остаётся confirmed без issue, а публикацию
    // добирает excel-to-app-queue.php (cron): GitHub и Telegram отсюда падают
    // регулярно, и терять из-за этого заявку незачем.
    error_log('excel-to-app-confirm.php: публикация заявки ' . $id . ' не удалась: ' . (string) ($published['error'] ?? ''));
    intake_queue_mark($queueDir, $id, null, ['publish_error' => (string) ($published['error'] ?? 'publish failed')]);
}

confirm_page(200, 'Заявка подтверждена — приступаем',
    'Спасибо! Адрес подтверждён, заявка ушла в работу. Приложение по вашим данным собирается примерно <strong>45 минут</strong>.',
    '<p>Когда всё будет готово, на <strong>' . htmlspecialchars((string) ($record['contact'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
    . '</strong> придёт письмо со ссылкой на приложение и доступом администратора.</p>'
    . '<p class="muted">Эту страницу можно закрыть. Если через час письма нет — проверьте папку «Спам» или напишите нам в Telegram.</p>');
