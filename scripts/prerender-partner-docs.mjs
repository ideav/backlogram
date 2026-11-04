#!/usr/bin/env node
/**
 * Post-build prerender документов партнёрской программы (ideav/courses#3):
 *   dist/partner-offer.html, dist/adept-offer.html, dist/partner-adept.html.
 *
 * Схема та же, что у prerender-privacy.mjs: берём чистый dist/index.html как
 * шаблон и пишем рядом страницу с title, description, canonical, OG/Twitter,
 * JSON-LD и полным текстом документа в #root — оферта обязана быть в
 * HTTP-ответе, а не появляться только после запуска React.
 *
 * Текст — из src/data/partner-docs.mjs, общего источника с
 * src/pages/PartnerDoc.tsx.
 *
 * Запускать ПОСЛЕ prerender-knowledge-base.mjs и ДО prerender-landing.mjs.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PARTNER_DOCS, PARTNER_DOCS_OPERATOR as OP } from '../src/data/partner-docs.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = resolve(__dirname, '..', 'dist')
const SITE = 'https://ideav.ru'

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

function para(block) {
  const text = escape(block.p)
  if (!block.link || !block.p.includes('{link}')) return text
  return text.replace(
    '{link}',
    `<a href="${escape(block.link.href)}">${escape(block.link.text)}</a>`,
  )
}

const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')
if (source.includes('id="lp-prerender"')) {
  console.error('✗ prerender-partner-docs: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs')
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-partner-docs: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

for (const doc of Object.values(PARTNER_DOCS)) {
  const m = doc.meta
  const canonical = `${SITE}${m.path}`

  const sectionsHtml = doc.sections.map((section) => {
    const blocks = section.blocks
      .map((block) =>
        block.list
          ? `<ul>${block.list.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>`
          : `<p>${para(block)}</p>`,
      )
      .join('\n    ')
    return `
  <section class="pd-prerender__group">
    <h2 id="${escape(section.id)}">${escape(section.h)}</h2>
    ${blocks}
  </section>`
  }).join('')

  const bodyHtml = `
<article id="pd-prerender" itemscope itemtype="https://schema.org/WebPage">
  <header>
    <nav class="pd-prerender__crumbs" aria-label="Хлебные крошки">
      <a href="/">Интеграм</a> / <a href="/partners.html">Партнёрам</a> / <span>${escape(m.crumb)}</span>
    </nav>
    <p class="pd-prerender__eyebrow">${escape(m.eyebrow)}</p>
    <h1 itemprop="headline">${escape(m.h1)}</h1>
    <p class="pd-prerender__date">Редакция от <time datetime="${escape(m.updatedISO)}">${escape(m.updated)}</time></p>
    <p class="pd-prerender__lead" itemprop="description">${escape(doc.intro)}</p>
  </header>
  ${sectionsHtml}
  <section class="pd-prerender__group">
    <h2 id="rekvizity">Реквизиты и контакты</h2>
    <p><strong>${escape(OP.name)}</strong></p>
    <ul>
      <li>ИНН: ${escape(OP.inn)}</li>
      <li>ОГРН: ${escape(OP.ogrn)}</li>
      <li>Электронная почта: <a href="mailto:${escape(OP.email)}">${escape(OP.email)}</a></li>
      <li>Телефон: <a href="tel:${escape(OP.phoneHref)}">${escape(OP.phone)}</a></li>
    </ul>
  </section>
  <footer class="pd-prerender__footer">
    <p>
      <a href="/partner-adept.html">Как работают партнёры и адепты</a> ·
      <a href="/partner-offer.html">Оферта партнёрской программы</a> ·
      <a href="/adept-offer.html">Оферта для адептов</a> ·
      <a href="/partners.html">Партнёрам</a>
    </p>
  </footer>
</article>
<style>
  #pd-prerender { max-width: 56rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #pd-prerender h1 { font-size: 2.2rem; line-height: 1.15; margin: 0.5rem 0 0.75rem; }
  #pd-prerender h2 { font-size: 1.25rem; margin: 2.25rem 0 0.5rem; }
  #pd-prerender p  { line-height: 1.65; margin: 0.5rem 0; }
  #pd-prerender ul { line-height: 1.7; margin: 0.5rem 0; padding-left: 1.2rem; }
  #pd-prerender a  { color: #2563eb; }
  #pd-prerender .pd-prerender__crumbs { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1rem; }
  #pd-prerender .pd-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #pd-prerender .pd-prerender__date { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1rem; }
  #pd-prerender .pd-prerender__lead { font-size: 1.05rem; color: #475569; max-width: 50rem; }
  #pd-prerender .pd-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  .dark #pd-prerender { color: #e2e8f0; }
  .dark #pd-prerender .pd-prerender__lead, .dark #pd-prerender .pd-prerender__footer { color: #94a3b8; }
</style>`

  const ogImage = `${SITE}/og/knowledge-base.png`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: m.title,
        description: m.description,
        inLanguage: 'ru',
        dateModified: m.updatedISO,
        isPartOf: { '@id': `${SITE}/#website` },
        publisher: { '@id': `${SITE}/#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Партнёрам', item: `${SITE}/partners.html` },
          { '@type': 'ListItem', position: 3, name: m.crumb, item: canonical },
        ],
      },
    ],
  }

  const headTags = [
    `<link rel="canonical" href="${escape(canonical)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:url" content="${escape(canonical)}" />`,
    `<meta property="og:title" content="${escape(m.title)}" />`,
    `<meta property="og:description" content="${escape(m.description)}" />`,
    `<meta property="og:image" content="${escape(ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="ru_RU" />`,
    `<meta property="og:site_name" content="Интеграм" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(m.title)}" />`,
    `<meta name="twitter:description" content="${escape(m.description)}" />`,
    `<meta name="twitter:image" content="${escape(ogImage)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')

  const html = source
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(m.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(m.description)}" />`)
    .replace(/<meta name="keywords"[^>]*>/, `<meta name="keywords" content="${escape(m.keywords)}" />`)
    .replace('</head>', `    ${headTags}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

  const file = m.path.replace(/^\//, '')
  writeFileSync(resolve(dist, file), html)
  console.log(`✓ ${doc.key} prerendered → dist/${file} (${html.length} bytes)`)
}
