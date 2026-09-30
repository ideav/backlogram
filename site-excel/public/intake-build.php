<?php
/**
 * СГЕНЕРИРОВАННАЯ КОПИЯ public/intake-build.php — править здесь нельзя.
 *
 * Лендинг excel-to-app.ru живёт в отдельном вебруте, файлов основного сайта
 * в нём нет, а контур подтверждения адреса нужен тот же самый (issue #624).
 * Обновить: `node scripts/sync-excel-intake.mjs`. Расхождение с источником
 * ловит tests/excel-landing-confirm.test.mjs.
 */
/**
 * Протокол моста «подтверждённая заявка → сборщик → письмо клиенту» (#624).
 *
 * Вторая половина контура, одна для обоих доменов: ideav.ru
 * (excel-to-app-build.php) и excel-to-app.ru (order-build.php) — тонкие входы,
 * которые задают канал сигнала оператору и вид заявки для сборщика, а сам
 * протокол живёт здесь. Расходиться двум реализациям нельзя: сборщик один.
 *
 * Связка сделана **очередью, которую забирает сборщик**, а не вызовом сборщика
 * из PHP:
 *   - веб-хост не достаёт до машины сборщика (и не должен: это значило бы
 *     держать во фронтовом PHP доступ в контур сборки);
 *   - pull переживает перезапуски и обновления бота: работа лежит в очереди и
 *     дождётся, а не теряется в неудавшемся исходящем запросе;
 *   - claim/deliver делают шаг идемпотентным: заявка уходит в сборку один раз,
 *     повторный claim её уже не видит, повторный deliver не рассылает второе
 *     письмо.
 *
 * Протокол (POST, `Authorization: Bearer <токен>`, он же `X-Build-Token`):
 *   action=claim   [limit=1..20]      → забрать подтверждённые заявки (confirmed → building)
 *   action=deliver request_id, app_url, admin_login, admin_password, what_inside…
 *                                     → отправить клиенту письмо «приложение готово», building → delivered
 *   action=fail    request_id, reason → building → failed + сигнал оператору
 *   action=status  request_id         → текущее состояние заявки
 *
 * Токен живёт только в окружении. Не задан — 503 и ничего не делаем: открытым
 * мост не бывает.
 *
 * Хост может определить до вызова intake_build_run():
 *   intake_build_job_view(array $record): array — что видит сборщик в claim;
 *   intake_build_alert(string $id, string $contact, string $reason): void —
 *   куда идёт сигнал о неудавшейся сборке.
 */

