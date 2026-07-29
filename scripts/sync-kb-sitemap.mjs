#!/usr/bin/env node
/**
 * Keep `public/sitemap.xml` in sync with the knowledge base (issue #500).
 *
 * Why: `public/sitemap.xml` is a hand-written static file, so every new article
 * in `src/data/knowledgeBase.ts` needed a manual `<url>` block. Забыть этот шаг
 * легко — статья тогда собирается, пререндерится и линкуется, но в карту сайта
 * не попадает, и краулер узнаёт о ней только по внутренним ссылкам.
 *
 * What: rebuilds ONLY the `/knowledge-base/<slug>.html` block of the sitemap
 * from the article array, в порядке статей. Уже существующие записи переносятся
 * ДОСЛОВНО — руками выставленные `lastmod`/`changefreq`/`priority` не теряются;
 * новые получают сегодняшнюю дату, `monthly` и `0.8` (как у остальных статей).
 * Все прочие `<url>` (главная, посадочные, `/knowledge-base.html`) не трогаются
 * вообще: скрипт не «генерирует sitemap», а синхронизирует один его раздел.
 *
 * `public/llms.txt` НЕ генерируется — у каждой статьи там своё рукописное
 * описание и своя тематическая секция. Но потеряться статья не должна, поэтому
 * скрипт проверяет, что каждая упомянута, и в режиме `--check` падает, если нет.
 *
 * Usage:
 *   node scripts/sync-kb-sitemap.mjs          # переписать sitemap при расхождении
 *   node scripts/sync-kb-sitemap.mjs --check  # ничего не писать, exit 1 при расхождении
 *
 * Запускается первым шагом `npm run build` (до `vite build`, который копирует
 * `public/` в `dist/`) и проверяется тестом `tests/kb-sitemap-sync.test.mjs`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { detectEol, splitUrlBlocks } from './lib/sitemap-urls.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const SITE = 'https://ideav.ru'
const sitemapPath = resolve(root, 'public/sitemap.xml')
const llmsPath = resolve(root, 'public/llms.txt')
const checkOnly = process.argv.includes('--check')

// ── Load article data (same esbuild trick as prerender-knowledge-base.mjs) ──
const bundleResult = await build({
  entryPoints: [resolve(root, 'src/data/knowledgeBase.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2020',
  write: false,
  external: [],
  logLevel: 'error',
})
const dataUrl =
  'data:text/javascript;base64,' +
  Buffer.from(bundleResult.outputFiles[0].text).toString('base64')
const { knowledgeBaseArticles } = await import(dataUrl)

const articleLoc = (slug) => `${SITE}/knowledge-base/${slug}.html`
// Индекс базы знаний живёт по /knowledge-base.html и статьёй не является —
// поэтому сравниваем именно с префиксом каталога.
const isArticleLoc = (loc) => loc.startsWith(`${SITE}/knowledge-base/`)

// ── Split the sitemap into <url> blocks, everything else stays verbatim ────
const source = readFileSync(sitemapPath, 'utf8')
// Разбор терпит и LF, и CRLF: на Windows Git кладёт в рабочую копию CRLF, и
// строгая привязка к `\n` роняла всю сборку до `vite build` (issue #508).
const eol = detectEol(source)
const blocks = splitUrlBlocks(source)
if (blocks.length === 0) {
  console.error('sitemap.xml: не найдено ни одного <url> — файл оставлен как есть')
  process.exit(1)
}

const prefix = source.slice(0, blocks[0].start)
const suffix = source.slice(blocks.at(-1).end)
const existingByLoc = new Map(blocks.map((b) => [b.loc, b.text]))

const today = new Date().toISOString().slice(0, 10)
// Новые блоки набираются тем же переводом строки, что и файл, иначе на Windows
// рабочая копия станет смешанной, а `rebuilt !== source` — вечно истинным.
const freshBlock = (loc) =>
  `  <url>${eol}    <loc>${loc}</loc>${eol}    <lastmod>${today}</lastmod>${eol}` +
  `    <changefreq>monthly</changefreq>${eol}    <priority>0.8</priority>${eol}  </url>${eol}`

const articleBlocks = knowledgeBaseArticles.map(
  (a) => existingByLoc.get(articleLoc(a.slug)) ?? freshBlock(articleLoc(a.slug)),
)

// Статьи встают на место первой статейной записи; чужие блоки сохраняют порядок.
const others = blocks.filter((b) => !isArticleLoc(b.loc))
const firstArticleIndex = blocks.findIndex((b) => isArticleLoc(b.loc))
const insertAt =
  firstArticleIndex === -1
    ? others.length
    : blocks.slice(0, firstArticleIndex).filter((b) => !isArticleLoc(b.loc)).length

const rebuilt =
  prefix +
  [
    ...others.slice(0, insertAt).map((b) => b.text),
    ...articleBlocks,
    ...others.slice(insertAt).map((b) => b.text),
  ].join('') +
  suffix

const added = knowledgeBaseArticles
  .filter((a) => !existingByLoc.has(articleLoc(a.slug)))
  .map((a) => a.slug)
const removed = blocks
  .filter(
    (b) =>
      isArticleLoc(b.loc) &&
      !knowledgeBaseArticles.some((a) => articleLoc(a.slug) === b.loc),
  )
  .map((b) => b.loc)

// ── llms.txt: не генерируем, но требуем, чтобы статья не потерялась ────────
const llms = readFileSync(llmsPath, 'utf8')
const missingInLlms = knowledgeBaseArticles
  .filter((a) => !llms.includes(`/knowledge-base/${a.slug}.html`))
  .map((a) => a.slug)

// ── Report / write ─────────────────────────────────────────────────────────
const sitemapDrifted = rebuilt !== source

if (checkOnly) {
  const problems = []
  if (sitemapDrifted) {
    problems.push(
      'public/sitemap.xml разошёлся с src/data/knowledgeBase.ts' +
        (added.length ? `\n  не хватает: ${added.join(', ')}` : '') +
        (removed.length ? `\n  лишние: ${removed.join(', ')}` : '') +
        (!added.length && !removed.length ? '\n  порядок или форматирование блоков' : '') +
        '\n  почините запуском: node scripts/sync-kb-sitemap.mjs',
    )
  }
  if (missingInLlms.length) {
    problems.push(
      `public/llms.txt не упоминает статьи: ${missingInLlms.join(', ')}` +
        '\n  добавьте строку с описанием в подходящую секцию вручную',
    )
  }
  if (problems.length) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
  console.log(
    `KB sitemap: ${knowledgeBaseArticles.length} статей на месте, llms.txt полон`,
  )
} else {
  if (sitemapDrifted) writeFileSync(sitemapPath, rebuilt)
  console.log(
    `KB sitemap: ${knowledgeBaseArticles.length} статей` +
      (sitemapDrifted
        ? ` — обновлено${added.length ? `, добавлено: ${added.join(', ')}` : ''}` +
          `${removed.length ? `, удалено: ${removed.join(', ')}` : ''}`
        : ' — без изменений'),
  )
  if (missingInLlms.length) {
    console.warn(
      `⚠ public/llms.txt не упоминает: ${missingInLlms.join(', ')} — допишите вручную`,
    )
  }
}
