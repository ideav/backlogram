#!/usr/bin/env node
/**
 * Post-build prerender for the «Конструктор приложений вместо Excel» landing
 * (the SPA route `/konstruktor-prilozhenij.html`, rendered by
 * src/pages/ExcelConstructor.tsx).
 *
 * Like the other tool-page prerenders, the site is a client-side React SPA: the
 * built dist/index.html ships an empty <div id="root"></div>, so crawlers
 * (especially Yandex), social-preview bots and no-JS clients would see an empty
 * page at /konstruktor-prilozhenij.html.
 *
 * This script takes the clean dist/index.html as a template and writes a sibling
 * dist/konstruktor-prilozhenij.html with:
 *   - a tightened <title>, meta description/keywords
 *   - <link rel="canonical">
 *   - Open Graph + Twitter Card tags
 *   - JSON-LD (WebPage + Service + FAQPage)
 *   - a static, crawlable snapshot injected into #root
 *
 * When React boots, createRoot().render(<App/>) replaces #root with the live
 * SPA, so the static fallback disappears for real visitors but stays in the
 * HTTP response for crawlers.
 *
 * This page deliberately targets a DIFFERENT keyword cluster than
 * /excel-to-app.html («конструктор приложений / no-code платформа / замена
 * Excel» vs. «загрузите Excel — получите приложение») and carries its own
 * canonical, so the two pages don't cannibalise each other (issue #428/#418).
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
const PATH = '/konstruktor-prilozhenij.html'

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
//  Static snapshot — mirrors src/pages/ExcelConstructor.tsx headings so
//  crawlers see the representative content.
// ───────────────────────────────────────────────────────────────────────────
const pains = [
  {
    h: 'Excel тормозит на больших данных',
    p: 'Таблица виснет и крашится уже на десятках тысяч строк. Конструктор Интеграм хранит до 2 000 000 записей и работает без лагов — это база данных, а не файл.',
  },
  {
    h: 'Ошибки из-за правок формул',
    p: 'Случайная правка формулы или удалённая ячейка ломают всю таблицу. В Интеграме — ролевая модель доступа: кто что видит и меняет, плюс история изменений.',
  },
  {
    h: 'Отчёты собираются руками',
    p: 'Сводки и дашборды в Excel собираются часами. В конструкторе Интеграм отчёты, группировки и графики настраиваются запросом без кода — новый срез за пару минут.',
  },
]

const faq = [
  {
    q: 'Нужно ли нанимать программистов?',
    a: 'Нет. Настройку делают бизнес-аналитики в конструкторе, а дальше вы управляете системой сами — без кода: добавляете поля, отчёты и рабочие места.',
  },
  {
    q: 'Можно ли установить на свой сервер?',
    a: 'Да. Интеграм разворачивается on-premise — все данные хранятся у вас. По умолчанию проект работает на российском сервере ideav.ru.',
  },
  {
    q: 'Как быстро можно начать?',
    a: 'Демо-доступ с вашими данными настраиваем за 1 день. Полную настройку под номенклатуру — обычно в течение 24 часов после получения файлов.',
  },
  {
    q: 'Сколько стоит?',
    a: 'Владение базой — от 1950 ₽/мес по тарифам ideav.ru; итог зависит от объёма данных и числа пользователей. Точную оценку под ваш объём дадим по заявке.',
  },
  {
    q: 'Чем это отличается от услуги «Загрузите Excel — получите приложение»?',
    a: 'Там вы за ~45 минут получаете готовую базу из своих файлов «под ключ». Здесь — про замену Excel конструктором как платформой: вы сами развиваете систему, отчёты и роли без программистов.',
  },
]

const painsHtml = pains
  .map(
    (s) => `
      <section class="kp-prerender__group">
        <h3>${escape(s.h)}</h3>
        <p>${escape(s.p)}</p>
      </section>`
  )
  .join('')

const faqHtml = faq
  .map(
    (f) => `
      <section class="kp-prerender__group">
        <h3>${escape(f.q)}</h3>
        <p>${escape(f.a)}</p>
      </section>`
  )
  .join('')

const bodyHtml = `
<article id="kp-prerender" itemscope itemtype="https://schema.org/Service">
  <header>
    <p class="kp-prerender__eyebrow">Конструктор приложений Интеграм</p>
    <h1 itemprop="name">Конструктор приложений вместо Excel</h1>
    <p class="kp-prerender__lead" itemprop="description">
      Ваш Excel тормозит и врёт? Замените его конструктором приложений Интеграм: храните миллионы
      записей, стройте отчёты и управляйте данными без программистов. Настоящая база данных вместо
      разъезжающихся таблиц — с ролями доступа, дашбордами и настройкой под ваш бизнес за 1 день.
    </p>
    <figure class="kp-prerender__figure">
      <img src="/case-sovereignty-audit.png" alt="Пример приложения на платформе Интеграм: аналитика, финансы и дашборды" width="2042" height="1252" loading="lazy" itemprop="image" />
      <figcaption>Пример приложения на платформе Интеграм</figcaption>
    </figure>
  </header>
  <h2>Excel перестал справляться — что дальше</h2>
  ${painsHtml}
  <section class="kp-prerender__group">
    <h2>Живой кейс: 22 000 позиций за 3 часа</h2>
    <p>
      У клиента был свой каталог и прайс поставщика с другими названиями и артикулами. На
      конструкторе Интеграм сопоставление собрали без Elasticsearch и без кода — токенизация
      наименований и автоподбор в несколько потоков. 22 000 позиций сопоставили за 3 часа вместо
      двух недель работы отдела закупок.
    </p>
  </section>
  <section class="kp-prerender__group">
    <h2>Что вы получаете вместо таблицы</h2>
    <p>
      Настоящую базу данных (таблицы, связи, справочники, вычисляемые поля, миллионы записей),
      отчёты и дашборды без кода, а также роли и права доступа. Хранилище — до 2 000 000 записей.
      Настройка под вашу номенклатуру — обычно 24 часа. Российская платформа, работает на вашем
      сервере (on-premise).
    </p>
  </section>
  <h2>Частые вопросы</h2>
  ${faqHtml}
  <footer class="kp-prerender__footer">
    <p>
      <a href="${PATH}#zayavka">Заказать демо</a> ·
      <a href="/">На главную</a> ·
      <a href="/excel-to-app.html">Загрузить Excel — получить приложение</a> ·
      <a href="/catalog-matching.html">Сопоставление каталогов</a>
    </p>
  </footer>
</article>
<style>
  #kp-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #kp-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #kp-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #kp-prerender h3 { font-size: 1.1rem; margin: 1.5rem 0 0.25rem; }
  #kp-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #kp-prerender .kp-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #kp-prerender .kp-prerender__lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #kp-prerender .kp-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  #kp-prerender .kp-prerender__figure { margin: 2rem 0 0; }
  #kp-prerender .kp-prerender__figure img { width: 100%; height: auto; display: block;
    border-radius: 1rem; border: 1px solid #e2e8f0; }
  #kp-prerender .kp-prerender__figure figcaption { margin-top: 0.6rem; text-align: center;
    font-size: 0.85rem; color: #94a3b8; }
  .dark #kp-prerender .kp-prerender__figure img { border-color: #1e293b; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme (issue #325). */
  .dark #kp-prerender { color: #e2e8f0; }
  .dark #kp-prerender .kp-prerender__lead, .dark #kp-prerender .kp-prerender__footer { color: #94a3b8; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebPage + Service + FAQPage
