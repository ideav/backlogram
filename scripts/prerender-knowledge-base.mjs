#!/usr/bin/env node
/**
 * Post-build prerender for /knowledge-base.html.
 *
 * Reads the SPA template `dist/index.html` and writes a copy at
 * `dist/knowledge-base.html` whose `<div id="root">` is populated with
 * a fully-rendered HTML listing of all KB articles, grouped by theme,
 * with introductory copy and a "last updated" stamp.
 *
 * When a real visitor opens the URL:
 *   - The HTTP response carries this static HTML, so search engines,
 *     LLM crawlers, and no-JS clients see the full list.
 *   - When React boots, `createRoot().render(<App/>)` replaces the
 *     contents of #root with the SPA — the static fallback disappears.
 *
 * Articles are loaded from src/data/knowledgeBase.ts via esbuild so we
 * don't have to maintain a parallel JSON.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// --- Load article data via a temporary ESM bundle -------------------------
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

// --- Group definitions ----------------------------------------------------
// Manual but explicit: it's clearer than trying to infer from tags.
const groups = [
  {
    title: 'Замена Excel и Google Sheets',
    blurb:
      'Когда таблица упирается в лимиты строк, теряется в десятках копий или ломается при одновременной работе нескольких сотрудников.',
    slugs: ['01-google-sheets-150k', '02-excel-row-limit', '03-excel-file-versions', '17-smart-google-import'],
  },
  {
    title: 'Реляционные данные: Airtable и Notion',
    blurb:
      'Когда между сущностями появляются связи, фильтры на уровне строк и нужна предсказуемая работа на сотнях тысяч записей.',
    slugs: ['04-related-tables', '06-airtable-control', '07-notion-relational-data'],
  },
  {
    title: 'Права доступа и контроль данных',
    blurb:
      'Когда у разных ролей разный объём видимых данных, а файлы должны оставаться внутри контура компании.',
    slugs: ['05-access-rights', '15-local-control-files'],
  },
  {
    title: 'Альтернатива заказной разработке и вайб-кодингу',
    blurb:
      'Когда ИИ-инструменты или подрядчики обещают «приложение за вечер», а через месяц оказывается, что данные, права и история не закрыты.',
    slugs: [
      '08-html-templates',
      '08a-vibe-coding-templates',
      '09-custom-development-prototype',
      '11-ai-interface-data-safety',
      '12-ai-prototype-rewrite',
    ],
  },
  {
    title: 'Релизы, отчёты, формы и интеграции',
    blurb:
      'Когда изменение поля не должно превращаться в релиз, а отчёт для бухгалтерии не должен переписываться вручную.',
    slugs: [
      '10-no-release-changes',
      '13-api-json-export',
      '14-forms',
      '14a-reports',
      '14b-dashboards',
    ],
  },
  {
    title: 'Бизнес-практика no-code',
    blurb: 'О ценах, кейсах и о том, как считать стоимость владения.',
    slugs: ['16-pricing-policy'],
  },
]

// --- Build HTML ------------------------------------------------------------
const articlesBySlug = new Map(knowledgeBaseArticles.map((a) => [a.slug, a]))
const groupedSlugs = new Set(groups.flatMap((g) => g.slugs))
const orphan = knowledgeBaseArticles.filter((a) => !groupedSlugs.has(a.slug))
if (orphan.length > 0) {
  // Catch-all so nothing is silently dropped.
  groups.push({
    title: 'Остальные материалы',
    blurb: '',
    slugs: orphan.map((a) => a.slug),
  })
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

const today = new Date().toLocaleDateString('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).replace(' г.', '')

const totalCount = knowledgeBaseArticles.length

const groupsHtml = groups
  .filter((g) => g.slugs.length > 0)
  .map((g) => {
    const items = g.slugs
      .map((slug) => articlesBySlug.get(slug))
      .filter(Boolean)
      .map(
        (a) => `
          <li class="kb-prerender__item">
            <a href="/knowledge-base/${escape(a.slug)}">
              <h3>${escape(a.shortTitle || a.title)}</h3>
              <p>${escape(a.compare || a.summary?.slice(0, 220) || '')}</p>
            </a>
          </li>`
      )
      .join('')
    return `
      <section class="kb-prerender__group">
        <h2>${escape(g.title)} <span class="kb-prerender__count">(${g.slugs.length})</span></h2>
        ${g.blurb ? `<p class="kb-prerender__blurb">${escape(g.blurb)}</p>` : ''}
        <ul class="kb-prerender__list">${items}</ul>
      </section>`
  })
  .join('')

const prerenderHtml = `
<article id="kb-prerender" itemscope itemtype="https://schema.org/CollectionPage">
  <header>
    <p class="kb-prerender__eyebrow">База знаний · ${totalCount} разборов</p>
    <h1 itemprop="name">Интеграм в сравнении с другими инструментами учёта</h1>
    <p class="kb-prerender__lead" itemprop="description">
      Excel тормозит на сотнях тысяч строк? Airtable дорог при росте команды?
      Notion не справляется с реляционными данными? В этих ${totalCount} разборах
      команда Интеграма рассказывает, в каких сценариях наш конструктор заменяет
      или дополняет привычные инструменты — и где у него есть ограничения.
    </p>
    <p class="kb-prerender__updated">Обновлено ${today}</p>
  </header>
  ${groupsHtml}
  <footer class="kb-prerender__footer">
    <p>
      Все ${totalCount} статей в одном списке, в&nbsp;хронологическом порядке выхода —
      доступны через интерактивный фильтр и&nbsp;поиск выше. Перейти к&nbsp;каталогу:
      <a href="/knowledge-base">/knowledge-base</a>.
    </p>
  </footer>
</article>
<style>
  #kb-prerender {
    max-width: 64rem;
    margin: 0 auto;
    padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif;
    color: #1e293b;
  }
  #kb-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #kb-prerender h2 { font-size: 1.35rem; margin: 2.5rem 0 0.5rem; }
  #kb-prerender h3 { font-size: 1.05rem; margin: 0 0 0.4rem; font-weight: 600; }
  #kb-prerender p  { line-height: 1.55; margin: 0.5rem 0; }
  #kb-prerender .kb-prerender__eyebrow {
    text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.72rem;
    color: #3b82f6; font-weight: 700; margin: 0;
  }
  #kb-prerender .kb-prerender__lead { font-size: 1.1rem; color: #475569; max-width: 48rem; }
  #kb-prerender .kb-prerender__updated { font-size: 0.78rem; color: #64748b; margin-top: 1rem; }
  #kb-prerender .kb-prerender__count { font-weight: 400; color: #64748b; font-size: 0.85em; }
  #kb-prerender .kb-prerender__blurb { color: #475569; max-width: 48rem; margin-bottom: 1rem; }
  #kb-prerender .kb-prerender__list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
  #kb-prerender .kb-prerender__item a {
    display: block; padding: 0.9rem 1rem;
    border: 1px solid #e2e8f0; border-radius: 0.5rem;
    color: inherit; text-decoration: none;
  }
  #kb-prerender .kb-prerender__item a:hover { border-color: #3b82f6; }
  #kb-prerender .kb-prerender__item p { font-size: 0.92rem; color: #475569; margin: 0; }
  #kb-prerender .kb-prerender__footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  @media (prefers-color-scheme: dark) {
    #kb-prerender { color: #e2e8f0; }
    #kb-prerender .kb-prerender__lead,
    #kb-prerender .kb-prerender__blurb,
    #kb-prerender .kb-prerender__item p,
    #kb-prerender .kb-prerender__footer { color: #94a3b8; }
    #kb-prerender .kb-prerender__item a { border-color: #1e293b; }
    #kb-prerender .kb-prerender__count,
    #kb-prerender .kb-prerender__updated { color: #94a3b8; }
  }
</style>`

// --- Patch dist/index.html into dist/knowledge-base.html ------------------
const distIndex = readFileSync(resolve(root, 'dist/index.html'), 'utf8')
const distKb = distIndex.replace(
  '<div id="root"></div>',
  `<div id="root">${prerenderHtml}</div>`
)
// Also tighten the title and description for this specific page.
const distKbWithMeta = distKb
  .replace(
    /<title>[^<]*<\/title>/,
    `<title>База знаний — ${totalCount} разборов сравнений Интеграма с Excel, Airtable, Notion и заказной разработкой</title>`
  )
  .replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${totalCount} статей о том, в каких сценариях Интеграм заменяет Excel, Google Sheets, Airtable, Notion и заказную разработку. Группировка по темам, описание контекста каждой статьи, дата последнего обновления." />`
  )

writeFileSync(resolve(root, 'dist/knowledge-base.html'), distKbWithMeta)
console.log(`✓ wrote dist/knowledge-base.html (${distKbWithMeta.length} bytes, ${totalCount} articles)`)
