<?php
/**
 * СГЕНЕРИРОВАННАЯ КОПИЯ public/intake-confirm-page.php — править здесь нельзя.
 *
 * Лендинг excel-to-app.ru живёт в отдельном вебруте, файлов основного сайта
 * в нём нет, а контур подтверждения адреса нужен тот же самый (issue #624).
 * Обновить: `node scripts/sync-excel-intake.mjs`. Расхождение с источником
 * ловит tests/excel-landing-confirm.test.mjs.
 */
/**
 * Страница, которую видит клиент, перейдя по ссылке подтверждения (issue #624).
 *
 * Отдельным файлом, потому что форма живёт на двух доменах: ideav.ru
 * (excel-to-app-confirm.php) и excel-to-app.ru (order-confirm.php). Страница
 * там должна выглядеть одинаково — это одно и то же обещание одному и тому же
 * человеку, и расходиться двум версиям незачем.
 *
 * Отвечаем HTML, а не JSON: по ссылке приходит человек из почтового клиента.
 *
 * Конфиг:
 *   INTAKE_CONFIRM_FORM_URL  куда вести «оставить заявку заново»
 *   INTAKE_SITE_URL          домен в подписи страницы
 */

if (!defined('INTAKE_CONFIRM_PAGE_LOADED')) {
    define('INTAKE_CONFIRM_PAGE_LOADED', true);

    // Как и в intake-mail.php: нужен только intake_config().
    if (!function_exists('intake_config')) {
        require_once __DIR__ . '/intake-shared.php';
    }

    /** Адрес формы для «оставить заявку заново». */
    function intake_confirm_form_url(): string {
        return (string) intake_config('INTAKE_CONFIRM_FORM_URL', 'https://ideav.ru/excel-to-app.html');
    }

    /** Отдать страницу и закончить запрос. */
    function intake_confirm_page(int $status, string $heading, string $lead, string $extra = ''): void {
        http_response_code($status);
        header('Content-Type: text/html; charset=UTF-8');
        // Ссылка одноразовая и персональная — в индексе ей не место.
        header('X-Robots-Tag: noindex, nofollow');

        $siteUrl  = (string) intake_config('INTAKE_SITE_URL', 'https://ideav.ru');
        $siteHost = (string) (parse_url($siteUrl, PHP_URL_HOST) ?: $siteUrl);
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
<p class="muted">Интеграм · <a href="' . $h($siteUrl) . '">' . $h($siteHost) . '</a> · Telegram: <a href="https://t.me/qdmadept">@qdmadept</a></p>
</div>
</body>
</html>';
        exit;
    }

    /**
     * Страницы неуспешных исходов — их текст одинаков на обоих доменах.
     * Вызывает intake_confirm_page() и завершает запрос; если исход не из
     * списка (то есть заявка подтверждена), возвращает управление вызвавшему.
     */
    function intake_confirm_page_for(string $result, int $ttlSeconds): void {
        $formUrl = htmlspecialchars(intake_confirm_form_url(), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        switch ($result) {
            case 'missing_token':
                intake_confirm_page(400, 'Ссылка неполная',
                    'В адресе нет кода подтверждения. Откройте ссылку из письма целиком — почтовые клиенты иногда обрезают длинные адреса.',
                    '<p><a href="' . $formUrl . '">Оставить заявку заново</a></p>');
                // no break: intake_confirm_page() завершает запрос

            case 'expired':
                intake_confirm_page(410, 'Ссылка устарела',
                    'Подтвердить заявку можно было в течение ' . max(1, (int) round($ttlSeconds / 3600))
                    . ' ч после отправки. Файлы мы удалили — как и обещали в письме.',
                    '<p><a href="' . $formUrl . '">Отправить заявку заново</a> — это займёт минуту.</p>');
                // no break

            case 'already':
                intake_confirm_page(200, 'Заявка уже подтверждена',
                    'Спасибо, подтверждение мы получили раньше — повторно ничего делать не нужно. Приложение уже в работе: ссылка и доступ придут на тот же адрес.',
                    '<p class="muted">Если с момента подтверждения прошло больше двух часов, напишите нам в Telegram — проверим, что происходит.</p>');
                // no break

            case 'not_found':
                intake_confirm_page(404, 'Ссылка не найдена',
                    'Такой заявки у нас нет: ссылка могла быть скопирована не полностью или заявка уже удалена по истечении срока.',
                    '<p><a href="' . $formUrl . '">Оставить заявку заново</a></p>');
                // no break
        }
    }
}
