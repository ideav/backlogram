#!/usr/bin/env node
/**
 * Post-build prerender for the «Токены» pricing-model page (the SPA route
 * `/tokens.html`, rendered by src/pages/Tokens.tsx).
 *
 * Without this step /tokens.html is served by the SPA fallback (the bare
 * dist/index.html), so crawlers see the *home* page's <title> — a duplicate
 * title flagged for the site (issue #418). Like the other standalone-page
 * prerenders, this writes a sibling dist/tokens.html from the clean
 * dist/index.html with its own <title>, meta description, canonical, Open Graph
 * tags, JSON-LD and a static crawlable snapshot injected into #root. When React
 * boots it replaces #root with the live SPA, so the fallback only lives in the
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
const PATH = '/tokens.html'

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
//  Static snapshot — mirrors src/pages/Tokens.tsx so crawlers see the
//  representative content (why tokens, what actions cost, who spends how much).
// ───────────────────────────────────────────────────────────────────────────
const actionCosts = [
  { action: 'Открыть таблицу', cost: '1' },
  { action: 'Создать запись', cost: '1' },
  { action: 'Запустить отчёт по продажам', cost: '1' },
  { action: 'Пересчёт сложной таблицы с формулами', cost: '5–10' },
  { action: 'Выгрузить 10 000 строк в Excel', cost: '10–20' },
  { action: 'Импорт прайс-листа на 50 000 позиций', cost: '30–50' },
]

const userTypes = [
  { role: 'Оператор / поддержка', actionsPerHour: '40–60', examples: 'Ответы, закрытие тикетов, открытие чатов' },
  { role: 'Менеджер по продажам', actionsPerHour: '20–40', examples: 'Заполнение CRM, письма, звонки' },
  { role: 'Планово-экономический отдел', actionsPerHour: '15–30', examples: 'Открытие таблиц, расчёты, выгрузки, отчёты' },
]

const costsHtml = actionCosts
  .map((r) => `<li><span>${escape(r.action)}</span> — <strong>${escape(r.cost)}</strong> токенов</li>`)
  .join('')

const usersHtml = userTypes
  .map(
    (u) => `
      <section class="tk-prerender__group">
        <h3>${escape(u.role)}</h3>
        <p>${escape(u.actionsPerHour)} действий в час. ${escape(u.examples)}.</p>
      </section>`,
  )
  .join('')

const bodyHtml = `
<article id="tk-prerender" itemscope itemtype="https://schema.org/WebPage">
  <header>
    <p class="tk-prerender__eyebrow">Модель оплаты Интеграма</p>
    <h1 itemprop="headline">Токены Интеграма — оплата за реальные действия</h1>
    <p class="tk-prerender__lead" itemprop="description">
      В Интеграме вы платите не за число пользователей и гигабайты места, а за реальную работу.
      Большинство действий в системе стоит 1 токен, тяжёлые операции — дороже. Каждый раз, когда
      вы что-то делаете, счётчик делает «щелчок»: платите только за то, чем реально пользовались.
    </p>
  </header>
  <h2>Сколько стоят действия</h2>
  <ul class="tk-prerender__costs">
    ${costsHtml}
  </ul>
  <h2>Кто сколько тратит токенов</h2>
  ${usersHtml}
  <section class="tk-prerender__group">
    <h2>Почему это честно</h2>
    <p>
      Тариф в токенах привязан к работе, а не к штату: подключить всех сотрудников можно бесплатно,
      а расход идёт только по фактическим действиям. Лёгкие операции почти ничего не стоят, тяжёлые
      выгрузки и импорты видны в счётчике сразу — расходы прозрачны и предсказуемы.
    </p>
  </section>
  <footer class="tk-prerender__footer">
    <p>
      <a href="https://ideav.ru/start.html">Начать с Интеграмом</a> ·
      <a href="/">На главную</a> ·
      <a href="/knowledge-base/16-pricing-policy.html">База знаний: тарифы в токенах</a>
    </p>
  </footer>
</article>
<style>
  #tk-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #tk-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #tk-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #tk-prerender h3 { font-size: 1.1rem; margin: 1.5rem 0 0.25rem; }
  #tk-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #tk-prerender .tk-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #tk-prerender .tk-prerender__lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #tk-prerender .tk-prerender__costs { line-height: 1.9; margin: 0.5rem 0; padding-left: 1.2rem; }
  #tk-prerender .tk-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme. */
  .dark #tk-prerender { color: #e2e8f0; }
  .dark #tk-prerender .tk-prerender__lead, .dark #tk-prerender .tk-prerender__footer { color: #94a3b8; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebPage
// ───────────────────────────────────────────────────────────────────────────
const canonical = `${SITE}${PATH}`
const seoTitle = 'Токены Интеграма: за что платите и сколько стоят действия'
const ogTitle = 'Токены Интеграма — плата за реальные действия, а не за пользователей'
const ogDescription =
  'Как устроена оплата в Интеграме: тариф в токенах. Большинство действий стоит 1 токен, тяжёлые операции дороже. Вы платите за реальную работу, а не за число пользователей и место.'
const metaDescription =
  'Оплата в Интеграме — в токенах: большинство действий стоит 1 токен, тяжёлые операции дороже. Вы платите за реальную работу, а не за число пользователей.'
const ogImage = `${SITE}/og/home.png`

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${canonical}#webpage`,
  url: canonical,
  name: ogTitle,
  description: ogDescription,
  inLanguage: 'ru',
  isPartOf: { '@id': `${SITE}/#website` },
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
//  Write dist/tokens.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-tokens: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-tokens: <div id="root"></div> not found in dist/index.html')
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

const outPath = resolve(dist, 'tokens.html')
writeFileSync(outPath, html)
console.log(`✓ tokens prerendered → dist/tokens.html (${html.length} bytes)`)
