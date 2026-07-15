#!/usr/bin/env node
/**
 * Post-build prerender for the «Информационная система (ИС): что это, виды,
 * классификация, свойства» pillar page (the SPA route `/informatsionnaya-sistema.html`).
 *
 * Like scripts/prerender-agent-platforms.mjs, the site is a client-side React SPA:
 * the built dist/index.html ships an empty <div id="root"></div>, so crawlers
 * (especially Yandex, whose JS rendering is limited), social-preview bots and
 * no-JS clients would see an empty page.
 *
 * This script takes the clean dist/index.html as a template and writes a
 * sibling dist/informatsionnaya-sistema.html with:
 *   - a tightened <title>, meta description/keywords
 *   - <link rel="canonical">
 *   - Open Graph + Twitter Card tags
 *   - JSON-LD (WebPage + Article + FAQPage)
 *   - a static, crawlable snapshot of the definition, classification, types,
 *     properties and lifecycle injected into #root
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
const PATH = '/informatsionnaya-sistema.html'

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
//  Static snapshot content — mirrors src/pages/InformationSystem.tsx
// ───────────────────────────────────────────────────────────────────────────
const provisions = [
  ['Техническое', 'Серверы, рабочие станции, сеть и устройства — вся техника, на которой работает система.'],
  ['Программное', 'Операционные системы, СУБД и прикладные программы, реализующие функции ИС.'],
  ['Информационное', 'Классификаторы, справочники, форматы документов и структура хранимых данных.'],
  ['Организационное', 'Регламенты, роли, права и обязанности пользователей и персонала.'],
  ['Правовое', 'Нормы, регламентирующие создание и эксплуатацию системы и работу с данными.'],
  ['Математическое', 'Методы, модели и алгоритмы обработки данных и принятия решений.'],
]

const classification = [
  ['По масштабу', 'Одиночные (персональные) → групповые (офисные) → корпоративные (КИС).'],
  ['По сфере применения', 'ИС организационного управления, АСУ ТП, САПР, интегрированные (корпоративные) ИС.'],
  ['По уровню управления', 'Оперативные (TPS), тактические (MIS), стратегические — поддержки решений (DSS) и руководителя (EIS).'],
  ['По степени автоматизации', 'Ручные → автоматизированные → автоматические.'],
  ['По характеру использования', 'Информационно-поисковые (ИПС) и информационно-решающие (управляющие, советующие).'],
  ['По архитектуре', 'Файл-серверные → клиент-серверные → многоуровневые (распределённые).'],
]

const systemTypes = [
  ['ERP', 'Планирование ресурсов предприятия — единый учёт финансов, закупок, производства и персонала.'],
  ['CRM', 'Управление отношениями с клиентами — сделки, история контактов, воронка продаж.'],
  ['СЭД / ECM', 'Электронный документооборот — согласование, хранение и маршрутизация документов.'],
  ['MES', 'Управление производством — задания, партии, оперативный контроль цеха.'],
  ['СППР / DSS', 'Поддержка принятия решений — аналитика и сценарии для руководителя.'],
  ['АСУ ТП / SCADA', 'Управление техпроцессом — диспетчерский контроль оборудования и сбор данных с датчиков.'],
  ['ГИС / GIS', 'Геоинформационная система — данные, привязанные к карте.'],
  ['СУБД / DBMS', 'Система управления базами данных — основа большинства учётных ИС.'],
]

const properties = [
  'Функциональная пригодность — система решает задачи, ради которых создана, полно и корректно.',
  'Надёжность — работает без сбоев и восстанавливается после отказов.',
  'Производительность — быстрый отклик и нужный объём данных и пользователей.',
  'Защищённость — разграничение доступа, целостность и конфиденциальность данных.',
  'Удобство использования — понятный интерфейс без долгого обучения.',
  'Сопровождаемость — систему можно менять и развивать без переписывания с нуля.',
]

const lifecycle = [
  'Формирование требований',
  'Разработка концепции',
  'Техническое задание',
  'Эскизный проект',
  'Технический проект',
  'Рабочая документация',
  'Ввод в действие',
  'Сопровождение',
]

const integramPillars = [
  ['База данных со связями', 'Реляционная модель, справочники и связи между сущностями — ядро любой учётной ИС.'],
  ['Роли и права из коробки', 'Разграничение доступа на уровне строк и полей настраивается, а не программируется.'],
  ['Интерфейсы и отчёты', 'Формы, отчёты и дашборды на чистом HTML — рабочие места без отдельной команды фронтенда.'],
  ['ИИ собирает систему', 'По описанию на русском или по загруженным Excel-таблицам ИИ-агент создаёт таблицы, права, меню и шаблоны.'],
  ['Свой контур, сервер в РФ', 'Данные остаются внутри компании: self-hosted или хостинг в России, без вендор-лока.'],
  ['Интеграции через API', 'Обмен данными с другими системами по API/JSON вместо ручных выгрузок.'],
]

const faq = [
  {
    q: 'Что такое информационная система простыми словами?',
    a: 'Это связка «данные + программы + техника + люди и правила», которая помогает собирать, хранить и обрабатывать информацию для конкретных задач: учёта, управления, документооборота. По 149-ФЗ — совокупность информации в базах данных и обеспечивающих её обработку технологий и технических средств.',
  },
  {
    q: 'Чем информационная система отличается от базы данных?',
    a: 'База данных — только хранилище структурированных данных. Информационная система — это база данных плюс программы обработки, интерфейсы для пользователей, роли и права, регламенты работы. База данных является частью ИС, но не равна ей.',
  },
  {
    q: 'Какие бывают виды информационных систем?',
    a: 'По назначению: ERP, CRM, СЭД (электронный документооборот), MES, СППР, АСУ ТП, ГИС. По масштабу — персональные, групповые и корпоративные. По степени автоматизации — ручные, автоматизированные и автоматические.',
  },
  {
    q: 'Можно ли создать информационную систему без программистов?',
    a: 'Да. На low-code платформе структура базы, роли, формы и отчёты настраиваются в конструкторе, а ИИ-агент собирает рабочую систему по описанию на естественном языке или по загруженным Excel-таблицам — без написания кода.',
  },
  {
    q: 'Сколько стоит создать информационную систему на Интеграме?',
    a: 'Тариф считается по токенам — объёму работы платформы, а не «за пользователя», поэтому расширение команды не увеличивает счёт кратно. Прототип рабочей ИС собирается за часы, а не за месяцы заказной разработки.',
  },
]

const dl = (pairs) =>
  pairs
    .map(([h, p]) => `
      <section class="is-prerender__group">
        <h3>${escape(h)}</h3>
        <p>${escape(p)}</p>
      </section>`)
    .join('')

const li = (items) => items.map((t) => `<li>${escape(t)}</li>`).join('')

const faqHtml = faq
  .map(
    (f) => `
      <section class="is-prerender__group">
        <h3>${escape(f.q)}</h3>
        <p>${escape(f.a)}</p>
      </section>`,
  )
  .join('')

const bodyHtml = `
<article id="is-prerender" itemscope itemtype="https://schema.org/Article">
  <header>
    <p class="is-prerender__eyebrow">Основы: информационные системы</p>
    <h1 itemprop="headline">Информационная система (ИС): что это простыми словами</h1>
    <p class="is-prerender__lead" itemprop="description">
      Что такое информационная система, из чего она состоит, какими бывают виды и свойства ИС — и как
      собрать работающую информационную систему на low-code платформе с ИИ без месяцев заказной разработки.
    </p>
  </header>

  <h2>Что такое информационная система</h2>
  <p>Информационная система (ИС) — это совокупность данных, программ, технических средств и людей, которая помогает собирать, хранить, обрабатывать и выдавать информацию для решения задач учёта, управления и документооборота.</p>
  <p>По Федеральному закону № 149-ФЗ (ст. 2, п. 3) информационная система — «совокупность содержащейся в базах данных информации и обеспечивающих её обработку информационных технологий и технических средств». То есть ИС — это не просто база данных: база данных лишь хранит данные, а информационная система добавляет к ним технологии обработки, интерфейсы, роли и регламенты.</p>

  <h2>Из чего состоит информационная система</h2>
  ${dl(provisions)}

  <h2>Классификация информационных систем</h2>
  ${dl(classification)}

  <h2>Виды информационных систем по назначению</h2>
  ${dl(systemTypes)}

  <h2>Свойства информационных систем</h2>
  <ul>${li(properties)}</ul>

  <h2>Жизненный цикл информационной системы</h2>
  <ul>${li(lifecycle)}</ul>

  <h2>Интеграм — ИИ-конструктор информационных систем</h2>
  <p>
    Интеграм — российская low-code платформа, на которой информационная система собирается из готовых
    кирпичей: база данных, роли, интерфейсы и интеграции. ИИ-агент проходит весь путь сам — по описанию на
    русском или по загруженным Excel-таблицам.
  </p>
  ${dl(integramPillars)}

  <h2>Частые вопросы об информационных системах</h2>
  ${faqHtml}

  <footer class="is-prerender__footer">
    <p>
      <a href="/excel-to-app.html#excel-form">Загрузить Excel и получить систему</a> ·
      <a href="/knowledge-base/22-information-system-constructor.html">Как собрать ИС на Интеграме</a> ·
      <a href="/">На главную</a> ·
      <a href="/knowledge-base">База знаний</a>
    </p>
  </footer>
</article>
<style>
  #is-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #is-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #is-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #is-prerender h3 { font-size: 1.1rem; margin: 1.5rem 0 0.25rem; }
  #is-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #is-prerender ul { line-height: 1.7; margin: 0.5rem 0; padding-left: 1.25rem; }
  #is-prerender .is-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #is-prerender .is-prerender__lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #is-prerender .is-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme, so a
     visitor who picked the dark theme while the OS is light does not get dark
     text on a dark background during loading (issue #325). */
  .dark #is-prerender { color: #e2e8f0; }
  .dark #is-prerender .is-prerender__lead, .dark #is-prerender .is-prerender__footer { color: #94a3b8; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebPage + Article + FAQPage
