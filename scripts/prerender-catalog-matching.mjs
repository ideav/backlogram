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
import {
  CM_META,
  CM_FLOW,
  CM_STEPS,
  CM_PILLARS,
  CM_COMPARE_ROWS,
  CM_AUDIENCE,
  CM_FORM,
} from '../src/data/catalogMatching.mjs'
import { freshnessLine } from '../src/lib/dates.mjs'

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
//  Static snapshot. Текст берётся из src/data/catalogMatching.mjs — того же
//  источника, что питает src/pages/CatalogMatching.tsx. Раньше шаги цикла были
//  набраны здесь заново и другими словами, а сравнение с Elasticsearch, опоры
//  механики, блок «кому это нужно» и форма заявки в снапшот не попадали вовсе:
//  краулер без JS видел около четверти текста страницы (аудит 02.10.2026,
//  issue #627, п. 2).
// ───────────────────────────────────────────────────────────────────────────
const stepsHtml = CM_STEPS.map(
  (s) => `
      <section class="cm-prerender__group">
        <h3>${escape(s.title)}</h3>
        <p>${escape(s.body)}</p>
      </section>`,
).join('')

const flowHtml = CM_FLOW.map((f, i) => `<li>${i + 1}. ${escape(f.label)}</li>`).join('')

const pillarsHtml = CM_PILLARS.map(
  (p) => `
      <section class="cm-prerender__group">
        <h3>${escape(p.title)}</h3>
        <p>${escape(p.body)}</p>
      </section>`,
).join('')

const compareHtml = `
    <table class="cm-prerender__table">
      <thead>
        <tr><th>Критерий</th><th>Elasticsearch и заказная разработка</th><th>Интеграм</th></tr>
      </thead>
      <tbody>
        ${CM_COMPARE_ROWS.map(
          (r) =>
            `<tr><th scope="row">${escape(r.criterion)}</th><td>${escape(r.them)}</td><td>${escape(r.us)}</td></tr>`,
        ).join('\n        ')}
      </tbody>
    </table>`

const audienceHtml = CM_AUDIENCE.map((p) => `<p>${escape(p)}</p>`).join('\n  ')

// Форма заявки — настоящая, тем же обработчиком и с тем же `source`, что в
// React-версии. Капчу она без JS не проходит, поэтому рядом стоят живые
// альтернативы: письмо и телефон (как в снапшоте excel-to-app).
const formHtml = `
  <h2 id="cm-form-title">${escape(CM_FORM.title)}</h2>
  <p>${escape(CM_FORM.lead)}</p>
  <form id="cm-form" class="cm-prerender__form" action="${escape(CM_FORM.endpoint)}" method="post" enctype="multipart/form-data" aria-labelledby="cm-form-title">
    <input type="hidden" name="source" value="${escape(CM_FORM.source)}" />
    <p>
      <label for="cm-name">Имя</label>
      <input id="cm-name" name="name" type="text" placeholder="Александр" />
    </p>
    <p>
      <label for="cm-company">Компания</label>
      <input id="cm-company" name="company" type="text" placeholder="Digital Corp" />
    </p>
    <p>
      <label for="cm-contact">Контакт — email или Telegram</label>
      <input id="cm-contact" name="contact" type="text" required placeholder="@username или mail@company.ru" />
    </p>
    <p>
      <label for="cm-task">Про ваши каталоги</label>
      <textarea id="cm-task" name="task" rows="3" placeholder="Сколько позиций в каждом каталоге, в каком формате (Excel/CSV), какая номенклатура..."></textarea>
    </p>
    <p>
      <label for="cm-files">Каталоги — необязательно</label>
      <input id="cm-files" name="files[]" type="file" multiple accept="${escape(CM_FORM.extensions.join(','))}" />
      <span class="cm-prerender__hint">Ваш каталог (SKU) и каталог контрагента (RFP) · ${escape(CM_FORM.extensions.join(', '))} · до ${CM_FORM.maxFileMb} МБ каждый</span>
    </p>
    <p><button type="submit">Отправить каталоги</button></p>
    <p class="cm-prerender__hint">
      Отправляя файлы, вы соглашаетесь на <a href="/privacy.html">обработку персональных данных</a>.
    </p>
    <p class="cm-prerender__hint">
      Форма выше — версия страницы без JavaScript, и проверку капчи она не проходит. Если скрипты
      отключены, пришлите каталоги письмом на <a href="mailto:abc@integram.io">abc@integram.io</a>
      или позвоните по телефону <a href="tel:+79955060167">+7 995 506-01-67</a> — заявку примем так же.
    </p>
  </form>`

