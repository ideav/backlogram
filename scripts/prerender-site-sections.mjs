#!/usr/bin/env node
/**
 * Post-build prerender for the three main site sections (issue #823):
 * /zamena-excel.html, /avtomatizaciya-biznesa.html, /razrabotchikam.html —
 * from src/data/siteSections.mjs, the SAME source as src/pages/SiteSection.tsx
 * and the route cards on the home page.
 *
 * Ads lead straight into a section, and Yandex (ad moderation and search) reads
 * the raw HTML, so each section gets its own title/description, canonical,
 * OG/Twitter, JSON-LD (WebPage + FAQPage + BreadcrumbList) and a static
 * snapshot in #root. React replaces #root on boot.
 *
 * Must run BEFORE prerender-landing.mjs: it reads the still-clean
 * dist/index.html (prerender-landing overwrites the home page last).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE, SITE_SECTIONS } from '../src/data/siteSections.mjs'
import { SERVICES, formatPrice } from '../src/data/services.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = resolve(__dirname, '..', 'dist')
const PUBLISHER = 'Интеграм'
const OG_IMAGE = `${SITE}/og/home.png`

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

const PRERENDER_STYLE = `
<style>
  #section-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #section-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #section-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #section-prerender h3 { font-size: 1.05rem; margin: 1rem 0 0.25rem; }
  #section-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #section-prerender ul { margin: 0.5rem 0; padding-left: 1.2rem; }
  #section-prerender li { line-height: 1.6; margin: 0.35rem 0; }
  #section-prerender .section-eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #section-prerender .section-lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #section-prerender .section-footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Dark colours follow the app theme (.dark on <html>) — NOT prefers-color-scheme (issue #325). */
  .dark #section-prerender { color: #e2e8f0; }
  .dark #section-prerender .section-lead, .dark #section-prerender .section-footer { color: #94a3b8; }
</style>`

const link = (l) => `<a href="${escape(l.href)}"${l.external ? ' rel="noopener"' : ''}>${escape(l.title ?? l.text)}</a>`

function write(slug, page, headTags, bodyHtml) {
  const source = readFileSync(resolve(dist, 'index.html'), 'utf8')
  if (source.includes('id="lp-prerender"')) {
    console.error(`✗ prerender-site-sections (${slug}): dist/index.html already carries the landing snapshot — run BEFORE prerender-landing.mjs`)
    process.exit(1)
  }
  if (!source.includes('<div id="root"></div>')) {
    console.error(`✗ prerender-site-sections (${slug}): <div id="root"></div> not found in dist/index.html`)
    process.exit(1)
  }
  const html = source
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(page.seoTitle)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(page.metaDescription)}" />`)
    .replace('</head>', `    ${headTags}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)
  writeFileSync(resolve(dist, `${slug}.html`), html)
  console.log(`✓ site section prerendered → dist/${slug}.html (${html.length} bytes)`)
}

for (const page of SITE_SECTIONS) {
  const canonical = `${SITE}/${page.slug}.html`
  const priced = (page.pricing ?? []).map((id) => SERVICES.find((s) => s.id === id)).filter(Boolean)
  const others = SITE_SECTIONS.filter((s) => s.slug !== page.slug)

  const blocksHtml = page.blocks.map((b) => `<section>
    <h2>${escape(b.h2)}</h2>
    <p>${escape(b.intro)}</p>
    <ul>${b.links.map((l) => `<li>${link(l)} — ${escape(l.body)}</li>`).join('')}</ul>
  </section>`).join('\n  ')
  const pricingHtml = priced.length === 0 ? '' : `<section>
    <h2>Стоимость</h2>
    ${page.pricingIntro ? `<p>${escape(page.pricingIntro)}</p>` : ''}
    <ul>${priced.map((p) => `<li><a href="/uslugi.html#${escape(p.id)}">${escape(p.name)}</a> — ${p.priceFrom ? 'от ' : ''}${escape(formatPrice(p.price))} ${escape(p.unit)}</li>`).join('')}</ul>
  </section>`
  const faqHtml = page.faq
    .map((f) => `<section><h3>${escape(f.q)}</h3><p>${escape(f.a)}</p></section>`).join('')

  const bodyHtml = `
<article id="section-prerender">
  <header>
    <p class="section-eyebrow">${escape(page.badge)}</p>
    <h1>${escape(`${page.h1} ${page.h1accent}`)}</h1>
    <p class="section-lead">${escape(page.lead)}</p>
    <p>${link(page.cta)} · ${link(page.cta2)}</p>
  </header>
  ${blocksHtml}
  ${pricingHtml}
  <h2>Частые вопросы</h2>
  ${faqHtml}
  <h2>${escape(page.cta.text)}</h2>
  <p>${escape(page.ogDescription)} ${link(page.cta)}</p>
  <footer class="section-footer">
    <nav aria-label="Другие разделы">
      <p>Другие разделы сайта: ${others.map((s) => `<a href="/${s.slug}.html">${escape(s.choice)}</a>`).join(' · ')}</p>
    </nav>
    <p><a href="/">На главную</a> · <a href="/uslugi.html">Услуги и цены</a></p>
  </footer>
</article>${PRERENDER_STYLE}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: page.ogTitle, description: page.ogDescription, inLanguage: 'ru', isPartOf: { '@id': `${SITE}/#website` }, publisher: { '@id': `${SITE}/#organization` } },
      { '@type': 'FAQPage', '@id': `${canonical}#faq`, mainEntity: page.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      {
        '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: page.navName, item: canonical },
        ],
      },
    ],
  }

  const headTags = [
    `<link rel="canonical" href="${escape(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escape(canonical)}" />`,
    `<meta property="og:title" content="${escape(page.ogTitle)}" />`,
    `<meta property="og:description" content="${escape(page.ogDescription)}" />`,
    `<meta property="og:image" content="${escape(OG_IMAGE)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="ru_RU" />`,
    `<meta property="og:site_name" content="${PUBLISHER}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(page.ogTitle)}" />`,
    `<meta name="twitter:description" content="${escape(page.ogDescription)}" />`,
    `<meta name="twitter:image" content="${escape(OG_IMAGE)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')

  write(page.slug, page, headTags, bodyHtml)
}

console.log(`✓ prerender-site-sections: ${SITE_SECTIONS.length} основных раздела сайта готовы`)