// ───────────────────────────────────────────────────────────────────────────
const canonical = `${SITE}${PATH}`
const ogTitle =
  'Что такое информационная система (ИС): виды, классификация, свойства'
const ogDescription =
  'Информационная система (ИС) — это совокупность информации в базах данных и технологий её обработки. Определение по 149-ФЗ и ГОСТ, состав, классификация, виды (ERP, CRM, СЭД, АСУ ТП, ГИС) и свойства информационных систем — и как собрать ИС на low-code платформе с ИИ без программистов.'
// SEO: <title> ≤ 60 симв. и <meta description> ≤ 158 (OG-теги ниже берут полные ogTitle/ogDescription)
const seoTitle = 'Что такое информационная система (ИС): виды и свойства'
const metaDescription =
  'Информационная система (ИС): определение по 149-ФЗ и ГОСТ, состав, классификация, виды (ERP, CRM, СЭД, АСУ ТП, ГИС) и свойства — и как собрать ИС без кода.'
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
      about: 'Информационная система',
      keywords:
        'информационная система, что такое информационная система, классификация информационных систем, виды информационных систем, свойства информационных систем',
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
  `<meta name="keywords" content="информационная система,что такое информационная система,ис это,классификация информационных систем,виды информационных систем,свойства информационных систем,состав информационной системы,создание информационной системы,конструктор информационных систем" />`,
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
//  Write dist/informatsionnaya-sistema.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-information-system: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-information-system: <div id="root"></div> not found in dist/index.html')
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

const outPath = resolve(dist, 'informatsionnaya-sistema.html')
writeFileSync(outPath, html)
console.log(`✓ information-system prerendered → dist/informatsionnaya-sistema.html (${html.length} bytes)`)
