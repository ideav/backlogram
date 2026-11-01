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
 * snapshot in #root with the full section content (#827). React replaces #root on boot.
 *
 * Must run BEFORE prerender-landing.mjs: it reads the still-clean
 * dist/index.html (prerender-landing overwrites the home page last).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE, SITE_SECTIONS, CLOUD_PLANS, CLOUD_NOTE, CONTACTS } from '../src/data/siteSections.mjs'
import { SERVICES, formatPrice } from '../src/data/services.mjs'
import { USE_CASES } from '../src/data/usecases.mjs'
import { HOME_CASE_SCREENSHOTS } from '../src/data/home-cases.mjs'

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
  #section-prerender figure { margin: 1rem 0; max-width: 42rem; }
  #section-prerender figure img { display: block; width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 0.75rem; }
  #section-prerender dt { font-weight: 700; margin-top: 1rem; }
  #section-prerender dd { margin: 0.25rem 0 0; line-height: 1.6; }
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

// Блоки страницы — те же типы, что рисует src/pages/SiteSection.tsx (#827).
const intro = (b) => (b.intro ? `<p>${escape(b.intro)}</p>` : '')
const more = (b) => (b.more ? `<p>${link(b.more)}</p>` : '')
const itemLi = (it) =>
  `<li><strong>${it.href && !it.linkText ? link({ href: it.href, title: it.title }) : escape(it.title)}</strong> — ${escape(it.text)}${
    it.href && it.linkText ? ` ${link({ href: it.href, title: it.linkText })}` : ''
  }</li>`
const NL = '\n    '
const plainList = (xs) => `<ul>${xs.map((x) => `<li>${escape(x)}</li>`).join('')}</ul>`

function renderBlock(b) {
  let body = ''
  switch (b.type) {
    case 'features':
      body = `<ul>${b.items.map(itemLi).join('')}</ul>${b.note ? `<p>${escape(b.note)}</p>` : ''}`
      break
    case 'steps':
      body = `<ol>${b.steps.map((st) => `<li><strong>${escape(st.title)}</strong> — ${escape(st.text)}</li>`).join('')}</ol>${b.result ? `<p>${escape(b.result)}</p>` : ''}`
      break
    case 'cases':
      // Скриншоты кейсов (#557): alt и размеры — из общего с React источника.
      // loading="lazy": снапшот заменяется React'ом, без lazy каждый посетитель
      // тянул бы картинки до загрузки бандла.
      body = b.cases.map((c) => {
        const shot = HOME_CASE_SCREENSHOTS[c.shot]
        return `<article class="section-case">
      <h3>${escape(c.title)}</h3>
      <p>${escape(c.context)}</p>
      <p><strong>Было:</strong> ${escape(c.before)}</p>
      <p><strong>Стало:</strong> ${escape(c.after)}</p>
      <p><strong>Задача:</strong> ${escape(c.task)}</p>
      <p><strong>Реализация:</strong> ${escape(c.impl)}</p>
      <p>${c.stats.map((st) => `${escape(st.v)} ${escape(st.l)}`).join(' · ')}</p>
      <figure><img src="/${escape(shot.file)}" alt="${escape(shot.alt)}" width="${shot.width}" height="${shot.height}" loading="lazy" decoding="async" /><figcaption>${escape(shot.caption)}</figcaption></figure>
      <p>${link({ href: c.href, title: c.linkText })}</p>
    </article>`
      }).join(NL)
      break
    case 'industries':
      body = `<p>${b.tags.map(escape).join(' · ')}</p><ul>${b.items.map(itemLi).join('')}</ul>`
      break
    case 'usecases':
      body = `<ul>${USE_CASES.map((u) => itemLi({ title: u.badge.replace(/ на Интеграме$/, ''), text: u.example, href: `/${u.slug}.html` })).join('')}</ul>`
      break
    case 'pricing': {
      const priced = (b.services ?? []).map((id) => SERVICES.find((x) => x.id === id)).filter(Boolean)
      body = priced.map((sv) => `<h3>${escape(sv.name)} — ${sv.priceFrom ? 'от ' : ''}${escape(formatPrice(sv.price))} ${escape(sv.unit)}</h3>
    <p>${escape(sv.description)}</p>${plainList(sv.features)}
    <p>${link({ href: b.ctaHref ?? sv.url, title: sv.cta })}</p>`).join(NL)
      if (b.cloud) {
        body += `<p><strong>Облачные тарифы.</strong> ${escape(CLOUD_NOTE)}</p>` + CLOUD_PLANS.map((pl) => `<h3>${escape(pl.name)} — ${escape(pl.price)} ${escape(pl.unit)}</h3>
    <p>${escape(pl.note)}</p>${plainList(pl.items)}
    <p>${link(pl.cta)}</p>`).join(NL)
      }
      break
    }
    case 'form':
      // Форму рисует React; без JS — контакты и ссылка на ту же форму главной.
      body = `<p>Telegram: <a href="${escape(CONTACTS.telegram.href)}">${escape(CONTACTS.telegram.label)}</a> · Email: <a href="${escape(CONTACTS.email.href)}">${escape(CONTACTS.email.label)}</a> · <a href="/#cta">Форма заявки</a></p>`
      break
    case 'links':
      body = `<ul>${b.links.map((l) => `<li>${link(l)} — ${escape(l.body)}</li>`).join('')}</ul>`
      break
  }
  return `<section id="${escape(b.id)}">
    <h2>${escape(b.h2)}</h2>
    ${intro(b)}
    ${body}
    ${more(b)}
  </section>`
}

for (const page of SITE_SECTIONS) {
  const canonical = `${SITE}/${page.slug}.html`
  const others = SITE_SECTIONS.filter((s) => s.slug !== page.slug)
  const hasForm = page.blocks.some((b) => b.type === 'form')

  const blocksHtml = page.blocks.map(renderBlock).join(NL)
  const faqHtml = `<dl>${page.faq.map((f) => `<dt>${escape(f.q)}</dt><dd>${escape(f.a)}</dd>`).join('')}</dl>`

  const bodyHtml = `
<article id="section-prerender">
  <header>
    <p class="section-eyebrow">${escape(page.badge)}</p>
    <h1>${escape(`${page.h1} ${page.h1accent}`)}</h1>
    <p class="section-lead">${escape(page.lead)}</p>
    <p>${link(page.cta)} · ${link(page.cta2)}</p>
  </header>
  ${blocksHtml}
  <section id="faq">
    <h2>Частые вопросы</h2>
    ${faqHtml}
  </section>
  ${hasForm ? '' : `<h2>${escape(page.cta.text)}</h2>
  <p>${escape(page.ogDescription)} ${link(page.cta)}</p>`}
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
