# site-en — English site (integram-ai.online)

Отдельная сборка английского сайта. С русским сайтом (`ideav.ru`, корень репозитория) не связана: свой вход, свои компоненты, свой `dist-en/`, взаимных ссылок между сайтами нет — по условию [issue #524](https://github.com/ideav/backlogram/issues/524). Это не локализация, общего i18n-слоя нет, контент расходится.

Бренд в английской версии — **Integram**.

## Что это сейчас

Многостраничный маркетинговый сайт (issues #527–#534). Маршруты: `/`, `/pricing`, `/excel-to-app`, `/ai`, `/compare/{airtable,smartsheet,notion}`, `/use-cases` + `/use-cases/<slug>`, `/knowledge-base` + `/knowledge-base/<slug>`, `/contact`, `/terms`, `/privacy`, `/cookies`. Вход/регистрация — `/start`, `/start#signup` (движок, не этот билд).

- Роутер крошечный (`src/match.ts`): каждая страница — отдельный файл `dist-en/<route>/index.html`, переходы — обычные ссылки, клиент только гидрирует нужную страницу (чанк на страницу).
- Пререндер — плагин в `vite.config.ts`: после клиентской сборки собирает `src/entry-server.tsx` под Node, рендерит все маршруты из `src/routes.ts` со своими title/description/canonical/og/twitter/JSON-LD и пишет `robots.txt`, `sitemap.xml`, `llms.txt`, а также заглушки `offer_en.html`/`pp_en.html` (meta refresh; нужен 301 в `.htaccess`).
- Контент: `src/content/kb/index.ts`, `src/content/usecases/index.ts` (контракт — `src/content/types.ts`). Новая статья/кейс сами попадают в страницы и sitemap.
- Позиционирование, цены, глоссарий и стоп-лист — `docs/en-positioning.md`.
- Аналитика — Plausible, грузится только после согласия в cookie-баннере; цель `lead` (отправка формы, клик на `/start#signup`); UTM уходят в заявку. Переменные: `VITE_PLAUSIBLE_DOMAIN` (`off` — выключить), `VITE_PLAUSIBLE_SRC`, `VITE_CONTACT_EMAIL`.

## Команды

```bash
npm run dev:en     # локально, http://localhost:5174
npm run build:en   # сборка в dist-en/ под корень сайта
```

## Куда выкладывать: корень или подпапка

Сборка не привязана к корню. Две переменные окружения задают, где сайт будет жить:

| Переменная | Что это | По умолчанию |
| --- | --- | --- |
| `SITE_BASE` | путь на хосте: `/en/`, `/cn/`, `/pt/` | `/` |
| `SITE_URL` | схема и хост, без пути | `https://integram-ai.online` |

```bash
npm run build:en                                     # https://integram-ai.online/
SITE_BASE=/en/ npm run build:en                      # https://integram-ai.online/en/
SITE_BASE=/pt/ SITE_URL=https://example.com npm run build:en
```

`SITE_BASE` можно писать как угодно — `en`, `/en`, `en/` приводятся к `/en/`.

От этих двух значений считается всё абсолютное: пути к ассетам и фавиконке, `canonical` и `og:url`, адрес эндпоинта формы, `robots.txt` и `sitemap.xml` (последние два генерируются в билде, в `public/` их нет). Содержимое `dist-en/` кладётся целиком в нужную папку — например, в `/en/`.

От хостинга нужно:

- статика + SPA-fallback внутри своей папки (несуществующий путь → `index.html` этой же папки);
- `https`, `www → bare` одним 301;
- PHP для `order.php` — он лежит рядом со страницей, то есть в подпапке это `/en/order.php`, форма обращается туда сама.

**Про `robots.txt` при выкладке в подпапку:** поисковики читают его только из корня хоста. Сгенерированный файл всё равно кладётся рядом (пригодится, если сайт переедет в корень), но строку `Sitemap: https://<host>/en/sitemap.xml` нужно продублировать в корневом `robots.txt` хоста.

**`public/.htaccess` из корня репозитория сюда не едет.** Он несёт фронт-контроллер `RewriteRule ^ index.php` для движка на ideav.ru; здесь движка нет, и этот файл сломал бы отдачу статики (issue #422). У `site-en/` свой `public/`, так что случайно он не попадёт.

## Форма

`site-en/public/order.php` — самостоятельный эндпоинт, не использует код русских форм (там завязка на региональную капчу и конфиг чужого хоста). Защита от спама: проверка Referer, honeypot-поле, лимит 3 заявки с IP за 10 минут. Внешняя капча не подключается — страница вообще не ходит в сторонние домены.

Настройка — переменными окружения или файлом `order-config.php` рядом (в git не хранится, переменные окружения важнее):

| Переменная | Назначение |
| --- | --- |
| `ORDER_EMAIL_TO` | куда слать заявку (обязательна) |
| `ORDER_EMAIL_FROM` | отправитель, по умолчанию `noreply@<host>` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | необязательное дублирование в Telegram |

Если ни один канал не настроен, эндпоинт честно отвечает ошибкой, а не молчаливым «успехом».

## Проверки

`tests/en-landing.test.mjs` следит, чтобы в `site-en/` не появились кириллица, ссылки на `.ru`-хосты и яндексовые сервисы, чтобы страница объявляла `lang="en"` со своим canonical и чтобы в `public/` не завёлся `.htaccess`.
