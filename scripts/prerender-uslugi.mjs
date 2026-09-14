#!/usr/bin/env node
/**
 * Post-build prerender for the «Услуги и цены» page (/uslugi.html, issue #578).
 *
 * Зачем: Яндекс.Вебмастер не считал ideav.ru интернет-магазином или сайтом
 * услуг, поэтому у сайта не было рейтинга в Поиске. Классификатор Яндекса
 * смотрит на сырой HTML (без JS), а сайт — client-side React SPA с пустым
 * <div id="root"></div>. Этот скрипт пишет dist/uslugi.html со статическим
 * каталогом услуг: цены в рублях, кнопки заказа, порядок оплаты, реквизиты
 * продавца — и JSON-LD (ItemList → Service → Offer с price/priceCurrency).
 *
 * Данные — из src/data/services.mjs (общий источник с src/pages/Services.tsx).
 *
 * Must run AFTER vite build and BEFORE prerender-landing.mjs: it reads the
 * still-clean dist/index.html (prerender-landing overwrites the home page
 * last, injecting its own #lp-prerender content into #root).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SERVICES_META, SERVICES, ORDER_STEPS, formatPrice } from '../src/data/services.mjs'
import { PRIVACY_OPERATOR } from '../src/data/privacy.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const PATH = SERVICES_META.path

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

// ───────────────────────────────────────────────────────────────────────────
//  Static snapshot — mirrors src/pages/Services.tsx so crawlers (Яндекс) see
//  the full commercial content: услуги, цены, заказ, оплата, реквизиты.
// ───────────────────────────────────────────────────────────────────────────
const servicesHtml = SERVICES.map((s) => {
  const featuresHtml = s.features.map((f) => `<li>${escape(f)}</li>`).join('')
  const orderUrl = s.url.startsWith('/') ? s.url : escape(s.url)
  return `
      <section class="us-prerender__service" id="${escape(s.id)}">
        <h2>${escape(s.name)}</h2>
        <p>${escape(s.description)}</p>
        <p class="us-prerender__price"><strong>Цена: ${s.priceFrom ? 'от ' : ''}${formatPrice(s.price)} ${escape(s.unit)}</strong>${s.term ? ` · срок: ${escape(s.term)}` : ''}</p>
        <ul>${featuresHtml}</ul>
        <p><a class="us-prerender__cta" href="${orderUrl}">${escape(s.cta)}</a></p>
      </section>`
}).join('')

const orderHtml = ORDER_STEPS.map((step, i) => `
      <section class="us-prerender__group">
        <h3>${i + 1}. ${escape(step.h)}</h3>
        <p>${escape(step.p)}</p>
      </section>`).join('')

const bodyHtml = `
<article id="us-prerender">
  <header>
    <p class="us-prerender__eyebrow">Услуги · цены · заказ онлайн</p>
    <h1>${escape(SERVICES_META.h1)}</h1>
    <p class="us-prerender__lead">${escape(SERVICES_META.lead)}</p>
  </header>
  ${servicesHtml}
  <h2>Как заказать и оплатить</h2>
  ${orderHtml}
  <h2>Продавец услуг</h2>
  <section class="us-prerender__group">
    <p><strong>${escape(PRIVACY_OPERATOR.name)}</strong></p>
    <p>ИНН: ${escape(PRIVACY_OPERATOR.inn)} · ОГРН: ${escape(PRIVACY_OPERATOR.ogrn)}</p>
    <p>
      Email: <a href="mailto:${escape(PRIVACY_OPERATOR.email)}">${escape(PRIVACY_OPERATOR.email)}</a> ·
      Телефон: <a href="tel:${escape(PRIVACY_OPERATOR.phoneHref)}">${escape(PRIVACY_OPERATOR.phone)}</a> ·
      Telegram: <a href="https://t.me/qdmadept">@qdmadept</a>
    </p>
    <p>
      <a href="/terms.html">Правила использования</a> ·
      <a href="/privacy.html">Обработка персональных данных</a>
    </p>
  </section>
  <footer class="us-prerender__footer">
    <p>
      <a href="/excel-to-app.html">Из Excel — приложение</a> ·
      <a href="/tokens.html">Токены и облачные тарифы</a> ·
      <a href="/resheniya.html">Решения вместо Excel</a> ·
      <a href="/">На главную</a>
    </p>
  </footer>
</article>
<style>
  #us-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #us-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #us-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #us-prerender h3 { font-size: 1.1rem; margin: 1.5rem 0 0.25rem; }
  #us-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #us-prerender ul { line-height: 1.7; margin: 0.5rem 0; padding-left: 1.2rem; }
  #us-prerender .us-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #us-prerender .us-prerender__lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #us-prerender .us-prerender__price { font-size: 1.15rem; }
  #us-prerender .us-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Dark colours follow the app theme (.dark on <html>), NOT prefers-color-scheme. */
  .dark #us-prerender { color: #e2e8f0; }
  .dark #us-prerender .us-prerender__lead, .dark #us-prerender .us-prerender__footer { color: #94a3b8; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebPage + Organization + ItemList(Service→Offer) + Breadcrumb
