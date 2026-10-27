#!/usr/bin/env node
/**
 * Post-build prerender for the queries reference (the SPA route
 * `/queries.html`, backlogram#802).
 *
 * Как prerender-api.mjs: SPA отдаёт пустой <div id="root"></div>, а справочник
 * запросов должен быть в самом HTTP-ответе — его читают краулеры, клиенты без
 * JS и ИИ-агенты. Текст берётся из src/data/queryDocs.mjs — того же
 * источника, что питает src/pages/QueryDocs.tsx.
 *
 * Должен выполняться ПОСЛЕ vite build и ДО prerender-landing.mjs: он читает
 * ещё чистый dist/index.html (пререндер главной перезаписывает index.html
 * последним).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { QUERY_META, QUERY_INTRO, QUERY_SECTIONS } from '../src/data/queryDocs.mjs'
import { docsRingHtml } from '../src/data/docsRing.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const PATH = QUERY_META.path
const ID = 'queries-prerender'

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

/** Фрагменты в обратных кавычках — <code>, остальное экранируется. */
function inline(text) {
  return String(text)
    .split('`')
    .map((part, i) => (i % 2 === 1 ? `<code>${escape(part)}</code>` : escape(part)))
    .join('')
}

function blockHtml(b) {
  switch (b.t) {
    case 'p':
      return `<p>${inline(b.text)}</p>`
    case 'note':
      return `<p class="api-prerender__note">${inline(b.text)}${b.link ? ` <a href="${escape(b.link.href)}">${escape(b.link.text)}</a>` : ''}</p>`
    case 'list':
      return `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`
    case 'code':
      return `${b.label ? `<p class="api-prerender__label">${escape(b.label)}</p>` : ''}<pre><code>${escape(b.code)}</code></pre>`
    case 'table':
      return `<table><thead><tr>${b.head.map((h) => `<th>${escape(h)}</th>`).join('')}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`
    default:
      throw new Error(`prerender-queries: неизвестный блок ${b.t}`)
  }
}

// ───────────────────────────────────────────────────────────────────────────
//  Статический снапшот — тот же текст, что рендерит src/pages/QueryDocs.tsx
// ───────────────────────────────────────────────────────────────────────────
const tocHtml = QUERY_SECTIONS.map(
  (s) =>
    `<li><a href="#${s.id}">${escape(s.title)}</a><ul>${s.topics
      .map((t) => `<li><a href="#${t.id}">${escape(t.title)}</a></li>`)
      .join('')}</ul></li>`,
).join('')

const sectionsHtml = QUERY_SECTIONS.map(
  (s) => `
  <section id="${s.id}">
    <h2>${escape(s.title)}</h2>${s.topics
      .map(
        (t) => `
    <article id="${t.id}">
      <h3>${escape(t.title)}</h3>
      ${t.blocks.map(blockHtml).join('\n      ')}
    </article>`,
      )
      .join('')}
  </section>`,
).join('')

const canonical = `${SITE}${PATH}`

