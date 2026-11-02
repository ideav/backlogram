#!/usr/bin/env node
/**
 * Post-build prerender для «Партнёрам» (/partners.html, issue #843).
 *
 * Сайт — client-side React SPA с пустым <div id="root"></div>; краулеры видят
 * сырой HTML. Скрипт пишет dist/partners.html со статическим снапшотом всех
 * разделов страницы, meta/OG и JSON-LD (WebPage + BreadcrumbList).
 *
 * Данные — src/data/partners.mjs (общий источник с src/pages/Partners.tsx).
 *
 * Must run AFTER vite build and BEFORE prerender-landing.mjs: читает ещё
 * чистый dist/index.html.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  PARTNERS_META,
  HERO_LEAD,
  DECKS,
  FIRST_TEMPLATE,
  AUDIENCE,
  STEPS,
  LEVELS,
  MONEY,
  BOUNDARY,
  NO_PROMISES,
  OWN_TEMPLATE,
  JOIN,
  DIRECT,
} from '../src/data/partners.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = resolve(__dirname, '..', 'dist')
const SITE = 'https://ideav.ru'
const canonical = `${SITE}${PARTNERS_META.path}`
const ogImage = `${SITE}/og/partners.png`

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

const cards = (list) => `
    <ul class="pt-prerender__cards">${list.map((c) => `
      <li>${c.n ? `<p class="pt-prerender__n">${escape(c.n)}</p>` : ''}<h3>${escape(c.h)}</h3>${c.big ? `<p class="pt-prerender__big">${escape(c.big)}</p>` : ''}<p>${escape(c.p)}</p></li>`).join('')}
    </ul>`

const note = (s) => (s ? `\n    <p class="pt-prerender__note">${escape(s)}</p>` : '')

const bodyHtml = `
<article id="pt-prerender">
  <header>
    <p class="pt-prerender__eyebrow">Партнёрская программа</p>
    <h1>${escape(PARTNERS_META.h1)}</h1>
    <p class="pt-prerender__lead">${escape(HERO_LEAD)}</p>
    <p>${DECKS.map((d) => `<a href="${escape(d.href)}">${escape(d.label)}</a>`).join(' · ')}</p>
  </header>
  <section id="shablon">
    <h2>${escape(FIRST_TEMPLATE.h)}</h2>
    <p>${escape(FIRST_TEMPLATE.p)}</p>
    <pre>${FIRST_TEMPLATE.example.map((r) => `${escape(r.label.padEnd(8, ' '))} → ${escape(r.text)}`).join('\n')}</pre>${cards(FIRST_TEMPLATE.cards)}
  </section>
  <section id="komu">
    <h2>${escape(AUDIENCE.h)}</h2>
    <p>${escape(AUDIENCE.p)}</p>${cards(AUDIENCE.cards)}${note(AUDIENCE.note)}
  </section>
  <section id="vnedrenie">
    <h2>${escape(STEPS.h)}</h2>
    <ol>${STEPS.items.map((s) => `<li>${escape(s.p)} — <em>${escape(s.who)}</em></li>`).join('')}</ol>${note(STEPS.note)}
  </section>
  <section id="urovni">
    <h2>${escape(LEVELS.h)}</h2>${cards(LEVELS.cards)}
  </section>
  <section id="zarabotok">
    <h2>${escape(MONEY.h)}</h2>${cards(MONEY.cards)}${note(MONEY.note)}
  </section>
  <section id="granica">
    <h2>${escape(BOUNDARY.h)}</h2>
    <p>${escape(BOUNDARY.p)}</p>
    ${[BOUNDARY.self, BOUNDARY.us].map((col) => `<h3>${escape(col.h)}</h3><ul>${col.items.map((it) => `<li>${escape(it)}</li>`).join('')}</ul>`).join('\n    ')}${note(BOUNDARY.note)}
  </section>
  <section id="ne-obeshchaem">
    <h2>${escape(NO_PROMISES.h)}</h2>${cards(NO_PROMISES.cards)}
  </section>
  <section id="svoj-shablon">
    <h2>${escape(OWN_TEMPLATE.h)}</h2>
    <p>${escape(OWN_TEMPLATE.before)}<a href="${escape(OWN_TEMPLATE.link.href)}">${escape(OWN_TEMPLATE.link.label)}</a>${escape(OWN_TEMPLATE.after)}</p>${note(OWN_TEMPLATE.note)}
  </section>
  <section id="zayavka">
    <h2>${escape(JOIN.h)}</h2>
    <p>${escape(JOIN.p)}</p>
    <p>Телеграм <a href="https://t.me/${escape(DIRECT.telegram)}">@${escape(DIRECT.telegram)}</a>, телефон <a href="tel:${escape(DIRECT.phoneHref)}">${escape(DIRECT.phone)}</a> ${escape(DIRECT.hours)}.</p>
  </section>
  <footer class="pt-prerender__footer">
    <p>
      <a href="/shablony-reshenij.html">Шаблоны решений</a> ·
      <a href="/catalog-matching.html">Сопоставление каталогов</a> ·
      <a href="/uslugi.html">Услуги и цены</a> ·
      <a href="/">На главную</a>
    </p>
  </footer>
</article>
<style>
  #pt-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #pt-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #pt-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #pt-prerender h3 { font-size: 1.1rem; margin: 1rem 0 0.25rem; }
  #pt-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #pt-prerender ul, #pt-prerender ol { line-height: 1.7; margin: 0.5rem 0; padding-left: 1.2rem; }
  #pt-prerender pre { white-space: pre-wrap; background: #f1f5f9; padding: 1rem; border-radius: 0.75rem; }
  #pt-prerender .pt-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #pt-prerender .pt-prerender__lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #pt-prerender .pt-prerender__big { font-size: 2rem; font-weight: 800; color: #2563eb; margin: 0; }
  #pt-prerender .pt-prerender__n { font-size: 0.85rem; color: #2563eb; font-weight: 600; margin: 0; }
  #pt-prerender .pt-prerender__note, #pt-prerender .pt-prerender__footer { color: #475569; }
  #pt-prerender .pt-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; }
  /* Dark colours follow the app theme (.dark on <html>), NOT prefers-color-scheme. */
  .dark #pt-prerender { color: #e2e8f0; }
  .dark #pt-prerender pre { background: #0f172a; }
  .dark #pt-prerender .pt-prerender__lead, .dark #pt-prerender .pt-prerender__note,
  .dark #pt-prerender .pt-prerender__footer { color: #94a3b8; }
</style>`

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: PARTNERS_META.title,
      description: PARTNERS_META.description,
      inLanguage: 'ru',
      datePublished: PARTNERS_META.publishedAt,
      dateModified: PARTNERS_META.updatedAt,
      isPartOf: { '@id': `${SITE}/#website` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Партнёрам', item: canonical },
      ],
    },
  ],
}

const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta name="keywords" content="${escape(PARTNERS_META.keywords)}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(PARTNERS_META.title)}" />`,
  `<meta property="og:description" content="${escape(PARTNERS_META.description)}" />`,
  `<meta property="og:image" content="${escape(ogImage)}" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="Интеграм" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${escape(PARTNERS_META.title)}" />`,
  `<meta name="twitter:description" content="${escape(PARTNERS_META.description)}" />`,
  `<meta name="twitter:image" content="${escape(ogImage)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error('✗ prerender-partners: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs')
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-partners: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(PARTNERS_META.title)}</title>`)
  .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(PARTNERS_META.description)}" />`)
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

writeFileSync(resolve(dist, 'partners.html'), html)
console.log(`✓ partners prerendered → dist/partners.html (${html.length} bytes)`)