// ───────────────────────────────────────────────────────────────────────────
const canonical = `${SITE}${PATH}`
const ogTitle = 'Конструктор приложений вместо Excel: no-code платформа для бизнеса — Интеграм'
const ogDescription =
  'Excel тормозит и врёт на больших данных? Замените его конструктором приложений Интеграм: миллионы записей, отчёты и дашборды без кода, ролевая модель доступа — без программистов. Российская платформа, on-premise, настройка под ваш бизнес за 1 день.'
// SEO: <title> ≤ 60 симв. и <meta description> ≤ 158 (OG-теги ниже берут полные ogTitle/ogDescription)
const seoTitle = 'Конструктор приложений вместо Excel — без кода | Интеграм'
const metaDescription =
  'Замените Excel конструктором приложений Интеграм: миллионы записей, отчёты и роли доступа без программистов. Настройка под ваш бизнес за 1 день.'
const ogImage = `${SITE}/case-sovereignty-audit.png`
const ogImageW = 2042
const ogImageH = 1252

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
      name: 'Конструктор приложений вместо Excel',
      serviceType: 'Замена Excel конструктором приложений (no-code платформа)',
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
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Конструктор приложений', item: canonical },
      ],
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

// ───────────────────────────────────────────────────────────────────────────
//  Write dist/konstruktor-prilozhenij.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-konstruktor-prilozhenij: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-konstruktor-prilozhenij: <div id="root"></div> not found in dist/index.html')
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

const outPath = resolve(dist, 'konstruktor-prilozhenij.html')
writeFileSync(outPath, html)
console.log(`✓ konstruktor-prilozhenij prerendered → dist/konstruktor-prilozhenij.html (${html.length} bytes)`)
