#!/usr/bin/env node
/**
 * Post-build prerender for the 11 use-case landings (issue #431) and the hub
 * page /resheniya.html. Content comes from src/data/usecases.mjs — the SAME
 * source the React pages use, so snapshot and live page never drift.
 *
 * Like the other tool-page prerenders, the site is a client-side React SPA: the
 * built dist/index.html ships an empty <div id="root"></div>, so crawlers
 * (especially Yandex), social-preview bots and no-JS clients would otherwise see
 * an empty page. For each slug this writes a sibling dist/<slug>.html with a
 * tightened <title>/description, canonical, OG/Twitter, JSON-LD and a static
 * crawlable snapshot injected into #root. React replaces #root on boot.
 *
 * Must run AFTER prerender-knowledge-base.mjs and BEFORE prerender-landing.mjs:
 * it reads the still-clean dist/index.html (prerender-landing overwrites the
 * home page last, injecting its own #lp-prerender content into #root).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { USE_CASES, HUB, SITE } from '../src/data/usecases.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const PUBLISHER = 'Интеграм'
const OG_IMAGE = `${SITE}/og/knowledge-base.png`

// Натуральные размеры скриншотов (для og:image:width/height и атрибутов img).
const IMG_SIZE = {
  '/uc-zayavki.png': { w: 1672, h: 941 },
  '/uc-proekty.png': { w: 1536, h: 1024 },
  '/uc-proizvodstvo.png': { w: 1536, h: 1024 },
  '/uc-sklad.png': { w: 1536, h: 1024 },
  '/uc-zakupki.jpg': { w: 1536, h: 1024 },
  '/uc-finansy.png': { w: 1536, h: 1024 },
  '/uc-kadry.png': { w: 1536, h: 1024 },
  '/uc-crm.png': { w: 1536, h: 1024 },
  '/uc-dogovory.png': { w: 1536, h: 1024 },
  '/uc-otchetnost.png': { w: 1536, h: 1024 },
  '/uc-dvizhenie-tmc.png': { w: 1520, h: 916 },
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

const PRERENDER_STYLE = `
<style>
  #uc-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #uc-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #uc-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #uc-prerender h3 { font-size: 1.1rem; margin: 1.5rem 0 0.25rem; }
  #uc-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #uc-prerender ul { margin: 0.5rem 0; padding-left: 1.2rem; }
  #uc-prerender li { line-height: 1.6; margin: 0.35rem 0; }
  #uc-prerender .uc-eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #uc-prerender .uc-lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #uc-prerender .uc-footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  #uc-prerender .uc-figure { margin: 2rem 0 0; }
  #uc-prerender .uc-figure img { width: 100%; height: auto; display: block;
    border-radius: 1rem; border: 1px solid #e2e8f0; }
  #uc-prerender .uc-figure figcaption { margin-top: 0.6rem; text-align: center;
    font-size: 0.85rem; color: #94a3b8; }
  .dark #uc-prerender .uc-figure img { border-color: #1e293b; }
  /* Dark colours follow the app theme (.dark on <html>) — NOT prefers-color-scheme (issue #325). */
  .dark #uc-prerender { color: #e2e8f0; }
  .dark #uc-prerender .uc-lead, .dark #uc-prerender .uc-footer { color: #94a3b8; }
</style>`

function headTagsFor({ canonical, seoTitle, metaDescription, ogTitle, ogDescription, jsonLd, ogImage = OG_IMAGE, ogImageW = 1200, ogImageH = 630 }) {
  const tags = [
    `<link rel="canonical" href="${escape(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escape(canonical)}" />`,
    `<meta property="og:title" content="${escape(ogTitle)}" />`,
    `<meta property="og:description" content="${escape(ogDescription)}" />`,
    `<meta property="og:image" content="${escape(ogImage)}" />`,
    `<meta property="og:image:width" content="${ogImageW}" />`,
    `<meta property="og:image:height" content="${ogImageH}" />`,
    `<meta property="og:locale" content="ru_RU" />`,
    `<meta property="og:site_name" content="${PUBLISHER}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(ogTitle)}" />`,
    `<meta name="twitter:description" content="${escape(ogDescription)}" />`,
    `<meta name="twitter:image" content="${escape(ogImage)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
  return { tags, seoTitle, metaDescription }
}

