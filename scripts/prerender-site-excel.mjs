#!/usr/bin/env node
/**
 * Пререндер лендинга excel-to-app.ru и его страниц-спутников (issue #626).
 *
 * Зачем. До этого сборка отдавала пустой `<div id="root"></div>`: ни H1, ни
 * текста, ни цен, ни кейсов. Яндекс и Google JS исполняют, но с задержкой и
 * не всегда полностью, а ИИ-боты (GPTBot, ClaudeBot, PerplexityBot) не
 * исполняют вовсе — для них страница была пуста. Весь смысл сайта лежал
 * в JS-бандле.
 *
 * Что делает:
 *   1. Рисует `<Landing />` через `react-dom/server` и кладёт готовую
 *      разметку в `#root` построенного `dist-excel/index.html`. Когда
 *      React загрузится, `createRoot().render()` заменит её живым
 *      приложением — для посетителя ничего не меняется.
 *   2. Собирает статические страницы `/keysy/<slug>/` и
 *      `/sravnenie-power-apps/`: свой `<title>`, описание, canonical,
 *      Open Graph и JSON-LD у каждой. Скрипта приложения на них нет —
 *      иначе React смонтировал бы в `#root` лендинг и стёр содержимое.
 *
 * Разметку рисует `site-excel/src/prerender.tsx` — он же импортирует сами
 * компоненты страницы, поэтому снимок не может разойтись с тем, что видит
 * посетитель. Здесь остаётся обвязка HTML: стили из сборки, счётчик, мета.
 *
 * Запускается после `vite build` (см. `npm run build:excel`) и требует тех же
 * переменных окружения: SITE_URL, SITE_BASE, METRIKA_ID.
 */
import { build } from 'esbuild'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const siteDir = resolve(root, 'site-excel')
const dist = resolve(root, 'dist-excel')

/** `en`, `/en`, `en/` → `/en/`; пусто → `/`. Повторяет normalizeBase из vite.config.ts. */
function normalizeBase(raw) {
  const trimmed = (raw ?? '').trim()
  if (trimmed === '' || trimmed === '/') return '/'
  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}/`
}

const BASE = normalizeBase(process.env.SITE_BASE)
const ORIGIN = (process.env.SITE_URL ?? '').trim().replace(/\/+$/, '')
const CANONICAL = ORIGIN + BASE
const METRIKA_ID = (process.env.METRIKA_ID ?? '').trim().replace(/\D/g, '')

if (ORIGIN === '') {
  console.error('SITE_URL не задан: пререндер не знает, на каком домене будет жить лендинг')
  process.exit(1)
}

// ── Сборка SSR-входа ────────────────────────────────────────────────────────
// React и всё остальное бандлится внутрь: файл кладётся во временный каталог
// и импортируется напрямую, без разрешения голых имён пакетов.
// Формат CJS намеренно: react-dom/server тянет require('stream'), и в ESM-бандле
// esbuild превращает это в «Dynamic require is not supported».
const entryOut = resolve(root, '.vite/excel/prerender-entry.cjs')
mkdirSync(dirname(entryOut), { recursive: true })

await build({
  entryPoints: [resolve(siteDir, 'src/prerender.tsx')],
  outfile: entryOut,
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  jsx: 'automatic',
  define: {
    __METRIKA_ID__: JSON.stringify(METRIKA_ID),
    __SITE_BASE__: JSON.stringify(BASE),
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  logLevel: 'error',
})

const { renderLanding, renderStaticPages } = createRequire(import.meta.url)(entryOut)

// ── Главная: статический снимок в #root ─────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const indexHtml = readFileSync(indexPath, 'utf8')

const ROOT_DIV = '<div id="root"></div>'
if (!indexHtml.includes(ROOT_DIV)) {
  console.error(`${indexPath}: не найден ${ROOT_DIV} — вставлять снимок некуда`)
  process.exit(1)
}

const landing = renderLanding()
writeFileSync(indexPath, indexHtml.replace(ROOT_DIV, `<div id="root">${landing}</div>`), 'utf8')
console.log(`✓ dist-excel/index.html — снимок лендинга, ${landing.length} символов`)

// ── Страницы-спутники ───────────────────────────────────────────────────────
// Стили берём из собранного index.html: имя файла хешировано и известно
// только после сборки. Скрипт приложения на спутники не идёт намеренно.
const styles = [...indexHtml.matchAll(/<link rel="stylesheet"[^>]*>/g)].map(m => m[0])
if (styles.length === 0) {
  console.error('в dist-excel/index.html нет ни одной таблицы стилей — страницы вышли бы голыми')
  process.exit(1)
}

const metrika = indexHtml.match(
  /<script type="text\/javascript">[\s\S]*?mc\.yandex\.ru[\s\S]*?<\/script>\s*<noscript>[\s\S]*?<\/noscript>/,
)
if (METRIKA_ID !== '' && !metrika) {
  console.error('METRIKA_ID задан, но счётчика нет в dist-excel/index.html — спутники остались бы без статистики')
  process.exit(1)
}
const metrikaBlock = metrika ? metrika[0] : '<!-- METRIKA_ID не задан: счётчик не подключён -->'

const escapeAttr = s =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function pageHtml(page) {
  const url = CANONICAL + page.dir + '/'
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="${BASE}favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="description" content="${escapeAttr(page.description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="Excel → приложение · Интеграм" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:title" content="${escapeAttr(page.title)}" />
    <meta property="og:description" content="${escapeAttr(page.description)}" />
    <meta property="og:image" content="${page.ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeAttr(page.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(page.title)}" />
    <meta name="twitter:description" content="${escapeAttr(page.description)}" />
    <meta name="twitter:image" content="${page.ogImage}" />
    <title>${escapeAttr(page.title)}</title>
    ${styles.join('\n    ')}
    ${page.jsonLd}
    ${metrikaBlock}
  </head>
  <body>
    <div id="page">${page.body}</div>
  </body>
</html>
`
}

for (const page of renderStaticPages(CANONICAL)) {
  const dir = resolve(dist, page.dir)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, 'index.html'), pageHtml(page), 'utf8')
  console.log(`✓ dist-excel/${page.dir}/index.html — ${page.path}`)
}

rmSync(entryOut, { force: true })
