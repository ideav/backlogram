#!/usr/bin/env node
/**
 * Post-build prerender for the terms of service (the SPA route `/terms.html`).
 *
 * До этого /terms.html был статической страницей в public/ — копией
 * integram.io/terms.html в вёрстке старого сайта: она тянула css/style.min.css
 * и img/logo2.svg из вебрута и жила отдельно от дизайна ideav.ru. Теперь
 * страницу собирает сам сайт, а этот скрипт пишет её краулерский снапшот: как
 * и остальные страницы, SPA отдаёт пустой <div id="root"></div>, а юридический
 * документ должен быть в самом HTTP-ответе (у Яндекса рендеринг JS ограничен,
 * плюс клиенты без JS).
 *
 * Скрипт берёт чистый dist/index.html как шаблон и пишет соседний
 * dist/terms.html с <title>, meta description/keywords, self-canonical (его
 * требовал Яндекс.Вебмастер — issue #410), Open Graph + Twitter Card, JSON-LD
 * (WebPage + BreadcrumbList) и полным текстом соглашения внутри #root.
 *
 * Текст берётся из src/data/terms.mjs — того же источника, что питает
 * src/pages/Terms.tsx, поэтому снапшот не может разойтись с React-версией.
 *
 * Должен выполняться ПОСЛЕ prerender-knowledge-base.mjs и ДО
 * prerender-landing.mjs: он читает ещё чистый dist/index.html (пререндер
 * главной перезаписывает index.html последним).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  TERMS_META,
  TERMS_INTRO,
  TERMS_CLAUSES,
  TERMS_PRIVACY_NOTE,
} from '../src/data/terms.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const PATH = TERMS_META.path

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

/** Текст пункта: `{link}` разворачивается в <a>, остальное экранируется. */
function clauseHtml(clause) {
  if (!clause.link) return escape(clause.text)
  const [before, after = ''] = clause.text.split('{link}')
  return `${escape(before)}<a href="${escape(clause.link.href)}">${escape(clause.link.text)}</a>${escape(after)}`
}

// ───────────────────────────────────────────────────────────────────────────
//  Статический снапшот — тот же текст, что рендерит src/pages/Terms.tsx
// ───────────────────────────────────────────────────────────────────────────
const clausesHtml = TERMS_CLAUSES
  .map((c) => `<li id="p${c.n}">${clauseHtml(c)}</li>`)
  .join('\n    ')

const canonical = `${SITE}${PATH}`

const bodyHtml = `
<article id="tm-prerender" itemscope itemtype="https://schema.org/WebPage">
  <header>
    <nav class="tm-prerender__crumbs" aria-label="Хлебные крошки">
      <a href="/">Интеграм</a> / <span>Соглашение об использовании</span>
    </nav>
    <p class="tm-prerender__eyebrow">Правила использования</p>
    <h1 itemprop="headline">Соглашение об использовании сервиса</h1>
    <p class="tm-prerender__lead" itemprop="description">${escape(TERMS_INTRO)}</p>
  </header>
  <ol class="tm-prerender__clauses">
    ${clausesHtml}
  </ol>
  <p class="tm-prerender__note">
    ${escape(TERMS_PRIVACY_NOTE.text)}
    <a href="${escape(TERMS_PRIVACY_NOTE.link.href)}">${escape(TERMS_PRIVACY_NOTE.link.text)}</a>
  </p>
  <footer class="tm-prerender__footer">
    <p>
      <a href="/">На главную</a> ·
      <a href="/privacy.html">Обработка персональных данных</a> ·
      <a href="/resheniya.html">Решения вместо Excel</a>
    </p>
  </footer>
</article>
<style>
  #tm-prerender { max-width: 56rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #tm-prerender h1 { font-size: 2.2rem; line-height: 1.15; margin: 0.5rem 0 0.75rem; }
  #tm-prerender p  { line-height: 1.65; margin: 0.5rem 0; }
  #tm-prerender a  { color: #2563eb; }
  #tm-prerender .tm-prerender__crumbs { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1rem; }
  #tm-prerender .tm-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #tm-prerender .tm-prerender__lead { font-size: 1.05rem; color: #475569; max-width: 50rem; }
  #tm-prerender .tm-prerender__clauses { line-height: 1.7; margin: 1.5rem 0; padding-left: 1.4rem; }
  #tm-prerender .tm-prerender__clauses li { margin: 0.75rem 0; }
  #tm-prerender .tm-prerender__note { margin-top: 2rem; font-size: 0.95rem; color: #475569; }
  #tm-prerender .tm-prerender__footer { margin-top: 2rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Тёмная тема идёт от .dark на <html> (его синхронно ставит инлайновый скрипт
     в <head> по localStorage), а не от prefers-color-scheme — как в остальных
     снапшотах. */
  .dark #tm-prerender { color: #e2e8f0; }
  .dark #tm-prerender .tm-prerender__lead, .dark #tm-prerender .tm-prerender__note,
  .dark #tm-prerender .tm-prerender__footer { color: #94a3b8; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebPage + BreadcrumbList
// ───────────────────────────────────────────────────────────────────────────
const ogImage = `${SITE}/og/knowledge-base.png`
const ogImageW = 1200
const ogImageH = 630

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: TERMS_META.title,
      description: TERMS_META.description,
      inLanguage: 'ru',
      isPartOf: { '@id': `${SITE}/#website` },
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Соглашение об использовании сервиса', item: canonical },
      ],
    },
  ],
}

const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="article" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(TERMS_META.title)}" />`,
  `<meta property="og:description" content="${escape(TERMS_META.description)}" />`,
  `<meta property="og:image" content="${escape(ogImage)}" />`,
  `<meta property="og:image:width" content="${ogImageW}" />`,
  `<meta property="og:image:height" content="${ogImageH}" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="${PUBLISHER}" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${escape(TERMS_META.title)}" />`,
  `<meta name="twitter:description" content="${escape(TERMS_META.description)}" />`,
  `<meta name="twitter:image" content="${escape(ogImage)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

// ───────────────────────────────────────────────────────────────────────────
//  Write dist/terms.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-terms: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-terms: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(TERMS_META.title)}</title>`)
  .replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escape(TERMS_META.description)}" />`,
  )
  .replace(
    /<meta name="keywords"[^>]*>/,
    `<meta name="keywords" content="${escape(TERMS_META.keywords)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

const outPath = resolve(dist, 'terms.html')
writeFileSync(outPath, html)
console.log(`✓ terms prerendered → dist/terms.html (${html.length} bytes)`)
