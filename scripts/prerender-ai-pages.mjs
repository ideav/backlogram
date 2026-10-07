#!/usr/bin/env node
/**
 * Post-build prerender for the «автоматизация бизнеса с ИИ» cluster (issue #642):
 * six landings from src/data/aiPages.mjs — the SAME source the React page
 * (src/pages/AiLanding.tsx) uses, so snapshot and live page never drift.
 *
 * The site is a client-side React SPA: dist/index.html ships an empty
 * <div id="root"></div>, so Yandex and no-JS clients would see an empty page.
 * For each slug this writes dist/<slug>.html with its own <title>/description,
 * canonical, OG/Twitter, JSON-LD (WebPage + FAQPage + BreadcrumbList) and a
 * static crawlable snapshot injected into #root. React replaces #root on boot.
 *
 * Must run BEFORE prerender-landing.mjs: it reads the still-clean
 * dist/index.html (prerender-landing overwrites the home page last).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AI_PAGES, AI_HUB, SITE, TRY_URL, PRICED_SERVICE_IDS } from '../src/data/aiPages.mjs'
import { SERVICES, formatPrice } from '../src/data/services.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = resolve(__dirname, '..', 'dist')
const PUBLISHER = 'Интеграм'

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

const PRERENDER_STYLE = `
<style>
  #ai-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #ai-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #ai-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #ai-prerender h3 { font-size: 1.05rem; margin: 1rem 0 0.25rem; }
  #ai-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #ai-prerender ul, #ai-prerender ol { margin: 0.5rem 0; padding-left: 1.2rem; }
  #ai-prerender li { line-height: 1.6; margin: 0.35rem 0; }
  #ai-prerender table { border-collapse: collapse; width: 100%; font-size: 0.92rem; margin: 0.75rem 0; }
  #ai-prerender th, #ai-prerender td { border: 1px solid #e2e8f0; padding: 0.5rem 0.65rem;
    text-align: left; vertical-align: top; line-height: 1.5; }
  #ai-prerender .ai-eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #ai-prerender .ai-hub-link { font-size: 0.9rem; font-weight: 600; margin: 0 0 0.75rem; }
  #ai-prerender .ai-lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #ai-prerender .ai-footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Dark colours follow the app theme (.dark on <html>) — NOT prefers-color-scheme (issue #325). */
  .dark #ai-prerender { color: #e2e8f0; }
  .dark #ai-prerender th, .dark #ai-prerender td { border-color: #1e293b; }
  .dark #ai-prerender .ai-lead, .dark #ai-prerender .ai-footer { color: #94a3b8; }
