# blog-v2 — скелет блога на `blog.ideav.ru`

Минимальный, рабочий скелет нового блога Интеграм на **Astro 5 + Tailwind 4**. Цель — заменить WordPress на `blog.ideav.online`. Старый блог при этом остаётся как архив со ссылкой в `canonical`.

## Что уже есть

- Главная со списком статей: hero-карточка + сетка.
- Страница отдельной статьи (`/posts/<slug>/`) с author-блоком и breadcrumb.
- RSS-лента `/rss.xml`.
- `sitemap-index.xml` (генерируется автоматически через `@astrojs/sitemap`).
- SEO из коробки: canonical, OpenGraph, Twitter Card, JSON-LD-готовые метаданные, `robots.txt`.
- Тёмная тема через `prefers-color-scheme`.
- Три демо-статьи в `src/content/posts/` (одна новая + две из старого блога с canonical обратно).
- Schema content collections с типизацией — Astro проверит frontmatter каждой статьи на этапе билда.

## Чего пока нет (намеренно)

- Постраничной разбивки списка (хватает на десятки статей, нужно при сотнях).
- Страниц категорий и тегов.
- Поиска по статьям (можно подключить Pagefind одной командой).
- Импорта 18 статей со старого WordPress — это отдельная задача (см. ниже).
- CI/CD — нет workflow для автодеплоя; всё локально.
- Картинок для соцсетей — заглушка `og-default.png` ещё не нарисована.

## Запуск локально

```bash
cd blog-v2
npm install
npm run dev   # http://localhost:4321
```

## Сборка для прода

```bash
cd blog-v2
npm install
npm run build   # результат в blog-v2/dist/
```

Контент `blog-v2/dist/` — статика. Кладётся на любой статический хостинг: Cloudflare Pages, Netlify, Vercel, Yandex Object Storage, обычный nginx — что удобнее.

## Как добавить статью

Создать файл `src/content/posts/<slug>.md`:

```markdown
---
title: "Заголовок статьи"
description: "Один абзац для превью и meta description (150–160 символов)."
pubDate: 2026-05-20
category: "Технологии"
author: "Имя автора"
image: "https://example.com/cover.jpg"   # опционально
draft: false                              # true — не попадёт в билд
canonical: "https://..."                  # опционально, для перекрёстных публикаций
---

## Заголовок раздела

Текст статьи в обычном Markdown.
```

`<slug>` — это URL: статья `src/content/posts/moya-statya.md` будет доступна по `/posts/moya-statya/`.

## Импорт статей со старого блога

Не делается этим PR — оставлено на отдельную задачу. План:

1. В `wp-admin → Инструменты → Экспорт` скачать WordPress XML со всеми статьями.
2. Прогнать через [`wordpress-export-to-markdown`](https://github.com/lonekorean/wordpress-export-to-markdown):
   ```bash
   npx wordpress-export-to-markdown
   ```
   Получится дерево `.md`-файлов и папка с картинками.
3. Положить `.md` в `src/content/posts/`, поправить frontmatter под нашу схему (см. выше).
4. Картинки положить в `public/uploads/` и переписать пути в Markdown.
5. На старом WP настроить 301-редиректы на новые адреса — иначе потеряем индексацию.

## Деплой на `blog.ideav.ru`

DNS уже не указывает на старый блог (тот живёт на `blog.ideav.online` отдельно), поэтому переезд несложный:

1. Залить `dist/` на выбранный хостинг.
2. В DNS добавить запись `blog.ideav.ru → CNAME → <хостинг>`.
3. Прописать SSL (Let's Encrypt автоматический на большинстве хостингов).
4. Проверить:
   - `https://blog.ideav.ru/` — главная грузится;
   - `https://blog.ideav.ru/rss.xml` — RSS работает;
   - `https://blog.ideav.ru/sitemap-index.xml` — sitemap есть;
   - `https://blog.ideav.ru/robots.txt` — корректный;
   - в `<head>` страницы статьи есть `<link rel="canonical">`, OG-теги, JSON-LD.

## Что отличается от старого `blog/` (PR #73)

Папка `blog/` в корне репо — это **React-SPA**, который читает RSS со старого WordPress и показывает превью-карточки со ссылкой обратно на WP. Это другая архитектура и другая задача: витрина поверх существующего WP.

`blog-v2/` — это **самостоятельный блог**, который хранит свой контент в репо и не зависит от WordPress в проде. После переезда `blog/` либо удалится, либо превратится в админку.

## Стек

- [Astro 5](https://astro.build) — статический генератор сайтов;
- [Tailwind CSS 4](https://tailwindcss.com) — стили;
- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — sitemap;
- [@astrojs/rss](https://docs.astro.build/en/recipes/rss/) — RSS-лента;
- Content collections — типизированный контент с проверкой frontmatter.
