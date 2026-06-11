#!/usr/bin/env node
/**
 * Post-build prerender for the Knowledge Base.
 *
 * For each crawler-relevant URL we drop a fully-rendered HTML file
 * next to the SPA bundle. When a real visitor opens the URL:
 *
 *   - The HTTP response carries this static HTML, so search engines,
 *     LLM crawlers (GPT-Bot, ClaudeBot, PerplexityBot, …) and no-JS
 *     clients see meaningful content right away. Social-preview bots
 *     (Telegram, VK, Twitter) pick up OG/Twitter tags too.
 *   - When React boots, createRoot().render(<App/>) replaces the
 *     contents of #root with the SPA — the static fallback disappears.
 *
 * Generates:
 *   dist/knowledge-base.html              — collection page (16+ groups)
 *   dist/knowledge-base/index.html        — same, served at the no-suffix URL
 *   dist/knowledge-base/<slug>.html       — one per article (canonical URL)
 *   dist/knowledge-base/<slug>/index.html — same, served at the no-suffix URL
 *
 * Every page is self-canonical on its .html URL — the exact URL listed in
 * sitemap.xml and linked from the SPA — so Google does not pick a different
 * canonical and flag the page as a duplicate (issue #341).
 *
 * Each file gets:
 *   - tightened <title>
 *   - per-page meta description and keywords
 *   - <link rel="canonical">
 *   - Open Graph + Twitter Card tags (for Telegram/VK/Twitter previews)
 *   - JSON-LD structured data (CollectionPage + ItemList on the index,
 *     Article on each post)
 *
 * Articles are loaded from src/data/knowledgeBase.ts via esbuild so we
 * don't have to maintain a parallel JSON.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'

// ───────────────────────────────────────────────────────────────────────────
//  Load article data
// ───────────────────────────────────────────────────────────────────────────
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

// ───────────────────────────────────────────────────────────────────────────
//  Groups for the index page
// ───────────────────────────────────────────────────────────────────────────
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
      '19-ai-agent-app-build',
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

// ───────────────────────────────────────────────────────────────────────────
//  Helpers
// ───────────────────────────────────────────────────────────────────────────
function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

function trim(text, max = 230) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return t.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

const today = new Date().toLocaleDateString('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).replace(' г.', '')
const todayISO = new Date().toISOString().slice(0, 10)

const articlesBySlug = new Map(knowledgeBaseArticles.map((a) => [a.slug, a]))
const groupedSlugs = new Set(groups.flatMap((g) => g.slugs))
const orphan = knowledgeBaseArticles.filter((a) => !groupedSlugs.has(a.slug))
if (orphan.length > 0) {
  groups.push({
    title: 'Остальные материалы',
    blurb: '',
    slugs: orphan.map((a) => a.slug),
  })
}
const totalCount = knowledgeBaseArticles.length
const distIndex = readFileSync(resolve(dist, 'index.html'), 'utf8')

// ───────────────────────────────────────────────────────────────────────────
//  Common <head> patching
// ───────────────────────────────────────────────────────────────────────────
/**
 * Patch the SPA template with per-page <title>, description, canonical,
 * Open Graph / Twitter / JSON-LD, and the prerendered #root body.
 */
