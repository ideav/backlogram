#!/usr/bin/env node
/**
 * Post-build prerender for the landing page (the SPA index route `/`).
 *
 * The site is a client-side React SPA: the built dist/index.html ships an
 * empty <div id="root"></div>, so search engines (especially Yandex, whose
 * JS rendering is limited) and no-JS clients see a page with no content.
 * The knowledge base already solves this via scripts/prerender-knowledge-base.mjs;
 * this script does the same for the home page.
 *
 * It rewrites dist/index.html, injecting a fully-rendered static snapshot of
 * the landing into #root. When React boots, createRoot().render(<App/>)
 * replaces #root with the live SPA, so the static fallback disappears for
 * real visitors but stays in the HTTP response for crawlers.
 *
 * Must run AFTER prerender-knowledge-base.mjs, because that script uses the
 * clean dist/index.html as its template — we overwrite the home page last.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'

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
//  Static snapshot of the landing — mirrors src/pages/Home.tsx section
//  headings so crawlers see representative content. The brand + category
//  ("конструктор Интеграм / конструктор приложений и баз данных") appears in
//  the H1 and lead so the page is relevant to the brand query.
// ───────────────────────────────────────────────────────────────────────────
const sections = [
  {
    h: 'Своя разработка — это хорошо, но…',
    p: 'Интеграм встраивается в вашу ИТ-среду и закрывает очередь задач (бэклог) быстрее обычной разработки, не отнимая контроль над данными и кодом.',
  },
  {
    h: 'Для кого',
    p: 'Компании, которым нужны внутренние приложения, учёт и автоматизация процессов без долгого цикла заказной разработки.',
  },
  {
    h: 'Работаем там, где обычные конструкторы «падают»',
    p: 'Реляционные данные, сотни тысяч записей, права доступа на уровне строк, локальное размещение — сценарии, где Excel, Google Sheets, Airtable и Notion упираются в лимиты.',
  },
  {
    h: 'Изменения вносятся бизнес-аналитиками, а не программистами',
    p: 'Поля, формы, отчёты и дашборды настраиваются без релизов и без переписывания кода.',
  },
  {
    h: 'Готовые типы проектов для вашего бэклога',
    p: 'CRM, учётные системы, порталы, формы сбора данных, отчётность и интеграции по API (JSON).',
  },
  {
    h: 'Как начать быстро и комфортно',
    p: 'Пилотный проект, локальная лицензия или разработка под ключ — с системным аналитиком и разработчиком платформы на вашей стороне.',
  },
  {
    h: 'Тарифы на хостинг в облаке',
    p: 'Планы «Знакомство», «Стартап» и «Масштабируемый» — от пробного использования до промышленной нагрузки.',
  },
]

const sectionsHtml = sections
  .map(
    (s) => `
      <section class="lp-prerender__group">
        <h2>${escape(s.h)}</h2>
        <p>${escape(s.p)}</p>
      </section>`
  )
  .join('')

const bodyHtml = `
<article id="lp-prerender" itemscope itemtype="https://schema.org/SoftwareApplication">
  <header>
    <p class="lp-prerender__eyebrow">Автоматизация без программистов</p>
    <h1 itemprop="name">Интеграм — конструктор приложений и баз данных</h1>
    <p class="lp-prerender__lead" itemprop="description">
      Из Excel — рабочее приложение за час. Пришлите таблицу и получите веб-приложение
      с формами, доступами и отчётами: понятно бухгалтеру, логисту, начальнику цеха —
      без программистов, 1С и долгого внедрения. Российский no-code конструктор приложений
      и баз данных, аналог Airtable, замена Excel и Google Sheets для реляционных данных
      и автоматизации бизнеса.
    </p>
  </header>
  ${sectionsHtml}
  <footer class="lp-prerender__footer">
    <p class="lp-prerender__registry">
      <span>В реестре отечественного ПО</span>
      <strong>Реестровая запись №30872</strong>
    </p>
    <p>
      <a href="/excel-to-app.html">Загрузить Excel — получить приложение</a> ·
      <a href="/knowledge-base">База знаний</a>
    </p>
  </footer>
</article>
<style>
  #lp-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #lp-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #lp-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #lp-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #lp-prerender .lp-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #lp-prerender .lp-prerender__lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #lp-prerender .lp-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  #lp-prerender .lp-prerender__registry span,
  #lp-prerender .lp-prerender__registry strong { display: block; }
  #lp-prerender .lp-prerender__registry span { font-weight: 600; color: #1e293b; }
  #lp-prerender .lp-prerender__registry strong { margin-top: 0.15rem; font-weight: 600; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme. The body
     background comes from the bundled CSS keyed on the same .dark class, so the
     fallback text must use that signal too; otherwise a visitor who picked the
     site's dark theme while the OS is light sees dark text on a dark background —
     a black screen during loading (issue #325). */
  .dark #lp-prerender { color: #e2e8f0; }
  .dark #lp-prerender .lp-prerender__lead, .dark #lp-prerender .lp-prerender__footer { color: #94a3b8; }
  .dark #lp-prerender .lp-prerender__registry span { color: #e2e8f0; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebSite + Organization + SoftwareApplication
// ───────────────────────────────────────────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: PUBLISHER,
      inLanguage: 'ru',
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: PUBLISHER,
      url: `${SITE}/`,
      logo: { '@type': 'ImageObject', url: `${SITE}/logos/integram-og.png` },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE}/#app`,
      name: 'Интеграм — конструктор приложений и баз данных',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: `${SITE}/`,
      inLanguage: 'ru',
      description:
        'Российский no-code конструктор для создания внутренних приложений, баз данных, форм и отчётов без программирования. Аналог Airtable, замена Excel и Google Sheets.',
      publisher: { '@id': `${SITE}/#organization` },
    },
  ],
}

const canonical = `${SITE}/`
const ogTitle = 'Из Excel — приложение за час | Интеграм'
const ogDescription =
  'Пришлите Excel — получите рабочее веб-приложение с формами, доступами и отчётами. Понятно бухгалтеру, логисту, начальнику цеха — без программистов, 1С и долгого внедрения.'
const ogImage = `${SITE}/og/knowledge-base.png`

const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(ogTitle)}" />`,
  `<meta property="og:description" content="${escape(ogDescription)}" />`,
  `<meta property="og:image" content="${escape(ogImage)}" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="${PUBLISHER}" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${escape(ogTitle)}" />`,
  `<meta name="twitter:description" content="${escape(ogDescription)}" />`,
  `<meta name="twitter:image" content="${escape(ogImage)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

// ───────────────────────────────────────────────────────────────────────────
//  Patch dist/index.html in place
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.log('• landing already prerendered, skipping')
  process.exit(0)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-landing: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

writeFileSync(indexPath, html)
console.log(`✓ landing prerendered → dist/index.html (${html.length} bytes)`)
