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
import { USE_CASES } from '../src/data/usecases.mjs'
import { BLOG_URL, BLOG_POSTS } from '../src/data/blogPosts.mjs'
import { HOME_FAQ } from '../src/data/home-faq.mjs'

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

// ───────────────────────────────────────────────────────────────────────────
//  FAQ — из общего с React источника src/data/home-faq.mjs (issue #495). Раньше
//  вопросы были продублированы здесь руками и разъехались с секцией «Интеграм —
//  коротко о главном»: на странице 7 вопросов (af.md, блок 13), а в снапшоте и
//  в разметке FAQPage оставались 3 старых. Вопрос-дизамбигуация «Интеграм — это
//  Инстаграм?» из снапшота убран: с главной его сняли по issue #433 (замена на
//  AI-native позиционирование), а разведение бренда с соцсетью держат
//  alternateName + description узлов Organization и WebSite ниже.
//
//  В FAQPage уходит только текст ответа — Google требует, чтобы размеченный
//  ответ совпадал с видимым на странице, поэтому ссылка перелинковки идёт
//  отдельным абзацем.
// ───────────────────────────────────────────────────────────────────────────
// ───────────────────────────────────────────────────────────────────────────
//  Свежие статьи блога (issue #512). Зеркалит слайдер из src/components/
//  BlogSlider.tsx: в SPA карточки рисует React, а в статичном снапшоте это
//  единственный способ показать краулерам и клиентам без JS, что у сайта есть
//  живой блог, и передать на blog.ideav.ru ссылочный вес с главной.
// ───────────────────────────────────────────────────────────────────────────
const blogHtml = `
      <section class="lp-prerender__group" aria-labelledby="lp-blog-title">
        <h2 id="lp-blog-title">Свежее в блоге</h2>
        <p>Разборы проектов, кейсы заказчиков и то, как устроена платформа изнутри.</p>
        <ul class="lp-prerender__posts">
          ${BLOG_POSTS.map(
            (post) => `<li>
            <a href="${escape(post.url)}">${escape(post.title)}</a>
            <span class="lp-prerender__post-meta">${escape(post.category)} · <time datetime="${escape(post.date)}">${escape(post.dateLabel)}</time></span>
          </li>`
          ).join('\n          ')}
        </ul>
        <p><a href="${escape(BLOG_URL)}/">Перейти в блог</a></p>
      </section>`

const faqHtml = `
      <section class="lp-prerender__group" aria-labelledby="lp-faq-title">
        <h2 id="lp-faq-title">Частые вопросы</h2>
        ${HOME_FAQ
          .map(
            (item) => `<div class="lp-prerender__faq-item">
          <h3>${escape(item.q)}</h3>
          <p>${escape(item.a)}</p>${
            item.link
              ? `\n          <p class="lp-prerender__faq-link"><a href="${escape(item.link.href)}">${escape(item.link.text)}</a></p>`
              : ''
          }
        </div>`
          )
          .join('\n        ')}
      </section>`

// Ссылки на все страницы-решения — чтобы краулеры видели их в статичном
// снапшоте главной, а не только после загрузки SPA (issue #436).
const useCaseLinksHtml = USE_CASES
  .map((u) => `<a href="/${u.slug}.html">${escape(u.badge.replace(/ на Интеграме$/, ''))}</a>`)
  .join(' ·\n      ')

// H1 и подзаголовок — ДОСЛОВНО как в герое src/pages/Home.tsx (af.md, блок 1).
// Снапшот — то, что видит краулер, поэтому расхождение здесь означает, что для
// поиска у страницы другой H1, чем для людей (issue #495). Синхронность
// проверяет tests/issue-495-home-seo.test.mjs.
const H1 = 'Интеграм — российский no-code конструктор приложений и баз данных: замена Excel и аналог Airtable для бизнеса'
const LEAD =
  'Из Excel-таблицы — рабочее веб-приложение за 45 минут. Реляционные данные, сотни тысяч записей, права доступа на уровне строк, локальное размещение в контуре заказчика. Автоматизация бизнес-процессов без программистов. В реестре отечественного ПО (запись №30872).'

