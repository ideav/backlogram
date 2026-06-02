# Issue 304 (A2): Бэкенд приёма заявок — файл → issue → Telegram

Серверный обработчик формы лендинга A1 ([#303](https://github.com/ideav/backlogram/issues/303)).
Реализует критерии готовности из
[`docs/issue-301-excel-to-app-strategy.md`](issue-301-excel-to-app-strategy.md):
приём формы с вложениями, создание issue через GitHub API по токену,
вложение файлов, уведомление в Telegram, защита от спама и безопасное хранение
токена (env, не в репозитории).

## Файлы

| Файл | Назначение |
| --- | --- |
| `public/excel-to-app.php` | Эндпоинт приёма заявки (форма A1 шлёт сюда `multipart/form-data`). |
| `public/intake-shared.php` | Переиспользуемые помощники (config, captcha, GitHub API, Telegram, rate-limit). Тестируемые чистые функции. |
| `public/telegram-config.example.php` | Пример конфигурации. Копируется в `telegram-config.php` (git-ignored). |

## Поток обработки

1. **Только POST** + **same-origin** проверка (`Referer` совпадает с хостом).
2. **Защита от спама:**
   - Yandex **SmartCaptcha** (пропускается для вернувшихся пользователей с cookie `idb_*`,
     как в текущей CTA-форме);
   - **rate-limit** по IP (по умолчанию 5 заявок в час, файловое хранилище состояния,
     fail-open — никогда не «роняет» форму само по себе).
3. **Валидация:** обязателен контакт; вложения проверяются по расширению
   (`xlsx, xls, csv, ods`), размеру (≤10 МиБ) и количеству (≤10).
4. **Вложения → GitHub.** Каждый файл коммитится через Contents API в каталог
   `orders/<request-id>/NN-<имя>` репозитория `GITHUB_UPLOAD_REPO`.
5. **Issue → GitHub.** Создаётся issue в `GITHUB_ISSUE_REPO` с полями заявки и
   ссылками на вложения.
6. **Telegram.** Владельцу отправляется уведомление со ссылкой на issue
   (best-effort: сбой Telegram не отменяет уже принятую заявку).

Ответ — JSON: `{ ok, message, issue_url, issue_number, attachments, telegram }`.

## Контракт формы (поля)

| Поле | Обязательное | Описание |
| --- | --- | --- |
| `contact` | да | Email или Telegram для ответа. |
| `name` | нет | Имя. |
| `company` | нет | Компания. |
| `topic` (алиасы: `task`, `theme`) | нет | Тематика будущего приложения. |
| `captcha_token` | если включена captcha | Токен SmartCaptcha. |
| `files[]` (алиасы: `file`, `attachments`) | нет | Excel-вложения. |

## Конфигурация (env-first)

Значения читаются сначала из переменных окружения, затем из `telegram-config.php`.
**Секреты держим в окружении, не в репозитории.**

| Имя | По умолчанию | Назначение |
| --- | --- | --- |
| `GITHUB_TOKEN` | — | Токен с правами Contents + Issues (read/write). **Обязательно.** |
| `GITHUB_ISSUE_REPO` | — | `owner/repo` для issue. **Обязательно.** |
| `GITHUB_UPLOAD_REPO` | = `GITHUB_ISSUE_REPO` | Репозиторий для вложений. Для данных клиентов используйте **приватный** репозиторий. |
| `GITHUB_UPLOAD_BRANCH` | `main` | Ветка для коммита вложений. |
| `GITHUB_ISSUE_LABELS` | — | Метки issue через запятую. |
| `GITHUB_API_BASE` | `https://api.github.com` | База API (переопределяется в тестах). |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | — | Уведомление владельцу. |
| `TELEGRAM_API_BASE` | `https://api.telegram.org` | База API Telegram. |
| `SMARTCAPTCHA_SERVER_KEY` | — | Секретный ключ captcha (пусто/заглушка ⇒ captcha выключена). |
| `INTAKE_RATE_LIMIT_MAX` | `5` | Лимит заявок на IP за окно (0 ⇒ выключено). |
| `INTAKE_RATE_LIMIT_WINDOW` | `3600` | Длина окна, сек. |
| `INTAKE_RATE_LIMIT_DIR` | системный temp | Каталог для состояния rate-limit. |
| `INTAKE_UPLOAD_MAX_BYTES` | `10485760` | Лимит размера файла. |
| `INTAKE_UPLOAD_MAX_FILES` | `10` | Лимит числа файлов. |
| `INTAKE_ALLOWED_EXT` | `xlsx,xls,csv,ods` | Разрешённые расширения. |
| `INTAKE_SKIP_HOST_CHECK` | `0` | Отключить same-origin проверку (только для локальной отладки/тестов). |

## Тесты

`tests/excel-to-app-backend.test.mjs`:

- `php -l` для обоих PHP-файлов;
- юнит-тесты чистых помощников (`intake_is_same_host`, `intake_verify_captcha`,
  `intake_is_allowed_upload`, `intake_sanitize_filename`, `intake_rate_limit`,
  `intake_escape_markdown`, `intake_has_idb_cookie`) через `php -r`;
- сквозной тест: поднимается мок GitHub + Telegram API (`php -S`), эндпоинт
  получает реальную multipart-заявку с `.xlsx`, проверяется загрузка файла,
  создание issue и уведомление Telegram.

Запуск: `npm test`.
