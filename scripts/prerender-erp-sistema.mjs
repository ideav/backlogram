#!/usr/bin/env node
/**
 * Post-build prerender for «ERP-система со 100% кастомизацией»
 * (/erp-sistema.html, issue #817).
 *
 * Формула УТП, контуры, сравнение, этапы с ценами и FAQ обязаны быть в самом
 * HTTP-ответе: SPA отдаёт пустой <div id="root"></div>, а страница живёт
 * рекламой — модерация Директа и краулеры смотрят без JS. Форма заявки
 * интерактивна и живёт в React.
 *
 * Тексты — из src/data/erpSistema.mjs, того же источника, что питает
 * src/pages/ErpSistema.tsx.
 *
 * Must run AFTER vite build and BEFORE prerender-landing.mjs: it reads the
 * still-clean dist/index.html.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  COMPARE,
  ERP_META,
  FAQ,
  FORMULA,
  HERO_CHIPS,
  HERO_LEAD,
  MODULES,
  PROCESS,
  READ_MORE,
  RELATED,
} from '../src/data/erpSistema.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const PATH = ERP_META.path

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

const canonical = `${SITE}${PATH}`
// Карточка рисуется scripts/generate-og-images.mjs (slug erp-sistema), 1200×630.
const ogImage = `${SITE}/og/erp-sistema.png`

const a = (href, label) => `<a href="${escape(href)}">${escape(label)}</a>`
const chipsHtml = HERO_CHIPS.map((c) => `<span class="erp-prerender__chip">${escape(c)}</span>`).join(' ')

const formulaHtml = FORMULA.map((s) => `<li><h3>${escape(s.h)}</h3><p>${escape(s.p)}</p></li>`).join('')
const modulesHtml = MODULES.map(
  (m) => `<li><h3>${escape(m.h)}</h3><p>Из практики: ${escape(m.best)}.</p><p>Под вас: ${escape(m.custom)}.</p>${m.href ? `<p>${a(m.href, 'Подробнее о контуре')}</p>` : ''}</li>`,
).join('')
const compareHtml = `<table>
      <thead><tr>${COMPARE.columns.map((c) => `<th>${escape(c)}</th>`).join('')}</tr></thead>
      <tbody>${COMPARE.rows
        .map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th>${escape(c)}</th>` : `<td>${escape(c)}</td>`)).join('')}</tr>`)
        .join('')}</tbody>
    </table>`
const processHtml = PROCESS.map(
  (s) => `<li><h3>${escape(s.h)} — ${escape(s.price)}</h3><p>${escape(s.p)}</p></li>`,
).join('')
const faqHtml = FAQ.map((f) => `<h3>${escape(f.q)}</h3><p>${escape(f.a)}</p>`).join('')

const bodyHtml = `
<article id="erp-prerender">
  <header>
    <h1>${escape(ERP_META.h1)}</h1>
    <p class="erp-prerender__lead">${escape(HERO_LEAD)}</p>
    <p>${chipsHtml}</p>
  </header>
  <section id="formula">
    <h2>Лучшие практики + ваши процессы + своё сверху</h2>
    <ol>${formulaHtml}</ol>
  </section>
  <section id="kontury">
    <h2>Контуры ERP: что берём из практики и как подстраиваем</h2>
    <ul>${modulesHtml}</ul>
  </section>
  <section id="sravnenie">
    <h2>Коробка, заказная разработка или сборка под процесс</h2>
    ${compareHtml}
  </section>
  <section id="etapy">
    <h2>Как идёт проект и сколько стоит</h2>
    <ol>${processHtml}</ol>
  </section>
  <section id="pochitat">
    <h2>Почитать подробнее</h2>
    <ul>${READ_MORE.map((l) => `<li>${a(l.href, l.label)}</li>`).join('')}</ul>
    <p>Смежное: ${RELATED.map((l) => a(l.href, l.label)).join(' · ')}</p>
  </section>
  <section id="faq">
    <h2>Частые вопросы</h2>
    ${faqHtml}
  </section>
  <section id="zayavka">
    <h2>Обсудить вашу ERP</h2>
    <p>Форма заявки работает в JavaScript-версии страницы; без JS напишите в Telegram <a href="https://t.me/qdmadept">@qdmadept</a>.</p>
  </section>
</article>`

// ───────────────────────────────────────────────────────────────────────────
//  JSON-LD: WebPage + Service + FAQPage + BreadcrumbList.
// ───────────────────────────────────────────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: ERP_META.title,
      description: ERP_META.description,
      inLanguage: 'ru',
      isPartOf: { '@id': `${SITE}/#website` },
      publisher: { '@id': `${SITE}/#organization` },
      datePublished: ERP_META.publishedAt,
      dateModified: ERP_META.updatedAt,
      primaryImageOfPage: { '@id': `${canonical}#primaryimage` },
      mainEntity: { '@id': `${canonical}#service` },
      breadcrumb: { '@id': `${canonical}#breadcrumb` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: PUBLISHER,
      url: `${SITE}/`,
      logo: { '@type': 'ImageObject', url: `${SITE}/logos/integram-og.png` },
    },
    {
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: ERP_META.h1,
      serviceType: 'Разработка и внедрение ERP-системы',
      description: ERP_META.description,
      provider: { '@id': `${SITE}/#organization` },
      areaServed: 'RU',
      url: canonical,
    },
    {
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@type': 'ImageObject',
      '@id': `${canonical}#primaryimage`,
      url: ogImage,
      contentUrl: ogImage,
      width: 1200,
      height: 630,
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'ERP-система', item: canonical },
      ],
    },
  ],
}
const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(ERP_META.title)}" />`,
  `<meta property="og:description" content="${escape(ERP_META.description)}" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="${PUBLISHER}" />`,
  `<meta property="og:image" content="${escape(ogImage)}" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:image" content="${escape(ogImage)}" />`,
  `<meta name="twitter:title" content="${escape(ERP_META.title)}" />`,
  `<meta name="twitter:description" content="${escape(ERP_META.description)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

// ───────────────────────────────────────────────────────────────────────────
//  Write dist/erp-sistema.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-erp-sistema: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-erp-sistema: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(ERP_META.title)}</title>`)
  .replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escape(ERP_META.description)}" />`,
  )
  .replace(
    /<meta name="keywords"[^>]*>/,
    `<meta name="keywords" content="${escape(ERP_META.keywords)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

const outPath = resolve(dist, 'erp-sistema.html')
writeFileSync(outPath, html)
console.log(`✓ ERP page prerendered → dist/erp-sistema.html (${html.length} bytes)`)
