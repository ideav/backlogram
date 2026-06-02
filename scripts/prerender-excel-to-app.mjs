#!/usr/bin/env node
/**
 * Post-build prerender for the «Загрузите Excel — получите приложение» landing
 * (the SPA route `/excel-to-app.html`).
 *
 * Like scripts/prerender-landing.mjs, the site is a client-side React SPA: the
 * built dist/index.html ships an empty <div id="root"></div>, so crawlers
 * (especially Yandex, whose JS rendering is limited), social-preview bots and
 * no-JS clients would see an empty page at /excel-to-app.html.
 *
 * This script takes the clean dist/index.html as a template and writes a
 * sibling dist/excel-to-app.html with:
 *   - a tightened <title>, meta description/keywords
 *   - <link rel="canonical">
 *   - Open Graph + Twitter Card tags
 *   - JSON-LD (WebPage + Service + FAQPage)
 *   - a static, crawlable snapshot of the landing injected into #root
 *
 * When React boots, createRoot().render(<App/>) replaces #root with the live
 * SPA, so the static fallback disappears for real visitors but stays in the
 * HTTP response for crawlers.
 *
 * Must run AFTER prerender-knowledge-base.mjs and BEFORE prerender-landing.mjs:
 * it reads the still-clean dist/index.html (prerender-landing overwrites the
 * home page last, injecting its own #lp-prerender content into #root).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const PATH = '/excel-to-app.html'

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
//  Static snapshot — mirrors src/pages/ExcelToApp.tsx headings so crawlers see
//  representative content and the "из Excel — приложение" offer.
// ───────────────────────────────────────────────────────────────────────────
const steps = [
  {
    h: 'Шаг 1. Загружаете Excel',
    p: 'Один или несколько файлов — прайсы, склад, клиенты, заказы. Как есть, без подготовки.',
  },
  {
    h: 'Шаг 2. Описываете тематику',
    p: 'Пара слов о том, чем занимаетесь и что хотите автоматизировать, плюс контакт для ответа.',
  },
  {
    h: 'Шаг 3. Получаете приложение',
    p: 'Через ~45 минут пришлём ссылку на готовую базу Интеграм с вашими данными.',
  },
]

const faq = [
  {
    q: 'Сколько времени занимает превращение Excel в приложение?',
    a: 'Обычно около 45 минут с момента получения файлов и описания тематики. Ссылку на готовую базу пришлём на указанный контакт.',
  },
  {
    q: 'Какие файлы можно загрузить?',
    a: 'Таблицы Excel (.xls, .xlsx, .xlsm), CSV и экспорт из Google Sheets и 1С. Можно прикрепить несколько файлов сразу.',
  },
  {
    q: 'Нужно ли что-то настраивать самому?',
    a: 'Нет. Агент собирает приложение под капотом — вы загружаете файлы, указываете тематику и контакт и получаете готовый результат.',
  },
]

const stepsHtml = steps
  .map(
    (s) => `
      <section class="etl-prerender__group">
        <h2>${escape(s.h)}</h2>
        <p>${escape(s.p)}</p>
      </section>`
  )
  .join('')

const faqHtml = faq
  .map(
    (f) => `
      <section class="etl-prerender__group">
        <h3>${escape(f.q)}</h3>
        <p>${escape(f.a)}</p>
      </section>`
  )
  .join('')

const bodyHtml = `
<article id="etl-prerender" itemscope itemtype="https://schema.org/Service">
  <header>
    <p class="etl-prerender__eyebrow">Готово примерно за 45 минут</p>
    <h1 itemprop="name">Загрузите Excel — получите приложение</h1>
    <p class="etl-prerender__lead" itemprop="description">
      Пришлите свои таблицы Excel и пару слов о задаче — мы превратим их в работающее
      веб-приложение на платформе Интеграм быстрее, чем вы найдёте фрилансера.
      Никаких формул, макросов и настройки: загружаете файлы, указываете тематику и
      контакт — и получаете ссылку на готовую базу со своими данными.
    </p>
  </header>
  ${stepsHtml}
  <h2>Частые вопросы</h2>
  ${faqHtml}
  <footer class="etl-prerender__footer">
    <p>
      <a href="${PATH}#excel-form">Загрузить файлы</a> ·
      <a href="/">На главную</a> ·
      <a href="/knowledge-base">База знаний</a>
    </p>
  </footer>
</article>
<style>
  #etl-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #etl-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #etl-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #etl-prerender h3 { font-size: 1.1rem; margin: 1.5rem 0 0.25rem; }
  #etl-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #etl-prerender .etl-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #etl-prerender .etl-prerender__lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #etl-prerender .etl-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme. The body
     background comes from the bundled CSS keyed on the same .dark class, so the
     fallback text must use that signal too; otherwise a visitor who picked the
     site's dark theme while the OS is light sees dark text on a dark background —
     a black screen during loading (issue #325). */
  .dark #etl-prerender { color: #e2e8f0; }
  .dark #etl-prerender .etl-prerender__lead, .dark #etl-prerender .etl-prerender__footer { color: #94a3b8; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebPage + Service + FAQPage
// ───────────────────────────────────────────────────────────────────────────
const canonical = `${SITE}${PATH}`
const ogTitle = 'Загрузите Excel — получите приложение за ~45 минут | Интеграм'
const ogDescription =
  'Пришлите Excel-файлы и тематику — вернём ссылку на готовое веб-приложение на платформе Интеграм. Замена Excel на приложение без программирования примерно за 45 минут.'
const ogImage = `${SITE}/og/knowledge-base.png`

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: ogTitle,
      description: ogDescription,
      inLanguage: 'ru',
      isPartOf: { '@id': `${SITE}/#website` },
    },
    {
      '@type': 'Service',
      '@id': `${canonical}#service`,
      name: 'Excel → приложение',
      serviceType: 'Превращение Excel-таблиц в веб-приложение',
      provider: { '@id': `${SITE}/#organization` },
      areaServed: 'RU',
      url: canonical,
      description: ogDescription,
    },
    {
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
}

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
//  Write dist/excel-to-app.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-excel-to-app: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-excel-to-app: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

// Replace the home page <title> and description with the landing's.
const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(ogTitle)}</title>`)
  .replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escape(ogDescription)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

const outPath = resolve(dist, 'excel-to-app.html')
writeFileSync(outPath, html)
console.log(`✓ excel-to-app prerendered → dist/excel-to-app.html (${html.length} bytes)`)