const bodyHtml = `
<article id="cm-prerender" itemscope itemtype="https://schema.org/Article">
  <header>
    <p class="cm-prerender__eyebrow">Инструмент на конструкторе Интеграм</p>
    <h1 itemprop="headline">${escape(CM_META.h1)}</h1>
    <p class="cm-prerender__lead" itemprop="description">${escape(CM_META.lead)}</p>
    <p class="cm-prerender__dates"><time datetime="${escape(CM_META.updatedAt)}">${escape(
      freshnessLine(CM_META.publishedAt, CM_META.updatedAt),
    )}</time></p>
  </header>
  <figure class="cm-prerender__figure">
    <img src="/catalog-tokenization.jpg" alt="Токенизация наименований: каталоги поставщика (SKU) и контрагента (RFP) разбиваются на слова-токены и сопоставляются через общий справочник токенов" width="1672" height="941" loading="lazy" itemprop="image" />
    <figcaption>Наименования из обоих каталогов разбиваются на токены и сводятся к общему справочнику — по пересечениям токенов находятся совпадения.</figcaption>
  </figure>
  <h2>Полный цикл сопоставления</h2>
  <ol class="cm-prerender__flow">${flowHtml}</ol>
  ${stepsHtml}
  <h2>Как считается оценка совпадения</h2>
  ${pillarsHtml}
  <h2>Интеграм против Elasticsearch и заказной разработки</h2>
  ${compareHtml}
  <h2>Кому это нужно</h2>
  ${audienceHtml}
  ${formHtml}
  <footer class="cm-prerender__footer">
    <p>
      <a href="https://ideav.ru/start.html">Начать с Интеграмом</a> ·
      <a href="/">На главную</a> ·
      <a href="/knowledge-base/21-catalog-matching.html">База знаний: сопоставление каталогов</a> ·
      <a href="/agent-platforms.html">Платформы с ИИ-агентами</a>
    </p>
    <p style="margin-top:0.6rem">
      Читайте в блоге:
      <a href="https://ideav.ru/blog/posts/massovoe-sopostavlenie-katalogov/">Массовое сопоставление каталогов: автоподбор пар</a> ·
      <a href="https://ideav.ru/blog/posts/sopostavlenie-katalogov-produkcii-v-integram/">Сопоставление каталогов продукции в Интеграме</a>
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
  #cm-prerender .cm-prerender__dates { font-size: 0.85rem; color: #94a3b8; }
  #cm-prerender .cm-prerender__flow { display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem;
    list-style: none; padding: 0; margin: 0.75rem 0 0; font-size: 0.95rem; color: #475569; }
  #cm-prerender .cm-prerender__table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 0;
    font-size: 0.95rem; }
  #cm-prerender .cm-prerender__table th, #cm-prerender .cm-prerender__table td {
    border: 1px solid #e2e8f0; padding: 0.5rem 0.7rem; text-align: left; vertical-align: top; }
  #cm-prerender .cm-prerender__table thead th { background: #f8fafc; }
  #cm-prerender .cm-prerender__form { margin: 1rem 0 0; max-width: 34rem; }
  #cm-prerender .cm-prerender__form label { display: block; font-size: 0.85rem; font-weight: 600;
    margin-bottom: 0.25rem; }
  #cm-prerender .cm-prerender__form input, #cm-prerender .cm-prerender__form textarea {
    width: 100%; padding: 0.6rem 0.7rem; border: 1px solid #cbd5e1; border-radius: 0.6rem;
    font: inherit; background: #fff; color: inherit; min-height: 2.75rem; }
  #cm-prerender .cm-prerender__form button { min-height: 2.75rem; padding: 0.6rem 1.4rem;
    border: 0; border-radius: 0.6rem; background: #2563eb; color: #fff; font: inherit;
    font-weight: 600; cursor: pointer; }
  #cm-prerender .cm-prerender__hint { display: block; font-size: 0.8rem; color: #64748b;
    margin-top: 0.35rem; }
  #cm-prerender .cm-prerender__figure { margin: 2rem 0 0; }
  #cm-prerender .cm-prerender__figure img { width: 100%; height: auto; display: block;
    border-radius: 1rem; border: 1px solid #e2e8f0; }
  #cm-prerender .cm-prerender__figure figcaption { margin-top: 0.6rem; text-align: center;
    font-size: 0.85rem; color: #94a3b8; }
  .dark #cm-prerender .cm-prerender__figure img { border-color: #1e293b; }
  #cm-prerender .cm-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme. */
  .dark #cm-prerender { color: #e2e8f0; }
  .dark #cm-prerender .cm-prerender__lead, .dark #cm-prerender .cm-prerender__footer,
  .dark #cm-prerender .cm-prerender__flow { color: #94a3b8; }
  .dark #cm-prerender .cm-prerender__table th, .dark #cm-prerender .cm-prerender__table td {
    border-color: #1e293b; }
  .dark #cm-prerender .cm-prerender__table thead th { background: #0f172a; }
  .dark #cm-prerender .cm-prerender__form input, .dark #cm-prerender .cm-prerender__form textarea {
    background: #0f172a; border-color: #1e293b; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebPage + Article
// ───────────────────────────────────────────────────────────────────────────
// Даты для разметки Article (issue #559, п. 6) — из src/data/catalogMatching.mjs
// и правятся руками вместе с содержимым. Раньше dateModified брался от даты
// сборки: он менялся при каждом деплое и обещал поисковику свежесть, которой не
// было (SEO-аудит 02.10.2026, issue #627, п. 5).
const datePublished = CM_META.publishedAt
const dateModified = CM_META.updatedAt

const canonical = `${SITE}${PATH}`
const ogTitle =
  'Массовое сопоставление каталогов: сотни тысяч позиций без Elasticsearch и кода — Интеграм'
const ogDescription =
  'Инструмент массового сопоставления позиций двух каталогов в конструкторе Интеграм: токенизация наименований, пересечение токенов, автоматический подбор в несколько потоков (~120 пар/мин), оценка точности, кандидаты-альтернативы, выгрузка в Excel и доуточнение шорт-листа языковой моделью — без программирования.'
// SEO: <title> ≤ 60 симв. и <meta description> ≤ 158 (OG-теги выше берут полные ogTitle/ogDescription)
const seoTitle = CM_META.title
const metaDescription = CM_META.description
const ogImage = `${SITE}/catalog-tokenization.jpg`
const ogImageW = 1672
const ogImageH = 941

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
      datePublished,
      dateModified,
      mainEntityOfPage: canonical,
      url: canonical,
      image: ogImage,
      author: { '@id': `${SITE}/#organization` },
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Сопоставление каталогов', item: canonical },
      ],
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
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(seoTitle)}</title>`)
  .replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escape(metaDescription)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

const outPath = resolve(dist, 'catalog-matching.html')
writeFileSync(outPath, html)
console.log(`✓ catalog-matching prerendered → dist/catalog-matching.html (${html.length} bytes)`)
