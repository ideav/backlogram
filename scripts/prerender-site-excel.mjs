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
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { assertLandings, countWords, CTA_LABEL, loadLandings } from '../site-excel/landings.mjs'

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

const { PAGES, renderLanding, renderLandingPages, renderStaticPages } = createRequire(import.meta.url)(entryOut)

// ── Посадочные (issue #657): проверка данных до отрисовки ───────────────────
// Длины и уникальность title/description/H1, строки блока формул, заглушки,
// запрещённые формулировки, повторы уникальных блоков, ссылки в никуда.
// Нарушение — сборка падает, страница с браком на хостинг не уезжает.
let landings
try {
  landings = assertLandings(loadLandings(), PAGES)
} catch (err) {
  console.error(err.message)
  process.exit(1)
}

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
  </head>
  <body>
    <div id="page">${page.body}</div>${page.landing ? `\n    ${landingScript(page.landing)}` : ''}${page.praktikum ? `\n    ${praktikumScript()}` : ''}${page.program ? `\n    ${programScript(page.program)}` : ''}
    ${metrikaBlock}
  </body>
</html>
`
}

/**
 * Встроенный скрипт посадочной (issue #657). Внешних скриптов, кроме Метрики,
 * на страницах нет (раздел 11.4 ТЗ), поэтому две вещи делаются здесь:
 *   • UTM-метки и yclid из адреса посадочной дописываются к кнопкам CTA —
 *     форма главной получает и метки, и `from=<slug>`;
 *   • клик по CTA — цель Метрики `landing_cta` с адресом страницы.
 */
function landingScript(slug) {
  const goal = METRIKA_ID
    ? `try{ym(${METRIKA_ID},'reachGoal','landing_cta',{page:${JSON.stringify(slug)}})}catch(e){}`
    : ''
  return `<script>(function(){var q=new URLSearchParams(location.search),k=[];q.forEach(function(v,n){if(/^utm_|^yclid$/.test(n))k.push([n,v])});document.querySelectorAll('a[data-cta]').forEach(function(a){var u=new URL(a.getAttribute('href'),location.href);k.forEach(function(x){u.searchParams.set(x[0],x[1])});a.href=u.pathname+u.search+u.hash;a.addEventListener('click',function(){${goal}})})})()</script>`
}

/**
 * Двухэтапная целевая кнопка практикума (issue #668) — та же защита от
 * скликивания, что у `signup_click` на главной (site-excel/src/conversion.ts):
 *   • кнопки [data-pk-open] видны только с JS и лишь раскрывают блок;
 *   • целевая ссылка [data-pk-go] лежит в <template> и появляется в разметке
 *     только после первого клика;
 *   • клик по ней шлёт `praktikum_click`, если в сессии был настоящий
 *     (isTrusted) жест, страница прожила 2,5 с и это не webdriver, иначе —
 *     `praktikum_blocked`. Директ платит только за первую.
 * UTM и yclid из адреса страницы дописываются к ссылке, как у посадочных.
 */
function praktikumScript() {
  const goal = METRIKA_ID
    ? `try{ym(${METRIKA_ID},'reachGoal',ok?'praktikum_click':'praktikum_blocked',{dwell_ms:Date.now()-t})}catch(e){}`
    : ''
  return `<script>(function(){var t=Date.now(),h=false;['pointerdown','pointermove','touchstart','keydown','wheel','scroll'].forEach(function(n){addEventListener(n,function(e){if(e.isTrusted)h=true},{passive:true})});var q=new URLSearchParams(location.search),k=[];q.forEach(function(v,n){if(/^utm_|^yclid$/.test(n))k.push([n,v])});var slot=document.getElementById('pk-step2'),tpl=document.getElementById('pk-step2-tpl'),btns=document.querySelectorAll('[data-pk-open]');function open(){if(!slot.firstChild){slot.appendChild(tpl.content.cloneNode(true));var a=slot.querySelector('a[data-pk-go]'),u=new URL(a.getAttribute('href'),location.href);k.forEach(function(x){u.searchParams.set(x[0],x[1])});a.href=u.pathname+u.search+u.hash;a.addEventListener('click',function(){var ok=h&&!navigator.webdriver&&Date.now()-t>=2500;${goal}})}btns.forEach(function(b){b.hidden=true});slot.scrollIntoView({behavior:'smooth',block:'center'})}btns.forEach(function(b){b.hidden=false;b.addEventListener('click',open)})})()</script>`
}

/**
 * Цель страниц рекрутинга (issue #674), двухэтапная, как у практикума:
 *   • кнопка [data-program-open] видна только с JS и лишь раскрывает блок;
 *   • ссылки заявки [data-program-go] (телеграм, почта) лежат в <template>
 *     и появляются в разметке только после первого клика;
 *   • клик по ним шлёт `<slug>_click`, если в сессии был настоящий (isTrusted)
 *     жест, страница прожила 2,5 с и это не webdriver, иначе — `<slug>_blocked`,
 *     за которую Директ не платит.
 * Ссылки ведут наружу (t.me, mailto), поэтому UTM к ним не дописываются — их
 * видно в визите. Без счётчика скрипт всё равно нужен: он раскрывает блок.
 */
function programScript(slug) {
  const goal = METRIKA_ID
    ? `try{ym(${METRIKA_ID},'reachGoal',${JSON.stringify(slug)}+(ok?'_click':'_blocked'),{via:a.getAttribute('data-program-go'),dwell_ms:Date.now()-t})}catch(e){}`
    : ''
  return `<script>(function(){var t=Date.now(),h=false;['pointerdown','pointermove','touchstart','keydown','wheel','scroll'].forEach(function(n){addEventListener(n,function(e){if(e.isTrusted)h=true},{passive:true})});var slot=document.getElementById('program-step2'),tpl=document.getElementById('program-step2-tpl'),btns=document.querySelectorAll('[data-program-open]');function open(){if(!slot.firstChild){slot.appendChild(tpl.content.cloneNode(true));slot.querySelectorAll('a[data-program-go]').forEach(function(a){a.addEventListener('click',function(){var ok=h&&!navigator.webdriver&&Date.now()-t>=2500;${goal}})})}btns.forEach(function(b){b.hidden=true});slot.scrollIntoView({behavior:'smooth',block:'center'})}btns.forEach(function(b){b.hidden=false;b.addEventListener('click',open)})})()</script>`
}

const written = [indexPath]
const pages = [...renderStaticPages(CANONICAL), ...renderLandingPages(CANONICAL, landings)]
for (const page of pages) {
  const dir = resolve(dist, page.dir)
  mkdirSync(dir, { recursive: true })
  const file = resolve(dir, 'index.html')
  const html = pageHtml(page)
  writeFileSync(file, html, 'utf8')
  written.push(file)
  const words = page.landing ? `, ${countWords(page.body)} слов` : ''
  console.log(`✓ dist-excel/${page.dir}/index.html — ${page.path}${words}`)
  if (page.landing && !(page.body.includes('data-cta') && page.body.includes(CTA_LABEL))) {
    console.error(`dist-excel/${page.dir}/index.html: нет текста CTA «${CTA_LABEL}»`)
    process.exit(1)
  }
}

// ── Битые внутренние ссылки (раздел 11.2 ТЗ) ────────────────────────────────
// Каждый href, начинающийся с пути сайта, должен вести на файл в dist-excel.
// Якорь и параметры отбрасываются: проверяется сам адрес страницы.
const broken = []
for (const file of written) {
  const html = readFileSync(file, 'utf8')
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (!href.startsWith(BASE) || href.startsWith('//')) continue
    const path = href.slice(BASE.length).replace(/[?#].*$/, '')
    const target = path === '' || path.endsWith('/') ? resolve(dist, path, 'index.html') : resolve(dist, path)
    if (!existsSync(target)) broken.push(`${file.slice(dist.length + 1)} → ${href}`)
  }
}
if (broken.length > 0) {
  console.error(`Битые внутренние ссылки (${broken.length}):\n  - ${broken.join('\n  - ')}`)
  process.exit(1)
}
console.log(`✓ внутренние ссылки: ${written.length} страниц, битых нет`)

rmSync(entryOut, { force: true })