// Абзац SEO-подвала — тот же текст, что в секции 16 src/pages/Home.tsx (af.md, блок 14).
const SEO_FOOTER =
  'Интеграм — российская no-code платформа для создания внутренних бизнес-приложений и баз данных без программирования. Конвертация Excel в приложение за 45 минут: формы, отчёты, дашборды, права доступа на уровне строк. Замена Excel, Google Sheets и Airtable для корпоративных объёмов данных — сотни тысяч записей, реляционные связи, локальное размещение (on-premise). Автоматизация бизнес-процессов, CRM для B2B-продаж, система учёта данных, управление заявками и инцидентами, документооборот и маршрутизация согласования. Автоматическая генерация отчётов, парсинг Excel файлов, интеграция данных из разрозненных источников. Включён в реестр отечественного ПО (запись №30872). Аналог Airtable, аналог Trello, замена Excel для бизнеса. Пилотный проект за 2 недели. Облако от 0₽/мес, локальная лицензия 590 000₽/год.'

const bodyHtml = `
<article id="lp-prerender" itemscope itemtype="https://schema.org/SoftwareApplication">
  <header>
    <p class="lp-prerender__eyebrow">Автоматизация без программистов</p>
    <h1 itemprop="name">${escape(H1)}</h1>
    <p class="lp-prerender__lead" itemprop="description">
      ${escape(LEAD)}
    </p>
  </header>
  ${sectionsHtml}
  ${blogHtml}
  ${faqHtml}
  <footer class="lp-prerender__footer">
    <p class="lp-prerender__seo">${escape(SEO_FOOTER)}</p>
    <p class="lp-prerender__registry">
      <span>В реестре отечественного ПО</span>
      <strong>Реестровая запись №30872</strong>
    </p>
    <nav class="lp-prerender__links" aria-label="Разделы сайта">
      <a href="/excel-to-app.html">Загрузить Excel — получить приложение</a> ·
      <a href="/informatsionnaya-sistema.html">Что такое информационная система</a> ·
      <a href="/agent-platforms.html">Интеграм против low-code и ИИ-агентов</a> ·
      <a href="/catalog-matching.html">Сопоставление каталогов и прайсов</a> ·
      <a href="/knowledge-base">База знаний</a>
    </nav>
    <nav class="lp-prerender__links" aria-label="Решения вместо Excel">
      <a href="/konstruktor-prilozhenij.html">Конструктор вместо Excel</a> ·
      <a href="/resheniya.html">Все решения вместо Excel</a> ·
      ${useCaseLinksHtml} ·
      <a href="/tokens.html">Токены — как считается стоимость</a>
    </nav>
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
  #lp-prerender .lp-prerender__posts { margin: 0.75rem 0 0; padding: 0; list-style: none; }
  #lp-prerender .lp-prerender__posts li { margin: 0.5rem 0; }
  #lp-prerender .lp-prerender__post-meta { display: block; font-size: 0.85rem; color: #64748b; }
  #lp-prerender .lp-prerender__faq-item { margin: 1rem 0; }
  #lp-prerender .lp-prerender__faq-item h3 { font-size: 1.05rem; margin: 0 0 0.25rem; }
  #lp-prerender .lp-prerender__faq-link { font-size: 0.92rem; }
  #lp-prerender a { color: #2563eb; }
  #lp-prerender .lp-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  #lp-prerender .lp-prerender__registry span,
  #lp-prerender .lp-prerender__registry strong { display: block; }
  #lp-prerender .lp-prerender__registry span { font-weight: 600; color: #1e293b; }
  #lp-prerender .lp-prerender__registry strong { margin-top: 0.15rem; font-weight: 600; }
  #lp-prerender .lp-prerender__links { line-height: 1.9; margin: 0.75rem 0 0; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme. The body
     background comes from the bundled CSS keyed on the same .dark class, so the
     fallback text must use that signal too; otherwise a visitor who picked the
     site's dark theme while the OS is light sees dark text on a dark background —
     a black screen during loading (issue #325). */
  .dark #lp-prerender { color: #e2e8f0; }
  .dark #lp-prerender .lp-prerender__lead, .dark #lp-prerender .lp-prerender__footer { color: #94a3b8; }
  .dark #lp-prerender .lp-prerender__registry span { color: #e2e8f0; }
  .dark #lp-prerender a { color: #60a5fa; }
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
      // alternateName зеркалит Organization: связывает имя сайта с «Integram» и
      // «Конструктор Интеграм», помогая Google не путать домен с «Инстаграм» при
      // автодополнении (issue #395). SearchAction не добавляем — у сайта нет
      // URL-адресуемого поиска (?q=…), а Google требует рабочий target.
      alternateName: ['Integram', 'Конструктор Интеграм'],
      inLanguage: 'ru',
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: PUBLISHER,
      legalName: 'АО «Интеграм»',
      // alternateName + description помогают поисковику распознать «Интеграм»
      // как самостоятельный бренд и не «исправлять» запрос на «инстаграм» (issue #387).
      alternateName: ['Конструктор Интеграм', 'Integram'],
      description:
        'Интеграм — российский no-code конструктор приложений и баз данных (не социальная сеть). Из Excel — рабочее веб-приложение с формами, правами доступа и отчётами.',
      url: `${SITE}/`,
      logo: { '@type': 'ImageObject', url: `${SITE}/logos/integram-og.png` },
      // sameAs — авторитетные профили бренда: они «замыкают контур» сущности для
      // Knowledge Graph. После создания элемента Wikidata добавить его URL сюда
      // (см. docs/issue-387-konstruktor-integram-rf.md, раздел D2).
      sameAs: [
        'https://integram.io',
        'https://reestr.digital.gov.ru/reestr/4638631/',
        'https://rutube.ru/channel/41204904/videos/',
        'https://blog.ideav.ru/',
      ],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE}/#app`,
      name: 'Интеграм — конструктор приложений и баз данных',
      alternateName: ['Integram', 'Конструктор Интеграм'],
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'No-code платформа для внутренних бизнес-приложений',
      operatingSystem: 'Web',
      url: `${SITE}/`,
      inLanguage: 'ru',
      description:
        'Российский no-code конструктор для создания внутренних приложений, баз данных, форм и отчётов без программирования. Аналог Airtable, замена Excel и Google Sheets.',
      // featureList — возможности, о которых прямо говорят блоки страницы
      // (af.md, блоки 2/5/9). Ничего сверх того, что заявлено в тексте.
      featureList: [
        'Конвертация Excel-таблицы в веб-приложение за ~45 минут',
        'Реляционные данные: связи, рекурсия и вложенные запросы без кодирования',
        'Права доступа на уровне строк, столбцов и таблиц',
        'Формы, отчёты и дашборды без релизов — настраивают бизнес-аналитики',
        'Импорт и экспорт Excel, JSON, интеграции по API',
        'Локальное размещение (on-premise) в контуре заказчика',
      ],
      screenshot: `${SITE}/case-orbita-planner.png`,
      softwareHelp: { '@type': 'CreativeWork', url: `${SITE}/knowledge-base` },
      // offers — бесплатный тариф «Знакомство» (см. секцию «Тарифы» выше). Закрывает
      // non-critical замечание Google «Missing field offers» и даёт цену в rich snippet
      // (issue #395). aggregateRating сознательно НЕ добавляем — нет реальных отзывов,
      // фиктивный рейтинг нарушает правила Google по разметке отзывов.
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'RUB',
        description: 'Пробный тариф «Знакомство»',
      },
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE}/#faq`,
      inLanguage: 'ru',
      mainEntity: HOME_FAQ.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    },
  ],
}

const canonical = `${SITE}/`
const ogTitle = 'Интеграм — конструктор приложений и баз данных из Excel за час'
const ogDescription =
  'Пришлите Excel — получите рабочее веб-приложение с формами, доступами и отчётами. Понятно бухгалтеру, логисту, начальнику цеха — без программистов, 1С и долгого внедрения.'
const ogImage = `${SITE}/og/home.png`

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
