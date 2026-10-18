# backlogram — сайты продукта Интеграм

Исходники публичных сайтов и лендингов no-code платформы [Интеграм](https://ideav.ru).

| Каталог | Что это |
|---|---|
| `src/`, `scripts/`, `public/` | [ideav.ru](https://ideav.ru): Vite + React SPA с пререндером страниц для поисковиков |
| `site-en/` | [integram-ai.online](https://integram-ai.online): англоязычный сайт |
| `site-excel/` | [excel-to-app.ru](https://excel-to-app.ru): лендинги «приложение из таблицы» |
| `blog-v2/` | блог на Astro |
| `content/` | статьи для внешних площадок |
| `integram.io/` | статические страницы integram.io |
| `tests/` | тесты сборки, SEO-инварианты, типографика (`npm test`) |

## Запуск

```bash
npm install
npm run dev        # ideav.ru локально
npm run build      # полная сборка с пререндером
npm test           # node --test tests/*.test.mjs
```

Англоязычный сайт и excel-to-app собираются отдельно: `npm run build:en`, `npm run build:excel`.

Все учётные данные в тестах и документации — вымышленные или от демо-баз.
