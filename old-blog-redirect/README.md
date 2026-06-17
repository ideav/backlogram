# 301-редиректы старого блога → новый

Артефакт для **старого блога `blog.ideav.online`** (движок **HTMLy v.2.8.6**), который
переадресует все его URL на новый блог **`blog.ideav.ru`** (Astro) и передаёт SEO-вес.

Это закрывающий шаг истории #331 → #332 → **#373**:

- **#331/#332** — новый блог сделали самоканоничным (`<link rel="canonical">` на себя),
  но старый блог продолжал отвечать `200` и дублировать тот же контент.
- **#373** (этот артефакт) — старый блог теперь отдаёт `301` на соответствующие страницы
  нового домена, и поисковики окончательно переносят индекс на `blog.ideav.ru`.

## Что куда ведёт

| Старый URL (`blog.ideav.online`) | Новый URL (`blog.ideav.ru`) |
|---|---|
| `/YYYY/MM/<slug>` (статья) | `/posts/<slug>/` |
| `/post/<slug>` (альт. пермалинк HTMLy) | `/posts/<slug>/` |
| `/category/<slug>` (6 существующих разделов) | `/category/<slug>/` |
| `/tag/<slug>` (теги, что есть на новом блоге) | `/tag/<slug>/` |
| `/tag/yandeks.direkt` (HTMLy сохранил точку) | `/tag/yandeks-direkt/` |
| `/feed`, `/feed/rss`, `/feed/opml` | `/rss.xml` |
| главная, `/archive`, `/author`, `/type`, `/search`, `uncategorized`, неизвестная таксономия, статические страницы | `/` (главная нового блога) |

Карта **выверена по живому `sitemap.xml`** старого блога и контенту `blog-v2`:

- все **46** датированных постов старого блога существуют 1:1 на новом (слаг сохранён) —
  поэтому общее правило `/YYYY/MM/<slug>` → `/posts/<slug>/` не упирается в 404;
- категории/теги маппятся **только там, где страница есть на новом блоге**, остальное
  уходит на главную — ни один `301` не ведёт в `404`.

## Важно: картинки

Новый блог пока **хотлинкает изображения** с `blog.ideav.online/wp-content/uploads/...`
(см. `blog-v2/README.md`). Поэтому первое правило отдаёт реальные файлы как есть и **не
редиректит их** — иначе картинки на новом блоге отвалятся. Не удаляйте блок «Serve real
files as-is», пока картинки не перенесены в `blog-v2/public/uploads/`.

## Деплой

HTMLy по умолчанию работает на **Apache + mod_rewrite**.

1. Скопировать [`.htaccess`](./.htaccess) в **корень веб-сервера** старого блога
   (туда же, где `index.php`). Если там уже есть `.htaccess` HTMLy — добавить блок
   `<IfModule mod_rewrite.c>…</IfModule>` из этого файла **выше** стандартного правила
   HTMLy `RewriteRule ^(.*)$ index.php` (наши правила должны срабатывать первыми).
2. Убедиться, что в Apache включён `mod_rewrite` и для каталога стоит `AllowOverride All`.

> Если старый блог за **nginx** (без `.htaccess`) — те же правила переписываются в
> `location`-блоки с `return 301`; скажите, и я подготовлю nginx-вариант.

## Проверка после деплоя

```bash
# статья → /posts/<slug>/
curl -sI https://blog.ideav.online/2025/09/predposylki-no-code-konstruktora-integram \
  | grep -iE '^(HTTP|location)'
# ожидается: HTTP/.. 301  +  location: https://blog.ideav.ru/posts/predposylki-no-code-konstruktora-integram/

# категория
curl -sI https://blog.ideav.online/category/o-platforme | grep -i location
# тег с переименованным слагом
curl -sI https://blog.ideav.online/tag/yandeks.direkt   | grep -i location   # → /tag/yandeks-direkt/
# главная и прочее → главная нового блога
curl -sI https://blog.ideav.online/                      | grep -i location
# картинка НЕ редиректится (200, не 301)
curl -sI https://blog.ideav.online/wp-content/uploads/  | grep -iE '^HTTP'
```

Регрессионный тест карты (slug-инварианты + покрытие категорий) — в репозитории:

```bash
node --test tests/old-blog-redirect.test.mjs
```
