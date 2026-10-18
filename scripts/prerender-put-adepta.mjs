#!/usr/bin/env node
/**
 * Post-build prerender for «Путь адепта Интеграм» (/put-adepta.html, issue #765).
 *
 * Шаги, два проекта с бюджетами и часами и самопроверка обязаны быть в самом
 * HTTP-ответе: SPA отдаёт пустой <div id="root"></div>, а JS у Яндекса и
 * клиентов без JS ограничен. Форма заявки интерактивна и живёт в React.
 *
 * Тексты — из src/data/adeptPath.mjs, того же источника, что питает
 * src/pages/AdeptPath.tsx, поэтому снапшот не может разойтись со страницей.
 *
 * Must run AFTER vite build and BEFORE prerender-landing.mjs: it reads the
 * still-clean dist/index.html (prerender-landing overwrites the home page
 * last, injecting its own #lp-prerender content into #root).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ADEPT_META,
  CASES,
  HERO_CHIPS,
  HERO_LEAD,
  HOURLY_RATE,
  HOURS_LESSON,
  SELF_CHECK,
  STEPS,
} from '../src/data/adeptPath.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const PATH = ADEPT_META.path

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

// Разряды — обычным пробелом: неразрывные расставит apply-typography.mjs.
const rub = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`

const canonical = `${SITE}${PATH}`

// ───────────────────────────────────────────────────────────────────────────
//  Static snapshot — mirrors src/pages/AdeptPath.tsx section headings.
// ───────────────────────────────────────────────────────────────────────────
const chipsHtml = HERO_CHIPS.map((c) => `<span class="ap-prerender__chip">${escape(c)}</span>`).join(' ')

const stepsHtml = STEPS.map(
  (s) => `
      <li><h3>${escape(s.h)}</h3><p>${escape(s.p)}</p>${
        s.cta && !s.cta.href.startsWith('#') ? `<p><a href="${escape(s.cta.href)}">${escape(s.cta.label)}</a></p>` : ''
      }</li>`,
).join('')

const casesHtml = CASES.map((c) => {
  const phases = c.phases
    .map((ph, i) => `<li>Фаза ${i + 1}: ${escape(ph.name)}${ph.budget ? ` — ${rub(ph.budget)}` : ''}, ${escape(ph.note)}</li>`)
    .join('')
  const timeline = c.timeline.map((t) => `<li>${escape(t)}</li>`).join('')
  const images = [c.image, c.extraImage]
    .filter(Boolean)
    .map(
      (img) =>
        `<figure><img src="${escape(img.src)}" width="${img.width}" height="${img.height}" alt="${escape(img.alt)}" loading="lazy" /><figcaption>${escape(img.alt)}</figcaption></figure>`,
    )
    .join('')
  return `
    <section class="ap-prerender__group">
      <h3>История ${escape(c.name)}</h3>
      <p>${escape(c.tagline)}</p>
      <p><strong>Бюджет: ${rub(c.budget)}, работы около ${c.hoursSpent} ч.</strong> Откуда пришёл: ${escape(c.origin)}.</p>
      <ul>${phases}</ul>
      <h4>Как шёл проект</h4>
      <ol>${timeline}</ol>
      <h4>Что получил заказчик</h4>
      <p>${escape(c.result)}</p>
      ${images}
    </section>`
}).join('')

const selfCheckHtml = SELF_CHECK.map((a) => `<li>${escape(a)}</li>`).join('\n        ')

const bodyHtml = `
<article id="ap-prerender">
  <header>
    <h1>${escape(ADEPT_META.h1)}</h1>
    <p class="ap-prerender__lead">${escape(HERO_LEAD)}</p>
    <p>${chipsHtml}</p>
  </header>
  <section class="ap-prerender__group">
    <h2>Пять шагов пути адепта</h2>
    <ol>${stepsHtml}
    </ol>
  </section>
  <section class="ap-prerender__group">
    <h2>Два проекта: путь от первого письма до работающей системы</h2>
    <p>Имена заказчиков изменены, цифры — настоящие. Ставка в обоих — ${rub(HOURLY_RATE)} за час.</p>${casesHtml}
    <aside>
      <h3>Почему мы не торгуемся за часы</h3>
      <p>${escape(HOURS_LESSON)}</p>
    </aside>
  </section>
  <section class="ap-prerender__group">
    <h2>Справитесь ли вы с подобным</h2>
    <ul>
        ${selfCheckHtml}
    </ul>
  </section>
  <section class="ap-prerender__group">
    <h2>Заявка в команду адептов</h2>
    <p>Имя, Telegram и пара строк об опыте — дальше короткое собеседование. Форма заявки работает в JavaScript-версии страницы; без JS напишите в Telegram <a href="https://t.me/qdmadept">@qdmadept</a>.</p>
  </section>
</article>`

// ───────────────────────────────────────────────────────────────────────────
//  JSON-LD: WebPage + BreadcrumbList (как у соседних страниц).
// ───────────────────────────────────────────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: ADEPT_META.title,
      description: ADEPT_META.description,
      inLanguage: 'ru',
      isPartOf: { '@id': `${SITE}/#website` },
      publisher: { '@id': `${SITE}/#organization` },
      dateModified: ADEPT_META.updatedAt,
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: PUBLISHER,
      url: `${SITE}/`,
      logo: { '@type': 'ImageObject', url: `${SITE}/logos/integram-og.png` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Путь адепта', item: canonical },
      ],
    },
  ],
}

const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(ADEPT_META.title)}" />`,
  `<meta property="og:description" content="${escape(ADEPT_META.description)}" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="${PUBLISHER}" />`,
  `<meta name="twitter:card" content="summary" />`,
  `<meta name="twitter:title" content="${escape(ADEPT_META.title)}" />`,
  `<meta name="twitter:description" content="${escape(ADEPT_META.description)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

// ───────────────────────────────────────────────────────────────────────────
//  Write dist/put-adepta.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-put-adepta: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-put-adepta: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(ADEPT_META.title)}</title>`)
  .replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escape(ADEPT_META.description)}" />`,
  )
  .replace(
    /<meta name="keywords"[^>]*>/,
    `<meta name="keywords" content="${escape(ADEPT_META.keywords)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

const outPath = resolve(dist, 'put-adepta.html')
writeFileSync(outPath, html)
console.log(`✓ adept path prerendered → dist/put-adepta.html (${html.length} bytes)`)