</style>`

const PRICED = PRICED_SERVICE_IDS.map((id) => SERVICES.find((s) => s.id === id)).filter(Boolean)

function sectionHtml(s) {
  const parts = [`<h2>${escape(s.h2)}</h2>`]
  if (s.intro) parts.push(`<p>${escape(s.intro)}</p>`)
  if (s.table) {
    const head = s.table.head.map((h) => `<th>${escape(h)}</th>`).join('')
    const rows = s.table.rows
      .map((r) => `<tr>${r.map((c) => `<td>${escape(c)}</td>`).join('')}</tr>`).join('')
    parts.push(`<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`)
  }
  if (s.items) {
    const tag = s.ordered ? 'ol' : 'ul'
    const lis = s.items.map((it) => `<li><strong>${escape(it.title)}.</strong> ${escape(it.body)}</li>`).join('')
    parts.push(`<${tag}>${lis}</${tag}>`)
  }
  if (s.pricing) {
    const lis = PRICED
      .map((p) => `<li><a href="/uslugi.html#${escape(p.id)}">${escape(p.name)}</a> — ${p.priceFrom ? 'от ' : ''}${escape(formatPrice(p.price))} ${escape(p.unit)}</li>`)
      .join('')
    parts.push(`<ul>${lis}</ul>`)
  }
  for (const p of s.paragraphs ?? []) parts.push(`<p>${escape(p)}</p>`)
  if (s.link) parts.push(`<p><a href="${escape(s.link.href)}">${escape(s.link.text)}</a></p>`)
  return `<section>${parts.join('\n  ')}</section>`
}

function write(slug, page, headTags, bodyHtml) {
  const source = readFileSync(resolve(dist, 'index.html'), 'utf8')
  if (source.includes('id="lp-prerender"')) {
    console.error(`✗ prerender-ai-pages (${slug}): dist/index.html already carries the landing snapshot — run BEFORE prerender-landing.mjs`)
    process.exit(1)
  }
  if (!source.includes('<div id="root"></div>')) {
    console.error(`✗ prerender-ai-pages (${slug}): <div id="root"></div> not found in dist/index.html`)
    process.exit(1)
  }
  const html = source
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(page.seoTitle)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(page.metaDescription)}" />`)
    .replace('</head>', `    ${headTags}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)
  writeFileSync(resolve(dist, `${slug}.html`), html)
  console.log(`✓ ai page prerendered → dist/${slug}.html (${html.length} bytes)`)
}

for (const page of AI_PAGES) {
  const canonical = `${SITE}/${page.slug}.html`
  const isHub = page.slug === AI_HUB.slug
  const ogImage = `${SITE}/og/${page.slug}.png`
  // #648: хаб → карточки всех разделов; раздел → ссылка на хаб наверху,
  // «Ещё по теме» — только соседние разделы (как в src/pages/AiLanding.tsx).
  const spokes = AI_PAGES.filter((p) => p.slug !== AI_HUB.slug)
  const related = spokes.filter((p) => p.slug !== page.slug)
    .map((p) => `<a href="/${p.slug}.html">${escape(p.navName)}</a>`).join(' · ')
  const hubLinkHtml = isHub ? ''
    : `<p class="ai-hub-link"><a href="/${AI_HUB.slug}.html">← ${escape(AI_HUB.navName)}: все разделы темы</a></p>`
  const spokesHtml = !isHub ? '' : `<nav aria-label="Разделы темы">
    <h2>Разделы темы</h2>
    <ul>${spokes.map((p) => `<li><a href="/${p.slug}.html">${escape(p.navName)}</a> — ${escape(p.ogDescription)}</li>`).join('')}</ul>
  </nav>`
  const faqHtml = page.faq
    .map((f) => `<section><h3>${escape(f.q)}</h3><p>${escape(f.a)}</p></section>`).join('')

  const bodyHtml = `
<article id="ai-prerender">
  <header>
    ${hubLinkHtml}
    <p class="ai-eyebrow">${escape(page.badge)}</p>
    <h1>${escape(`${page.h1} ${page.h1accent}`)}</h1>
    <p class="ai-lead">${escape(page.lead)}</p>
    <p><a href="${TRY_URL}">Проверить на своём Excel</a> · <a href="/uslugi.html#razbor-processa">Заказать разбор процесса</a></p>
  </header>
  ${spokesHtml}
  ${page.sections.map(sectionHtml).join('\n  ')}
  <h2>Частые вопросы</h2>
  ${faqHtml}
  ${page.sources ? `<p>${escape(page.sources)}</p>` : ''}
  <h2>Проверьте на своих данных</h2>
  <p>Загрузите Excel или выгрузку из учётной системы на <a href="${TRY_URL}">excel-to-app.ru</a> — ИИ-агент соберёт рабочее приложение, и все утверждения этой страницы можно проверить на своих таблицах.</p>
  <footer class="ai-footer">
    <p>Ещё по теме: ${related}</p>
    <p><a href="/">На главную</a> · <a href="/uslugi.html">Услуги и цены</a> · <a href="/agent-platforms.html">Платформы с ИИ-агентами</a></p>
  </footer>
</article>${PRERENDER_STYLE}`

  const crumbs = [{ name: 'Интеграм', item: `${SITE}/` }]
  if (!isHub) crumbs.push({ name: AI_HUB.navName, item: `${SITE}/${AI_HUB.slug}.html` })
  crumbs.push({ name: page.navName, item: canonical })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: page.ogTitle, description: page.ogDescription, inLanguage: 'ru', isPartOf: { '@id': `${SITE}/#website` }, publisher: { '@id': `${SITE}/#organization` } },
      { '@type': 'FAQPage', '@id': `${canonical}#faq`, mainEntity: page.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      {
        '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`,
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
      },
    ],
  }

  const headTags = [
    `<link rel="canonical" href="${escape(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escape(canonical)}" />`,
    `<meta property="og:title" content="${escape(page.ogTitle)}" />`,
    `<meta property="og:description" content="${escape(page.ogDescription)}" />`,
    `<meta property="og:image" content="${escape(ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="ru_RU" />`,
    `<meta property="og:site_name" content="${PUBLISHER}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(page.ogTitle)}" />`,
    `<meta name="twitter:description" content="${escape(page.ogDescription)}" />`,
    `<meta name="twitter:image" content="${escape(ogImage)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')

  write(page.slug, page, headTags, bodyHtml)
}

console.log(`✓ prerender-ai-pages: ${AI_PAGES.length} страниц кластера «ИИ для бизнеса» готовы`)
