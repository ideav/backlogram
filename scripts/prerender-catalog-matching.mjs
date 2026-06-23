#!/usr/bin/env node
/**
 * Post-build prerender for the «Массовое сопоставление каталогов» tool page
 * (the SPA route `/catalog-matching.html`).
 *
 * Like scripts/prerender-agent-platforms.mjs, the site is a client-side React
 * SPA: the built dist/index.html ships an empty <div id="root"></div>, so
 * crawlers (especially Yandex), social-preview bots and no-JS clients would see
 * an empty page at /catalog-matching.html.
 *
 * This script takes the clean dist/index.html as a template and writes a sibling
 * dist/catalog-matching.html with:
 *   - a tightened <title>, meta description/keywords
 *   - <link rel="canonical">
 *   - Open Graph + Twitter Card tags
 *   - JSON-LD (WebPage + Article)
 *   - a static, crawlable snapshot injected into #root
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
const PATH = '/catalog-matching.html'

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
//  Static snapshot — mirrors src/pages/CatalogMatching.tsx headings so crawlers
//  see the representative content.
// ───────────────────────────────────────────────────────────────────────────
const steps = [
  {
    h: 'Загрузка по сохранённой настройке',
    p: 'Свой каталог (SKU) и каталог контрагента (RFP) загружаются из Excel по сохранённой настройке: Интеграм распознаёт листы и колонки и показывает число строк. Скорость — порядка 500–1000 записей в секунду.',
  },
  {
    h: 'Токенизация наименований',
    p: 'Один запрос разбивает наименование на слова-токены и наполняет общий справочник токенов. Обе таблицы используют один справочник — это позволяет искать пересечения.',
  },
  {
    h: 'Рабочее место сопоставления',
    p: 'Для позиции контрагента по токенам подбираются кандидаты из вашего каталога. Совпадение марки, модели и типа подсвечивается зелёным; настройка под тип товара задаётся запросом, без программирования.',
  },
  {
    h: 'Массовый автоматический подбор',
    p: 'Кнопка Start запускает автоподбор в несколько потоков: механизм пишет в таблицу RFP подобранный артикул и альтернативы. Скорость — порядка 120 сопоставлений в минуту; 22 000 позиций обрабатываются за пару-тройку часов.',
  },
  {
    h: 'Выгрузка и передача',
    p: 'Отдельный запрос собирает подобранный артикул и все альтернативы и выгружает результат в Excel или отдаёт через JSON API.',
  },
  {
    h: 'Доуточнение языковой моделью',
    p: 'Шорт-лист кандидатов отдаётся языковой модели, которая выбирает только то, что точно совпадает. Перемножение «все на все» не нужно — модель работает по уже отобранным парам.',
  },
]

const stepsHtml = steps
  .map(
    (s) => `
      <section class="cm-prerender__group">
        <h3>${escape(s.h)}</h3>
        <p>${escape(s.p)}</p>
      </section>`
  )
  .join('')

const bodyHtml = `
<article id="cm-prerender" itemscope itemtype="https://schema.org/Article">
  <header>
    <p class="cm-prerender__eyebrow">Инструмент на конструкторе Интеграм</p>
    <h1 itemprop="headline">Массовое сопоставление каталогов на сотни тысяч позиций</h1>
    <p class="cm-prerender__lead" itemprop="description">
      Один и тот же товар в вашем каталоге и в каталоге контрагента назван по-разному и имеет разные
      артикулы. Инструмент сопоставляет такие позиции автоматически — через токенизацию наименований
      и пересечение токенов, в несколько потоков и без программирования. Раньше под это разворачивали
      Elasticsearch и нанимали программистов; здесь всё собрано на конструкторе Интеграм.
    </p>
  </header>
  <h2>Полный цикл сопоставления</h2>
  ${stepsHtml}
  <section class="cm-prerender__group">
    <h2>Как считается оценка совпадения</h2>
    <p>
      У каждой пары есть числовая оценка точности: она складывается из количества совпавших токенов и
      отношения их общей длины к длине наименования. Формула на виду — её можно усложнять и оттачивать
      под номенклатуру: добавлять веса частым и редким токенам, требовать обязательного совпадения
      бренда и типа товара.
    </p>
  </section>
  <section class="cm-prerender__group">
    <h2>Интеграм против Elasticsearch и заказной разработки</h2>
    <p>
      Обычно сопоставление каталогов решают поисковым движком, нечётким поиском и руками программистов.
      В Интеграме запуск не требует развёртывания индексов и кода, логика сопоставления настраивается
      запросом без релиза, массовый прогон идёт встроенным многопоточным автоподбором, а результат —
      подобранный артикул, альтернативы и экспорт в Excel и API — доступен из коробки. Данные хранятся
      на сервере в РФ.
    </p>
  </section>
  <footer class="cm-prerender__footer">
    <p>
      <a href="https://ideav.ru/start.html">Начать с Интеграмом</a> ·
      <a href="/">На главную</a> ·
      <a href="/knowledge-base/21-catalog-matching.html">База знаний: сопоставление каталогов</a>
    </p>
  </footer>
</article>
<style>
  #cm-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #cm-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #cm-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #cm-prerender h3 { font-size: 1.1rem; margin: 1.5rem 0 0.25rem; }
  #cm-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #cm-prerender .cm-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #cm-prerender .cm-prerender__lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #cm-prerender .cm-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme. */
  .dark #cm-prerender { color: #e2e8f0; }
  .dark #cm-prerender .cm-prerender__lead, .dark #cm-prerender .cm-prerender__footer { color: #94a3b8; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebPage + Article
// ───────────────────────────────────────────────────────────────────────────
const canonical = `${SITE}${PATH}`
const ogTitle =
  'Массовое сопоставление каталогов: сотни тысяч позиций без Elasticsearch и кода — Интеграм'
const ogDescription =
  'Инструмент массового сопоставления позиций двух каталогов в конструкторе Интеграм: токенизация наименований, пересечение токенов, автоматический подбор в несколько потоков (~120 пар/мин), оценка точности, кандидаты-альтернативы, выгрузка в Excel и доуточнение шорт-листа языковой моделью — без программирования.'
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
      '@type': 'Article',
      '@id': `${canonical}#article`,
      headline: ogTitle,
      description: ogDescription,
      inLanguage: 'ru',
      mainEntityOfPage: canonical,
      url: canonical,
      image: ogImage,
      author: { '@id': `${SITE}/#organization` },
      publisher: { '@id': `${SITE}/#organization` },
    },
  ],
}

const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="article" />`,
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
//  Write dist/catalog-matching.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-catalog-matching: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-catalog-matching: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(ogTitle)}</title>`)
  .replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escape(ogDescription)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

const outPath = resolve(dist, 'catalog-matching.html')
writeFileSync(outPath, html)
console.log(`✓ catalog-matching prerendered → dist/catalog-matching.html (${html.length} bytes)`)