if (!defined('INTAKE_BUILD_LOADED')) {
    define('INTAKE_BUILD_LOADED', true);

    // Как и в intake-mail.php: из intake-shared.php нужен только intake_config().
    if (!function_exists('intake_config')) {
        require_once __DIR__ . '/intake-shared.php';
    }
    require_once __DIR__ . '/intake-queue.php';
    require_once __DIR__ . '/intake-mail.php';

    function intake_build_respond(int $status, array $payload): void {
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /** Bearer-токен из заголовка (или X-Build-Token — не все прокси пропускают Authorization). */
    function intake_build_request_token(array $server): string {
        $auth = (string) ($server['HTTP_AUTHORIZATION'] ?? $server['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
        if (preg_match('/^Bearer\s+(.+)$/i', trim($auth), $m) === 1) {
            return trim($m[1]);
        }
        return trim((string) ($server['HTTP_X_BUILD_TOKEN'] ?? ''));
    }

    /** Что видит сборщик в ответе claim, если хост не определил своё представление. */
    function intake_build_default_job(array $record): array {
        return [
            'id'           => (string) $record['id'],
            'source'       => (string) ($record['source'] ?? ''),
            'source_label' => (string) ($record['source_label'] ?? ''),
            'name'         => (string) ($record['name'] ?? ''),
            'company'      => (string) ($record['company'] ?? ''),
            'contact'      => (string) ($record['contact'] ?? ''),
            'topic'        => (string) ($record['topic'] ?? ''),
            'confirmed_at' => (int) ($record['confirmed_at'] ?? 0),
            'issue_url'    => (string) ($record['issue_url'] ?? ''),
            'issue_number' => $record['issue_number'] ?? null,
            'attachments'  => array_values((array) ($record['attachments'] ?? [])),
        ];
    }

    /**
     * Разобрать запрос и выполнить действие. Всегда завершает запрос.
     *
     * @param string $queueDir каталог очереди этого сайта
     * @param string $tokenEnv имя переменной с токеном моста
     */
    function intake_build_run(string $queueDir, string $tokenEnv = 'INTAKE_BUILD_TOKEN'): void {
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
            intake_build_respond(405, ['ok' => false, 'error' => 'Method not allowed.']);
        }

        $expectedToken = (string) intake_config($tokenEnv, '');
        if ($expectedToken === '') {
            intake_build_respond(503, ['ok' => false, 'error' => 'Build bridge is not configured.']);
        }
        if (!hash_equals($expectedToken, intake_build_request_token($_SERVER))) {
            intake_build_respond(401, ['ok' => false, 'error' => 'Unauthorized.']);
        }

        // Поля принимаем и формой, и JSON-телом — сборщику удобнее JSON.
        $input = $_POST;
        if (!$input) {
            $decoded = json_decode((string) file_get_contents('php://input'), true);
            if (is_array($decoded)) {
                $input = $decoded;
            }
        }

        $action = trim((string) ($input['action'] ?? ''));

        // ── claim: забрать подтверждённые заявки в работу ────────────────────
        if ($action === 'claim') {
            $limit = max(1, min(20, (int) ($input['limit'] ?? 5)));
            $jobs  = [];
            foreach (intake_queue_claim($queueDir, $limit) as $record) {
                $jobs[] = function_exists('intake_build_job_view')
                    ? intake_build_job_view($record)
                    : intake_build_default_job($record);
            }
            intake_build_respond(200, ['ok' => true, 'jobs' => $jobs, 'count' => count($jobs)]);
        }

        // Остальные действия работают с конкретной заявкой.
        $requestId = trim((string) ($input['request_id'] ?? ''));
        $record    = $requestId !== '' ? intake_queue_load($queueDir, $requestId) : null;
        if ($record === null) {
            intake_build_respond(404, ['ok' => false, 'error' => 'Заявка не найдена: ' . $requestId]);
        }

        // ── status: посмотреть состояние заявки ──────────────────────────────
        if ($action === 'status') {
            unset($record['token_hash']);
            intake_build_respond(200, ['ok' => true, 'request' => $record]);
        }

        // ── deliver: сборка готова → письмо клиенту ──────────────────────────
        if ($action === 'deliver') {
            if (($record['status'] ?? '') === INTAKE_STATUS_DELIVERED) {
                // Повторный отчёт о той же сборке: второго письма клиент не получит.
                intake_build_respond(200, ['ok' => true, 'already' => true, 'status' => INTAKE_STATUS_DELIVERED]);
            }

            $appUrl = trim((string) ($input['app_url'] ?? ''));
            $login  = trim((string) ($input['admin_login'] ?? ''));
            $pass   = trim((string) ($input['admin_password'] ?? ''));
            $inside = trim((string) ($input['what_inside'] ?? ''));
            if ($appUrl === '' || $login === '' || $pass === '') {
                intake_build_respond(400, ['ok' => false, 'error' => 'Нужны app_url, admin_login и admin_password.']);
            }

            $contact = (string) ($record['contact'] ?? '');
            if (!intake_is_email($contact)) {
                intake_build_respond(409, ['ok' => false, 'error' => 'У заявки не email-контакт — результат отправляется вручную: ' . $contact]);
            }

            $topic      = trim((string) ($input['topic'] ?? ($record['topic'] ?? '')));
            $topicShort = trim((string) ($input['topic_short'] ?? ''));
            $body = intake_render_template(intake_mail_app_ready_template(), [
                'тематика'         => $topic !== '' ? $topic : 'ваша задача из заявки',
                'app_url'          => $appUrl,
                'admin_login'      => $login,
                'admin_password'   => $pass,
                'что_внутри'       => $inside !== '' ? $inside : '— Приложение собрано по вашему файлу: справочники, рабочие места и логика, которую в нём видно.',
                'цена_разбора'     => trim((string) ($input['price_razbor'] ?? '20 000 ₽')),
                'вилка_разработки' => trim((string) ($input['dev_range'] ?? '50–100 тыс. ₽')),
            ]);

            $sent = intake_mail_send($contact, intake_mail_app_ready_subject($topicShort), $body);
            if (!$sent) {
                // Статус не двигаем: сборщик может повторить deliver, и письмо
                // уйдёт со второй попытки. Молча «доставленной» заявка не станет.
                error_log('intake-build: письмо-результат не отправлено для ' . $requestId);
                intake_build_respond(502, ['ok' => false, 'error' => 'Письмо не отправлено — повторите запрос.']);
            }

            intake_queue_mark($queueDir, $requestId, INTAKE_STATUS_DELIVERED, [
                'delivered_at' => time(),
                'app_url'      => $appUrl,
            ]);
            intake_build_respond(200, ['ok' => true, 'status' => INTAKE_STATUS_DELIVERED, 'mailed_to' => $contact]);
        }

        // ── fail: сборка не удалась → к оператору ────────────────────────────
        if ($action === 'fail') {
            $reason = trim((string) ($input['reason'] ?? 'без объяснения'));
            intake_queue_mark($queueDir, $requestId, INTAKE_STATUS_FAILED, ['fail_reason' => $reason]);
            if (function_exists('intake_build_alert')) {
                intake_build_alert($requestId, (string) ($record['contact'] ?? ''), $reason);
            }
            intake_build_respond(200, ['ok' => true, 'status' => INTAKE_STATUS_FAILED]);
        }

        intake_build_respond(400, ['ok' => false, 'error' => 'Неизвестное действие: ' . $action]);
    }
}
