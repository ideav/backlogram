#!/usr/bin/env node
/**
 * Post-build prerender for the privacy policy (the SPA route `/privacy.html`).
 *
 * Как и остальные страницы сайта, политика живёт в React-SPA: собранный
 * dist/index.html отдаёт пустой <div id="root"></div>. Для юридического
 * документа этого мало — текст согласия должен быть в самом HTTP-ответе:
 * его читают краулеры (у Яндекса рендеринг JS ограничен), клиенты без JS и
 * проверяющие, которым важно, что политика опубликована и общедоступна
 * (ч. 2 ст. 18.1 152-ФЗ).
 *
 * Скрипт берёт чистый dist/index.html как шаблон и пишет соседний
 * dist/privacy.html с:
 *   - <title>, meta description/keywords;
 *   - <link rel="canonical">;
 *   - Open Graph + Twitter Card;
 *   - JSON-LD (WebPage + BreadcrumbList);
 *   - полным статическим текстом политики внутри #root.
 *
 * Текст берётся из src/data/privacy.mjs — того же источника, что питает
 * src/pages/Privacy.tsx, поэтому снапшот не может разойтись с React-версией.
 *
 * Должен выполняться ПОСЛЕ prerender-knowledge-base.mjs и ДО
 * prerender-landing.mjs: он читает ещё чистый dist/index.html (пререндер
 * главной перезаписывает index.html последним).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  PRIVACY_META,
  PRIVACY_OPERATOR,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
} from '../src/data/privacy.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const PATH = PRIVACY_META.path

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

// ───────────────────────────────────────────────────────────────────────────
//  Статический снапшот — тот же текст, что рендерит src/pages/Privacy.tsx
// ───────────────────────────────────────────────────────────────────────────
const sectionsHtml = PRIVACY_SECTIONS.map((section) => {
  const blocks = section.blocks
    .map((block) =>
      block.list
        ? `<ul>${block.list.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>`
        : `<p>${escape(block.p)}</p>`,
    )
    .join('\n    ')
  return `
  <section class="pv-prerender__group">
    <h2 id="${escape(section.id)}">${escape(section.h)}</h2>
    ${blocks}
  </section>`
}).join('')

const canonical = `${SITE}${PATH}`

const bodyHtml = `
<article id="pv-prerender" itemscope itemtype="https://schema.org/WebPage">
  <header>
    <nav class="pv-prerender__crumbs" aria-label="Хлебные крошки">
      <a href="/">Интеграм</a> / <span>Политика обработки персональных данных</span>
    </nav>
    <p class="pv-prerender__eyebrow">Документ по 152-ФЗ</p>
    <h1 itemprop="headline">Политика обработки персональных данных</h1>
    <p class="pv-prerender__date">Редакция от <time datetime="${escape(PRIVACY_META.updatedISO)}">${escape(PRIVACY_META.updated)}</time></p>
    <p class="pv-prerender__lead" itemprop="description">${escape(PRIVACY_INTRO)}</p>
  </header>
  ${sectionsHtml}
  <section class="pv-prerender__group">
    <h2 id="kontakty">13. Контакты</h2>
    <p><strong>${escape(PRIVACY_OPERATOR.name)}</strong></p>
    <ul>
      <li>ИНН: ${escape(PRIVACY_OPERATOR.inn)}</li>
      <li>ОГРН: ${escape(PRIVACY_OPERATOR.ogrn)}</li>
      <li>Электронная почта: <a href="mailto:${escape(PRIVACY_OPERATOR.email)}">${escape(PRIVACY_OPERATOR.email)}</a></li>
      <li>Телефон: <a href="tel:${escape(PRIVACY_OPERATOR.phoneHref)}">${escape(PRIVACY_OPERATOR.phone)}</a></li>
    </ul>
    <p>
      По вопросам обработки персональных данных, для отзыва согласия и для запросов по
      статьям 14–16 152-ФЗ пишите на указанный адрес электронной почты.
    </p>
  </section>
  <footer class="pv-prerender__footer">
    <p>
      <a href="/">На главную</a> ·
      <a href="/resheniya.html">Решения вместо Excel</a> ·
      <a href="/knowledge-base.html">База знаний</a>
    </p>
  </footer>
</article>
<style>
  #pv-prerender { max-width: 56rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #pv-prerender h1 { font-size: 2.2rem; line-height: 1.15; margin: 0.5rem 0 0.75rem; }
  #pv-prerender h2 { font-size: 1.25rem; margin: 2.25rem 0 0.5rem; }
  #pv-prerender p  { line-height: 1.65; margin: 0.5rem 0; }
  #pv-prerender ul { line-height: 1.7; margin: 0.5rem 0; padding-left: 1.2rem; }
  #pv-prerender a  { color: #2563eb; }
  #pv-prerender .pv-prerender__crumbs { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1rem; }
  #pv-prerender .pv-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #pv-prerender .pv-prerender__date { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1rem; }
  #pv-prerender .pv-prerender__lead { font-size: 1.05rem; color: #475569; max-width: 50rem; }
  #pv-prerender .pv-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Тёмная тема идёт от .dark на <html> (его синхронно ставит инлайновый скрипт
     в <head> по localStorage), а не от prefers-color-scheme — как в остальных
     снапшотах. */
  .dark #pv-prerender { color: #e2e8f0; }
  .dark #pv-prerender .pv-prerender__lead, .dark #pv-prerender .pv-prerender__footer { color: #94a3b8; }
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
      name: PRIVACY_META.title,
      description: PRIVACY_META.description,
      inLanguage: 'ru',
      dateModified: PRIVACY_META.updatedISO,
      isPartOf: { '@id': `${SITE}/#website` },
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Политика обработки персональных данных', item: canonical },
      ],
    },
  ],
}

const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="article" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(PRIVACY_META.title)}" />`,
  `<meta property="og:description" content="${escape(PRIVACY_META.description)}" />`,
  `<meta property="og:image" content="${escape(ogImage)}" />`,
  `<meta property="og:image:width" content="${ogImageW}" />`,
  `<meta property="og:image:height" content="${ogImageH}" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="${PUBLISHER}" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${escape(PRIVACY_META.title)}" />`,
  `<meta name="twitter:description" content="${escape(PRIVACY_META.description)}" />`,
  `<meta name="twitter:image" content="${escape(ogImage)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

// ───────────────────────────────────────────────────────────────────────────
//  Write dist/privacy.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-privacy: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-privacy: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(PRIVACY_META.title)}</title>`)
  .replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escape(PRIVACY_META.description)}" />`,
  )
  .replace(
    /<meta name="keywords"[^>]*>/,
    `<meta name="keywords" content="${escape(PRIVACY_META.keywords)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

const outPath = resolve(dist, 'privacy.html')
writeFileSync(outPath, html)
console.log(`✓ privacy prerendered → dist/privacy.html (${html.length} bytes)`)