// ───────────────────────────────────────────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: SERVICES_META.title,
      description: SERVICES_META.description,
      inLanguage: 'ru',
      isPartOf: { '@id': `${SITE}/#website` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'АО «Интеграм»',
      legalName: PRIVACY_OPERATOR.name,
      url: `${SITE}/`,
      taxID: PRIVACY_OPERATOR.inn,
      email: PRIVACY_OPERATOR.email,
      telephone: PRIVACY_OPERATOR.phone,
      logo: { '@type': 'ImageObject', url: `${SITE}/logos/integram-og.png` },
      identifier: [
        { '@type': 'PropertyValue', propertyID: 'ИНН', value: PRIVACY_OPERATOR.inn },
        { '@type': 'PropertyValue', propertyID: 'ОГРН', value: PRIVACY_OPERATOR.ogrn },
      ],
    },
    {
      '@type': 'ItemList',
      '@id': `${canonical}#services`,
      name: 'Услуги АО «Интеграм»',
      itemListElement: SERVICES.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Service',
          '@id': `${canonical}#${s.id}`,
          name: s.name,
          description: s.description,
          url: `${canonical}#${s.id}`,
          provider: { '@id': `${SITE}/#organization` },
          areaServed: 'RU',
          offers: {
            '@type': 'Offer',
            price: String(s.price),
            priceCurrency: 'RUB',
            url: s.url.startsWith('/') ? `${SITE}${s.url}` : s.url,
            availability: 'https://schema.org/InStock',
          },
        },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Услуги и цены', item: canonical },
      ],
    },
  ],
}

const ogImage = `${SITE}/logos/integram-og.png`
const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(SERVICES_META.title)}" />`,
  `<meta property="og:description" content="${escape(SERVICES_META.description)}" />`,
  `<meta property="og:image" content="${escape(ogImage)}" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="${PUBLISHER}" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${escape(SERVICES_META.title)}" />`,
  `<meta name="twitter:description" content="${escape(SERVICES_META.description)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

// SEO: короткие title/description в пределах пиксельных лимитов выдачи.
const seoTitle = 'Услуги и цены Интеграма — заказ онлайн'
const metaDescription =
  'Услуги АО «Интеграм» с ценами: разбор процесса с ТЗ — 20 000 ₽, пилот — от 93 750 ₽, разработка — 3 750 ₽/час, лицензия — 590 000 ₽/год. Заказ онлайн.'

// ───────────────────────────────────────────────────────────────────────────
//  Write dist/uslugi.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-uslugi: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-uslugi: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(seoTitle)}</title>`)
  .replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escape(metaDescription)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

const outPath = resolve(dist, 'uslugi.html')
writeFileSync(outPath, html)
console.log(`✓ uslugi prerendered → dist/uslugi.html (${html.length} bytes)`)
