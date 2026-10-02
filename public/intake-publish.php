<?php
/**
 * Публикация заявки: вложения → GitHub, issue, уведомление в Telegram.
 *
 * Выделено из excel-to-app.php (issue #624), потому что теперь этот шаг зовут
 * из двух мест:
 *   - excel-to-app.php — заявки без email (телеграм-контакт), как и раньше;
 *   - excel-to-app-confirm.php — заявки с email, но только после того, как
 *     клиент перешёл по ссылке из письма.
 *
 * Поведение шага не менялось: те же пути в репозитории (`orders/<id>/…`), тот
 * же текст issue и уведомления. Изменилось только то, откуда берутся файлы:
 * из $_FILES при прямой публикации и из каталога очереди — при отложенной.
 */

if (!defined('INTAKE_PUBLISH_LOADED')) {
    define('INTAKE_PUBLISH_LOADED', true);

    require_once __DIR__ . '/intake-shared.php';
    // intake_sanitize_filename() — оттуда же, откуда берутся файлы заявки.
    require_once __DIR__ . '/intake-queue.php';

    /**
     * Опубликовать заявку.
     *
     * @param array{source_label:string, name?:string, company?:string, contact?:string, topic?:string, id:string} $order
     * @param array<int, array{name:string, path:string}> $files Вложения на диске.
     * @return array{ok:bool, status:int, error?:string, details?:mixed, issue_url?:string, issue_number?:int|null, attachments?:array, telegram?:bool}
     */
    function intake_publish_order(array $order, array $files): array {
        $githubToken  = (string) intake_config('GITHUB_TOKEN', '');
        $issueRepo    = (string) intake_config('GITHUB_ISSUE_REPO', '');
        $uploadRepo   = (string) intake_config('GITHUB_UPLOAD_REPO', $issueRepo);
        $uploadBranch = (string) intake_config('GITHUB_UPLOAD_BRANCH', 'main');
        $apiBase      = (string) intake_config('GITHUB_API_BASE', 'https://api.github.com');
        $labels       = array_values(array_filter(array_map('trim', explode(',', (string) intake_config('GITHUB_ISSUE_LABELS', '')))));

        if ($githubToken === '' || $issueRepo === '') {
            return ['ok' => false, 'status' => 500, 'error' => 'GitHub integration is not configured.'];
        }

        $requestId   = (string) $order['id'];
        $sourceLabel = (string) $order['source_label'];
        $name        = (string) ($order['name'] ?? '');
        $company     = (string) ($order['company'] ?? '');
        $contact     = (string) ($order['contact'] ?? '');
        $topic       = (string) ($order['topic'] ?? '');

        // ── Вложения → репозиторий ───────────────────────────────────────────
        $uploadDir       = 'orders/' . $requestId;
        $attachmentLinks = [];
        foreach ($files as $index => $file) {
            $safeName = intake_sanitize_filename((string) $file['name']);
            $repoPath = $uploadDir . '/' . sprintf('%02d-%s', $index + 1, $safeName);
            $contents = @file_get_contents((string) $file['path']);
            if ($contents === false) {
                return ['ok' => false, 'status' => 500, 'error' => 'Не удалось прочитать загруженный файл.'];
            }
            $result = intake_github_upload_file(
                $uploadRepo,
                $repoPath,
                $contents,
                "chore(orders): attachment for $requestId",
                $uploadBranch,
                $githubToken,
                $apiBase
            );
            if (!$result['ok']) {
                return [
                    'ok'      => false,
                    'status'  => 502,
                    'error'   => 'Не удалось сохранить вложение в репозитории.',
                    'details' => $result['body']['message'] ?? $result['error'] ?? null,
                ];
            }
            $attachmentLinks[] = [
                'name' => $safeName,
                'url'  => $result['body']['content']['html_url'] ?? ($result['body']['content']['download_url'] ?? ''),
            ];
        }

        // ── Issue ────────────────────────────────────────────────────────────
        $issueTitle = "Заявка: $sourceLabel" . ($company !== '' ? " — $company" : ($name !== '' ? " — $name" : ''));
        $issueBody  = intake_build_issue_body($sourceLabel, $name, $company, $contact, $topic, $attachmentLinks, $requestId, (bool) ($order['confirmed'] ?? false));

        $issueResult = intake_github_create_issue($issueRepo, $issueTitle, $issueBody, $labels, $githubToken, $apiBase);
        if (!$issueResult['ok']) {
            return [
                'ok'      => false,
                'status'  => 502,
                'error'   => 'Не удалось создать issue.',
                'details' => $issueResult['body']['message'] ?? $issueResult['error'] ?? null,
            ];
        }
        $issueUrl    = (string) ($issueResult['body']['html_url'] ?? '');
        $issueNumber = $issueResult['body']['number'] ?? null;

        // ── Telegram (best effort: уже принятую заявку не роняем) ────────────
        $telegramSent = false;
        $botToken = (string) intake_config('TELEGRAM_BOT_TOKEN', '');
        $chatId   = (string) intake_config('TELEGRAM_CHAT_ID', '');
        if ($botToken !== '' && $chatId !== '') {
            $tgBase  = (string) intake_config('TELEGRAM_API_BASE', 'https://api.telegram.org');
            $message = intake_build_telegram_message($sourceLabel, $name, $company, $contact, $topic, $attachmentLinks, $issueUrl, (bool) ($order['confirmed'] ?? false));
            $tg = intake_telegram_send_message($botToken, $chatId, $message, $tgBase);
            $telegramSent = $tg['ok'];
        }

        return [
            'ok'           => true,
            'status'       => 200,
            'issue_url'    => $issueUrl,
            'issue_number' => $issueNumber,
            'attachments'  => $attachmentLinks,
            'telegram'     => $telegramSent,
        ];
    }

    /** Текст issue (Markdown). */
    function intake_build_issue_body(string $heading, string $name, string $company, string $contact, string $topic, array $attachments, string $requestId, bool $confirmed = false): string {
        $lines = ["## Новая заявка «$heading»", ''];
        if ($name !== '')    $lines[] = "- **Имя:** $name";
        if ($company !== '') $lines[] = "- **Компания:** $company";
        if ($contact !== '') $lines[] = "- **Контакт:** $contact";
        $lines[] = "- **ID заявки:** `$requestId`";
        if ($confirmed) {
            $lines[] = '- **Адрес подтверждён** клиентом по ссылке из письма (double opt-in, #624).';
        }
        $lines[] = '';
        if ($topic !== '') {
            $lines[] = '### Тематика';
            $lines[] = $topic;
            $lines[] = '';
        }
        $lines[] = '### Вложения';
        if ($attachments) {
            foreach ($attachments as $a) {
                $lines[] = $a['url'] !== '' ? "- [{$a['name']}]({$a['url']})" : "- {$a['name']}";
            }
        } else {
            $lines[] = '_Файлы не приложены._';
        }
        $lines[] = '';
        $lines[] = '---';
        $lines[] = '_Создано автоматически обработчиком приёма заявок (A2)._';
        return implode("\n", $lines);
    }

    /** Текст уведомления в Telegram (MarkdownV2). */
    function intake_build_telegram_message(string $heading, string $name, string $company, string $contact, string $topic, array $attachments, string $issueUrl, bool $confirmed = false): string {
        $e = 'intake_escape_markdown';
        $lines = ['*Новая заявка «' . $heading . '»*'];
        if ($confirmed) {
            $lines[] = '✅ ' . $e('адрес подтверждён — можно запускать сборку');
        }
        if ($name !== '')    $lines[] = '👤 *Имя:* ' . $e($name);
        if ($company !== '') $lines[] = '🏢 *Компания:* ' . $e($company);
        if ($contact !== '') $lines[] = '📬 *Контакт:* ' . $e($contact);
        if ($topic !== '')   $lines[] = "📝 *Тематика:*\n" . $e($topic);
        $lines[] = '📎 *Файлов:* ' . $e((string) count($attachments));
        if ($issueUrl !== '') {
            $lines[] = '🔗 ' . $e($issueUrl);
        }
        return implode("\n", $lines);
    }
}