const bodyHtml = `
<article id="${ID}">
  <header>
    <nav class="api-prerender__crumbs" aria-label="Хлебные крошки">
      <a href="/">Интеграм</a> / <span>Запросы</span>
    </nav>
    <p class="api-prerender__eyebrow">Для разработчиков</p>
    <h1>${escape(QUERY_META.h1)}</h1>
    ${QUERY_INTRO.map((p) => `<p class="api-prerender__lead">${inline(p)}</p>`).join('\n    ')}
    ${docsRingHtml(PATH)}
  </header>
  <nav class="api-prerender__toc" aria-label="Содержание">
    <ol>${tocHtml}</ol>
  </nav>${sectionsHtml}
  <footer class="api-prerender__footer">
    <p>
      <a href="/">На главную</a> ·
      <a href="/api.html#reports">Справочник API: запросы</a> ·
      <a href="/stored-procedures.html">Хранимые процедуры</a> ·
      <a href="/knowledge-base.html">База знаний</a>
    </p>
  </footer>
</article>
<style>
  #${ID} { max-width: 60rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #${ID} h1 { font-size: 2.2rem; line-height: 1.15; margin: 0.5rem 0 0.75rem; }
  #${ID} h2 { font-size: 1.6rem; margin: 2.5rem 0 1rem; }
  #${ID} h3 { font-size: 1.2rem; margin: 1.75rem 0 0.5rem; }
  #${ID} p, #${ID} li { line-height: 1.65; margin: 0.4rem 0; }
  #${ID} a { color: #2563eb; }
  #${ID} code { font-family: ui-monospace, monospace; font-size: 0.9em; }
  #${ID} pre { background: #0f172a; color: #f1f5f9; padding: 1rem; border-radius: 0.75rem;
    overflow-x: auto; font-size: 0.85rem; line-height: 1.5; }
  #${ID} table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
  #${ID} th, #${ID} td { border: 1px solid #e2e8f0; padding: 0.35rem 0.6rem;
    text-align: left; vertical-align: top; }
  #${ID} .api-prerender__crumbs { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1rem; }
  #${ID} .api-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #${ID} .api-prerender__lead { font-size: 1.05rem; color: #475569; }
  #${ID} .api-prerender__label { font-size: 0.8rem; color: #64748b; margin-bottom: 0; }
  #${ID} .api-prerender__note { border-left: 3px solid #f59e0b; padding-left: 0.75rem; }
  #${ID} .docs-see-also { font-size: 0.92rem; margin: 1rem 0 0; }
  #${ID} .docs-see-also span { color: #64748b; }
  #${ID} .api-prerender__footer { margin-top: 2rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Тёмная тема идёт от .dark на <html>, как в остальных снапшотах. */
  .dark #${ID} { color: #e2e8f0; }
  .dark #${ID} .api-prerender__lead, .dark #${ID} .api-prerender__footer { color: #94a3b8; }
  .dark #${ID} th, .dark #${ID} td { border-color: #334155; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: TechArticle + BreadcrumbList
// ───────────────────────────────────────────────────────────────────────────
const ogImage = `${SITE}/og/queries.png`
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TechArticle',
      '@id': `${canonical}#article`,
      url: canonical,
      headline: QUERY_META.h1,
      name: QUERY_META.title,
      description: QUERY_META.description,
      inLanguage: 'ru',
      isPartOf: { '@id': `${SITE}/#website` },
      publisher: { '@type': 'Organization', name: PUBLISHER, url: `${SITE}/` },
      keywords: QUERY_META.keywords,
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Запросы', item: canonical },
      ],
    },
  ],
}

const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="article" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(QUERY_META.title)}" />`,
  `<meta property="og:description" content="${escape(QUERY_META.description)}" />`,
  `<meta property="og:image" content="${escape(ogImage)}" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="${PUBLISHER}" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${escape(QUERY_META.title)}" />`,
  `<meta name="twitter:description" content="${escape(QUERY_META.description)}" />`,
  `<meta name="twitter:image" content="${escape(ogImage)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

// ───────────────────────────────────────────────────────────────────────────
//  Write dist/queries.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-queries: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-queries: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(QUERY_META.title)}</title>`)
  .replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escape(QUERY_META.description)}" />`,
  )
  .replace(
    /<meta name="keywords"[^>]*>/,
    `<meta name="keywords" content="${escape(QUERY_META.keywords)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  // Функция замены: в тексте справочника есть `$`, который строковая замена
  // прочла бы как ссылку на группу.
  .replace('<div id="root"></div>', () => `<div id="root">${bodyHtml}</div>`)

const outPath = resolve(dist, 'queries.html')
writeFileSync(outPath, html)
console.log(`✓ queries prerendered → dist/queries.html (${html.length} bytes)`)
