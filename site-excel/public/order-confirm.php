<?php
/**
 * Подтверждение адреса по ссылке из письма на лендинге excel-to-app.ru (#624).
 *
 * Тот же шаг, что excel-to-app-confirm.php на ideav.ru, но публикация другая:
 * на лендинге нет ни GitHub-issue, ни капчи — заявка уходит оператору спулом в
 * Telegram (order-lib.php), как уходила бы сразу до #624. Поэтому здесь только
 * связка, а страницы и разбор токена — из общей библиотеки.
 *
 * Идемпотентность обеспечивает intake_queue_confirm() под flock: по ссылке из
 * письма приходит не одно обращение (предзагрузка почтовыми клиентами, двойной
 * клик), и оператор не должен получить заявку дважды.
 */

require_once __DIR__ . '/order-intake.php';
require_once __DIR__ . '/intake-confirm-page.php';

$token = trim((string) ($_GET['token'] ?? ''));
if ($token === '') {
    intake_confirm_page_for('missing_token', intake_confirm_ttl());
}

$queueDir = order_queue_dir();
$result   = intake_queue_confirm($queueDir, $token);

// Просрочено / уже подтверждено / не найдено — страница и выход. Дальше идёт
// только успешное подтверждение.
intake_confirm_page_for($result['status'], intake_confirm_ttl());

$record  = $result['record'];
$id      = (string) $record['id'];
$contact = (string) ($record['contact'] ?? '');

if (!order_confirm_publish($queueDir, $id)) {
    // Подтверждение уже состоялось — откатывать его нельзя, иначе ссылка из
    // письма перестанет работать. Заявка остаётся confirmed без отметки
    // spooled, и её добирает cron (order-deliver.php).
    error_log('order-confirm.php: заявка ' . $id . ' подтверждена, но не ушла оператору');
}

intake_confirm_page(200, 'Заявка подтверждена — приступаем',
    'Спасибо! Адрес подтверждён, заявка ушла в работу. Приложение по вашим данным собирается примерно <strong>45 минут</strong>.',
    '<p>Когда всё будет готово, на <strong>' . htmlspecialchars($contact, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
    . '</strong> придёт письмо со ссылкой на приложение и доступом администратора.</p>'
    . '<p class="muted">Эту страницу можно закрыть. Если через час письма нет — проверьте папку «Спам» или напишите нам в Telegram.</p>');