function patchHtml({ title, description, canonical, ogType, ogImage, jsonLd, bodyHtml, keywords }) {
  const ogDesc = trim(description, 300)
  const image = ogImage || `${SITE}/og/knowledge-base.png`
  const tags = [
    `<link rel="canonical" href="${escape(canonical)}" />`,
    `<meta property="og:type" content="${escape(ogType)}" />`,
    `<meta property="og:url" content="${escape(canonical)}" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(ogDesc)}" />`,
    `<meta property="og:image" content="${escape(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="ru_RU" />`,
    `<meta property="og:site_name" content="${PUBLISHER}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(title)}" />`,
    `<meta name="twitter:description" content="${escape(ogDesc)}" />`,
    `<meta name="twitter:image" content="${escape(image)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')

  let html = distIndex
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${escape(description)}" />`
    )
    .replace(
      /<meta name="keywords" content="[^"]*"\s*\/>/,
      keywords
        ? `<meta name="keywords" content="${escape(keywords)}" />`
        : ''
    )
    .replace('</head>', `    ${tags}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

  return html
}

// ───────────────────────────────────────────────────────────────────────────
//  Index page (collection)
// ───────────────────────────────────────────────────────────────────────────
const groupsHtml = groups
  .filter((g) => g.slugs.length > 0)
  .map((g) => {
    const items = g.slugs
      .map((slug) => articlesBySlug.get(slug))
      .filter(Boolean)
      .map(
        (a) => `
          <li class="kb-prerender__item">
            <a href="/knowledge-base/${escape(a.slug)}.html">
              <h3>${escape(a.shortTitle || a.title)}</h3>
              <p>${escape(a.compare || trim(a.summary, 220))}</p>
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

const indexBody = `
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
      <a href="/knowledge-base.html">/knowledge-base.html</a>.
    </p>
  </footer>
</article>
<style>
  #kb-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #kb-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #kb-prerender h2 { font-size: 1.35rem; margin: 2.5rem 0 0.5rem; }
  #kb-prerender h3 { font-size: 1.05rem; margin: 0 0 0.4rem; font-weight: 600; }
  #kb-prerender p  { line-height: 1.55; margin: 0.5rem 0; }
  #kb-prerender .kb-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #kb-prerender .kb-prerender__lead { font-size: 1.1rem; color: #475569; max-width: 48rem; }
  #kb-prerender .kb-prerender__updated { font-size: 0.78rem; color: #64748b; margin-top: 1rem; }
  #kb-prerender .kb-prerender__count { font-weight: 400; color: #64748b; font-size: 0.85em; }
  #kb-prerender .kb-prerender__blurb { color: #475569; max-width: 48rem; margin-bottom: 1rem; }
  #kb-prerender .kb-prerender__list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
  #kb-prerender .kb-prerender__item a { display: block; padding: 0.9rem 1rem;
    border: 1px solid #e2e8f0; border-radius: 0.5rem; color: inherit; text-decoration: none; }
  #kb-prerender .kb-prerender__item a:hover { border-color: #3b82f6; }
  #kb-prerender .kb-prerender__item p { font-size: 0.92rem; color: #475569; margin: 0; }
  #kb-prerender .kb-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme. The body
     background comes from the bundled CSS keyed on the same .dark class, so the
     fallback text must use that signal too; otherwise a visitor who picked the
     site's dark theme while the OS is light sees dark text on a dark background —
     a black screen during loading (issue #325). */
  .dark #kb-prerender { color: #e2e8f0; }
  .dark #kb-prerender .kb-prerender__lead, .dark #kb-prerender .kb-prerender__blurb,
  .dark #kb-prerender .kb-prerender__item p, .dark #kb-prerender .kb-prerender__footer { color: #94a3b8; }
  .dark #kb-prerender .kb-prerender__item a { border-color: #1e293b; }
  .dark #kb-prerender .kb-prerender__count, .dark #kb-prerender .kb-prerender__updated { color: #94a3b8; }
</style>`

const indexTitle = `База знаний — ${totalCount} разборов сравнений Интеграма с Excel, Airtable, Notion и заказной разработкой`
const indexDescription = `${totalCount} статей о том, в каких сценариях Интеграм заменяет Excel, Google Sheets, Airtable, Notion и заказную разработку. Группировка по темам, описание контекста каждой статьи, дата последнего обновления.`

const collectionJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${SITE}/knowledge-base.html#collection`,
      url: `${SITE}/knowledge-base.html`,
      name: indexTitle,
      description: indexDescription,
      inLanguage: 'ru',
      isPartOf: { '@type': 'WebSite', name: PUBLISHER, url: SITE },
      dateModified: todayISO,
    },
    {
      '@type': 'ItemList',
      '@id': `${SITE}/knowledge-base.html#articles`,
      numberOfItems: totalCount,
      itemListElement: knowledgeBaseArticles.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE}/knowledge-base/${a.slug}.html`,
        name: a.shortTitle || a.title,
      })),
    },
  ],
}

const indexHtml = patchHtml({
  title: indexTitle,
  description: indexDescription,
  canonical: `${SITE}/knowledge-base.html`,
  ogType: 'website',
  ogImage: `${SITE}/og/knowledge-base.png`,
  jsonLd: collectionJsonLd,
  bodyHtml: indexBody,
  keywords:
    'интеграм, no-code, замена excel, аналог airtable, альтернатива notion, заказная разработка, конструктор баз данных',
})

writeFileSync(resolve(dist, 'knowledge-base.html'), indexHtml)
mkdirSync(resolve(dist, 'knowledge-base'), { recursive: true })
writeFileSync(resolve(dist, 'knowledge-base/index.html'), indexHtml)
console.log(`✓ /knowledge-base{,.html}/index.html  (${indexHtml.length} bytes, ${totalCount} articles)`)

// ───────────────────────────────────────────────────────────────────────────
//  Per-article pages
// ───────────────────────────────────────────────────────────────────────────
for (const article of knowledgeBaseArticles) {
  const url = `${SITE}/knowledge-base/${article.slug}.html`
  const title = article.seoTitle || article.title
  const description = article.metaDescription || article.seoDescription || trim(article.summary, 260)
  const ogTitle = article.ogTitle || title
  const ogDescription = article.ogDescription || description
  const keywords = article.metaKeywords || ''
  const articleImage = `/og/${article.slug}.png`
  const articleImageAlt = `Обложка статьи: ${article.shortTitle || article.title}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${url}#article`,
    headline: title,
    name: article.title,
    description,
    image: `${SITE}${articleImage}`,
    url,
    inLanguage: 'ru',
    dateModified: todayISO,
    author: { '@type': 'Organization', name: PUBLISHER, url: SITE },
    publisher: {
      '@type': 'Organization',
      name: PUBLISHER,
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/logos/integram-og.png` },
    },
    isPartOf: {
      '@type': 'CollectionPage',
      name: 'База знаний',
      url: `${SITE}/knowledge-base.html`,
    },
    mainEntityOfPage: url,
  }

  const contextHtml = article.context
    ? `<section class="kb-article__context"><p>${escape(article.context)}</p></section>`
    : ''

  const scenarioHtml = article.scenario?.symptoms?.length
    ? `<section class="kb-article__scenario">
        <h2>Контекст</h2>
        ${article.scenario.intro ? `<p>${escape(article.scenario.intro)}</p>` : ''}
        <ul>${article.scenario.symptoms.map((s) => `<li>${escape(s)}</li>`).join('')}</ul>
      </section>`
    : ''

  const integramHtml = article.integramScenario?.steps?.length
    ? `<section class="kb-article__integram">
        <h2>Как это решает Интеграм</h2>
        ${article.integramScenario.intro ? `<p>${escape(article.integramScenario.intro)}</p>` : ''}
        <ol>${article.integramScenario.steps.map((s) => `<li>${escape(s)}</li>`).join('')}</ol>
      </section>`
    : ''

  const articleBody = `
<article id="kb-prerender" itemscope itemtype="https://schema.org/TechArticle">
  <nav class="kb-article__nav"><a href="/knowledge-base.html">← База знаний</a></nav>
  <header>
    <p class="kb-prerender__eyebrow">${escape(article.compare ? `Сравнение с ${article.compare}` : 'База знаний')}</p>
    <h1 itemprop="headline">${escape(article.title)}</h1>
    <p class="kb-prerender__lead" itemprop="description">${escape(article.compare || trim(article.summary, 220))}</p>
    <figure class="kb-prerender__cover">
      <img src="${articleImage}" alt="${escape(articleImageAlt)}" width="1200" height="630" loading="eager" />
    </figure>
  </header>
  <section class="kb-article__summary"><p>${escape(article.summary)}</p></section>
  ${contextHtml}
  ${scenarioHtml}
  ${integramHtml}
  <footer class="kb-prerender__footer">
    <a href="/knowledge-base.html">← Все статьи базы знаний</a>
  </footer>
</article>
<style>
  #kb-prerender { max-width: 48rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; line-height: 1.6; }
  #kb-prerender h1 { font-size: 2rem; line-height: 1.15; margin: 0.4rem 0 1rem; }
  #kb-prerender h2 { font-size: 1.25rem; margin: 2rem 0 0.5rem; }
  #kb-prerender p  { margin: 0.6rem 0; }
  #kb-prerender .kb-article__nav { margin-bottom: 1.5rem; font-size: 0.92rem; }
  #kb-prerender .kb-article__nav a { color: #3b82f6; text-decoration: none; }
  #kb-prerender .kb-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #kb-prerender .kb-prerender__lead { font-size: 1.15rem; color: #334155; margin: 0.8rem 0 1.5rem; }
  #kb-prerender .kb-prerender__cover { margin: 1.5rem 0 1.75rem; overflow: hidden;
    border: 1px solid #e2e8f0; border-radius: 0.5rem; background: #0f172a; }
  #kb-prerender .kb-prerender__cover img { display: block; width: 100%; height: auto;
    aspect-ratio: 1200 / 630; object-fit: cover; }
  #kb-prerender ul, #kb-prerender ol { padding-left: 1.5rem; }
  #kb-prerender li { margin-bottom: 0.4rem; }
  #kb-prerender .kb-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme. The body
     background comes from the bundled CSS keyed on the same .dark class, so the
     fallback text must use that signal too; otherwise a visitor who picked the
     site's dark theme while the OS is light sees dark text on a dark background —
     a black screen during loading (issue #325). */
  .dark #kb-prerender { color: #e2e8f0; }
  .dark #kb-prerender .kb-prerender__lead { color: #cbd5e1; }
  .dark #kb-prerender .kb-prerender__cover { border-color: #1e293b; }
  .dark #kb-prerender .kb-prerender__footer { border-color: #1e293b; }
</style>`

  const html = patchHtml({
    title,
    description: trim(description, 300),
    canonical: url,
    ogType: 'article',
    ogImage: `${SITE}${articleImage}`,
    jsonLd,
    bodyHtml: articleBody,
    keywords,
  })

  // The canonical/public URL is /knowledge-base/<slug>.html (matches the
  // sitemap, internal links and the client-side React canonical). Write the
  // page at that exact path so the crawled URL is self-canonical.
  mkdirSync(resolve(dist, 'knowledge-base'), { recursive: true })
  writeFileSync(resolve(dist, 'knowledge-base', `${article.slug}.html`), html)

  // Also serve the directory-style URL /knowledge-base/<slug> with the same
  // content; its canonical points back at the .html URL so Google consolidates
  // the two instead of flagging a duplicate (issue #341).
  const dir = resolve(dist, 'knowledge-base', article.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, 'index.html'), html)
}

console.log(`✓ ${knowledgeBaseArticles.length} article pages → dist/knowledge-base/<slug>.html{,/index.html}`)
