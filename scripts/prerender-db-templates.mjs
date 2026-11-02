#!/usr/bin/env node
/**
 * Post-build prerender for the solution templates catalog (the SPA route
 * `/shablony-reshenij.html`, ideav/crm#5364).
 *
 * Как prerender-templater.mjs: SPA отдаёт пустой <div id="root"></div>, а каталог
 * шаблонов должен быть в самом HTTP-ответе — его читают краулеры, клиенты без
 * JS и ИИ-агенты. Текст берётся из src/data/dbTemplates.mjs — того же
 * источника, что питает src/pages/DbTemplates.tsx.
 *
 * Должен выполняться ПОСЛЕ vite build и ДО prerender-landing.mjs: он читает
 * ещё чистый dist/index.html (пререндер главной перезаписывает index.html
 * последним).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DBT_META,
  DBT_INTRO,
  DBT_CATALOG,
  DBT_CREATE,
  DBT_OWN,
  DBT_LIMITS,
  DBT_CTA,
  DBT_RELATED,
} from '../src/data/dbTemplates.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const PATH = DBT_META.path
const ID = 'db-templates-prerender'

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

const a = (l) =>
  `<a href="${escape(l.href)}"${l.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(l.text)}</a>`
const ol = (items) => `<ol>${items.map((i) => `<li>${i}</li>`).join('')}</ol>`
const ul = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`

const catalogHtml = DBT_CATALOG.map(
  (t) => `
    <article id="${escape(t.id)}">
      <h3>${escape(t.name)}</h3>
      <p><strong>Для кого:</strong> ${escape(t.audience)}</p>
      <p><strong>Задача:</strong> ${escape(t.task)}</p>
      <p><strong>Внутри</strong></p>
      ${ul(t.inside.map(escape))}
      <p>${t.links.map(a).join(' · ')}</p>
    </article>`,
).join('')

const bodyHtml = `
<article id="${ID}">
  <header>
    <nav class="db-prerender__crumbs" aria-label="Хлебные крошки">
      <a href="/">Интеграм</a> / <span>${escape(DBT_META.h1)}</span>
    </nav>
    <p class="db-prerender__eyebrow">Готовые базы</p>
    <h1>${escape(DBT_META.h1)}</h1>
    <p class="db-prerender__lead">${escape(DBT_INTRO)}</p>
  </header>
  <section id="katalog">
    <h2>Каталог шаблонов</h2>${catalogHtml}
  </section>
  <section id="${DBT_CREATE.id}">
    <h2>${escape(DBT_CREATE.title)}</h2>
    ${ol(DBT_CREATE.steps.map((s) => `${escape(s.text)}${s.link ? ` ${a(s.link)}` : ''}`))}
  </section>
  <section id="${DBT_OWN.id}">
    <h2>${escape(DBT_OWN.title)}</h2>
    <p class="db-prerender__eyebrow">${escape(DBT_OWN.audience)}</p>
    <p>${escape(DBT_OWN.intro)}</p>
    ${ol(DBT_OWN.steps.map(escape))}
    ${ul(DBT_OWN.notes.map(escape))}
  </section>
  <section id="${DBT_LIMITS.id}">
    <h2>${escape(DBT_LIMITS.title)}</h2>
    ${ul(DBT_LIMITS.items.map(escape))}
  </section>
  <p class="db-prerender__cta">${DBT_CTA.map(a).join(' · ')}</p>
  <section id="${DBT_RELATED.id}">
    <h2>${escape(DBT_RELATED.title)}</h2>
    ${ul(DBT_RELATED.links.map(a))}
  </section>
  <footer class="db-prerender__footer">
    <p><a href="/">На главную</a> · <a href="/resheniya.html">Решения вместо Excel</a> · <a href="/knowledge-base.html">База знаний</a></p>
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
  #${ID} .db-prerender__crumbs { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1rem; }
  #${ID} .db-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #${ID} .db-prerender__lead { font-size: 1.05rem; color: #475569; }
  #${ID} .db-prerender__footer { margin-top: 2rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  .dark #${ID} { color: #e2e8f0; }
  .dark #${ID} .db-prerender__lead, .dark #${ID} .db-prerender__footer { color: #94a3b8; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: Article + BreadcrumbList
// ───────────────────────────────────────────────────────────────────────────
const canonical = `${SITE}${PATH}`
const ogImage = `${SITE}/og/shablony-reshenij.png`
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      '@id': `${canonical}#article`,
      url: canonical,
      headline: DBT_META.h1,
      name: DBT_META.title,
      description: DBT_META.description,
      inLanguage: 'ru',
      isPartOf: { '@id': `${SITE}/#website` },
      publisher: { '@type': 'Organization', name: PUBLISHER, url: `${SITE}/` },
      keywords: DBT_META.keywords,
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: DBT_META.h1, item: canonical },
      ],
    },
  ],
}

const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="article" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(DBT_META.title)}" />`,
  `<meta property="og:description" content="${escape(DBT_META.description)}" />`,
  `<meta property="og:image" content="${escape(ogImage)}" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="${PUBLISHER}" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${escape(DBT_META.title)}" />`,
  `<meta name="twitter:description" content="${escape(DBT_META.description)}" />`,
  `<meta name="twitter:image" content="${escape(ogImage)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

// ───────────────────────────────────────────────────────────────────────────
//  Write dist/shablony-reshenij.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const source = readFileSync(resolve(dist, 'index.html'), 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-db-templates: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-db-templates: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(DBT_META.title)}</title>`)
  .replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escape(DBT_META.description)}" />`,
  )
  .replace(
    /<meta name="keywords"[^>]*>/,
    `<meta name="keywords" content="${escape(DBT_META.keywords)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', () => `<div id="root">${bodyHtml}</div>`)

writeFileSync(resolve(dist, 'shablony-reshenij.html'), html)
console.log(`✓ db-templates prerendered → dist/shablony-reshenij.html (${html.length} bytes)`)
