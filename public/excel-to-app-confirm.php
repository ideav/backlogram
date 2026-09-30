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
// Разметка и тексты страниц — общие с лендингом excel-to-app.ru: клиент видит
// одно и то же обещание независимо от домена, где заполнял форму.
require_once __DIR__ . '/intake-confirm-page.php';

// Optional config file with define()s (git-ignored). Environment still wins.
$config_file = __DIR__ . '/telegram-config.php';
if (file_exists($config_file)) {
    require_once $config_file;
}

// ── Токен ─────────────────────────────────────────────────────────────────────
$token = trim((string) ($_GET['token'] ?? ''));
if ($token === '') {
    intake_confirm_page_for('missing_token', intake_confirm_ttl());
}

$queueDir = intake_queue_dir();
$result   = intake_queue_confirm($queueDir, $token);

// Просрочено / уже подтверждено / не найдено — страница и выход. Дальше идёт
// только успешное подтверждение.
intake_confirm_page_for($result['status'], intake_confirm_ttl());

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

intake_confirm_page(200, 'Заявка подтверждена — приступаем',
    'Спасибо! Адрес подтверждён, заявка ушла в работу. Приложение по вашим данным собирается примерно <strong>45 минут</strong>.',
    '<p>Когда всё будет готово, на <strong>' . htmlspecialchars((string) ($record['contact'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
    . '</strong> придёт письмо со ссылкой на приложение и доступом администратора.</p>'
    . '<p class="muted">Эту страницу можно закрыть. Если через час письма нет — проверьте папку «Спам» или напишите нам в Telegram.</p>');