function write(slug, seoTitle, metaDescription, headTags, bodyHtml) {
  const source = readFileSync(resolve(dist, 'index.html'), 'utf8')
  if (source.includes('id="lp-prerender"')) {
    console.error(`✗ prerender-usecases (${slug}): dist/index.html already carries the landing snapshot — run BEFORE prerender-landing.mjs`)
    process.exit(1)
  }
  if (!source.includes('<div id="root"></div>')) {
    console.error(`✗ prerender-usecases (${slug}): <div id="root"></div> not found in dist/index.html`)
    process.exit(1)
  }
  const html = source
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(seoTitle)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(metaDescription)}" />`)
    .replace('</head>', `    ${headTags}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)
  const outPath = resolve(dist, `${slug}.html`)
  writeFileSync(outPath, html)
  console.log(`✓ usecase prerendered → dist/${slug}.html (${html.length} bytes)`)
}

// ── 11 тематических лендингов ────────────────────────────────────────────────
for (const uc of USE_CASES) {
  const canonical = `${SITE}/${uc.slug}.html`
  const painsHtml = uc.pains
    .map((p) => `<li><strong>${escape(p.pain)}</strong> → ${escape(p.solution)}</li>`).join('')
  const featuresHtml = uc.features
    .map((f) => `<section><h3>${escape(f.title)}</h3><p>${escape(f.body)}</p></section>`).join('')
  const faqHtml = uc.faq
    .map((f) => `<section><h3>${escape(f.q)}</h3><p>${escape(f.a)}</p></section>`).join('')
  const others = USE_CASES.filter((o) => o.slug !== uc.slug).slice(0, 3)
  const otherLinks = others
    .map((o) => `<a href="/${o.slug}.html">${escape(o.badge)}</a>`).join(' · ')
  // Перекрёстная ссылка на сравнительную страницу — только со страницы CRM (issue #4259)
  const relatedExtra = uc.slug === 'crm-uchet-klientov'
    ? '<a href="/sravnenie-s-bitrix-amocrm.html">Сравнение с Битрикс24 и AmoCRM</a> · '
    : ''

  const bodyHtml = `
<article id="uc-prerender" itemscope itemtype="https://schema.org/Service">
  <header>
    <p class="uc-eyebrow">${escape(uc.badge)}</p>
    <h1 itemprop="name">${escape(`${uc.h1} ${uc.h1accent}`)}</h1>
    <p class="uc-lead" itemprop="description">${escape(uc.lead)}</p>
    <figure class="uc-figure">
      <img src="${escape(uc.image)}" alt="${escape(uc.imageAlt)}" width="${IMG_SIZE[uc.image]?.w ?? ''}" height="${IMG_SIZE[uc.image]?.h ?? ''}" loading="lazy" itemprop="image" />
      <figcaption>Пример приложения на платформе Интеграм</figcaption>
    </figure>
  </header>
  <h2>Excel перестал справляться — что меняется</h2>
  <ul>${painsHtml}</ul>
  <p>${escape(uc.example)}</p>
  <h2>Что вы получаете</h2>
  ${featuresHtml}
  <h2>Частые вопросы</h2>
  ${faqHtml}
  <footer class="uc-footer">
    <p>
      ${relatedExtra}<a href="/${uc.slug}.html#zayavka">Заказать демо</a> ·
      <a href="/resheniya.html">Все решения вместо Excel</a> ·
      <a href="/">На главную</a> · ${otherLinks}
    </p>
  </footer>
</article>${PRERENDER_STYLE}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: uc.ogTitle, description: uc.ogDescription, inLanguage: 'ru', isPartOf: { '@id': `${SITE}/#website` } },
      { '@type': 'Service', '@id': `${canonical}#service`, name: uc.badge, serviceType: uc.seoTitle, provider: { '@id': `${SITE}/#organization` }, areaServed: 'RU', url: canonical, description: uc.ogDescription },
      { '@type': 'FAQPage', '@id': `${canonical}#faq`, mainEntity: uc.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      {
        '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Решения', item: `${SITE}/resheniya.html` },
          { '@type': 'ListItem', position: 3, name: uc.badge.replace(/\s+на Интеграме$/, ''), item: canonical },
        ],
      },
    ],
  }
  const sz = IMG_SIZE[uc.image] ?? { w: 1200, h: 630 }
  const { tags, seoTitle, metaDescription } = headTagsFor({
    canonical, seoTitle: uc.seoTitle, metaDescription: uc.metaDescription,
    ogTitle: uc.ogTitle, ogDescription: uc.ogDescription, jsonLd,
    ogImage: `${SITE}${uc.image}`, ogImageW: sz.w, ogImageH: sz.h,
  })
  write(uc.slug, seoTitle, metaDescription, tags, bodyHtml)
}

// ── Хаб /resheniya.html ──────────────────────────────────────────────────────
{
  const canonical = `${SITE}/${HUB.slug}.html`
  const cardsHtml = USE_CASES
    .map((u) => `<li><a href="/${u.slug}.html">${escape(u.badge)}</a> — ${escape(u.lead)}</li>`).join('')
  const bodyHtml = `
<article id="uc-prerender">
  <header>
    <p class="uc-eyebrow">Интеграм — платформа без программирования</p>
    <h1>${escape(`${HUB.h1} ${HUB.h1accent}`)}</h1>
    <p class="uc-lead">${escape(HUB.lead)}</p>
  </header>
  <h2>Решения по задачам</h2>
  <ul>${cardsHtml}</ul>
  <footer class="uc-footer">
    <p><a href="/">На главную</a> · <a href="/knowledge-base.html">База знаний</a></p>
  </footer>
</article>${PRERENDER_STYLE}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: HUB.ogTitle, description: HUB.ogDescription, inLanguage: 'ru', isPartOf: { '@id': `${SITE}/#website` } },
      {
        '@type': 'ItemList', '@id': `${canonical}#list`,
        itemListElement: USE_CASES.map((u, i) => ({
          '@type': 'ListItem', position: i + 1, name: u.badge, url: `${SITE}/${u.slug}.html`,
        })),
      },
      {
        '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Решения', item: canonical },
        ],
      },
    ],
  }
  const { tags, seoTitle, metaDescription } = headTagsFor({
    canonical, seoTitle: HUB.seoTitle, metaDescription: HUB.metaDescription,
    ogTitle: HUB.ogTitle, ogDescription: HUB.ogDescription, jsonLd,
  })
  write(HUB.slug, seoTitle, metaDescription, tags, bodyHtml)
}

console.log(`✓ prerender-usecases: ${USE_CASES.length} лендингов + хаб готовы`)
