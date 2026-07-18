#!/usr/bin/env node
/**
 * Post-build prerender for the «Агент создаёт приложение: Интеграм против
 * зарубежных платформ» analysis page (the SPA route `/agent-platforms.html`).
 *
 * Like scripts/prerender-excel-to-app.mjs, the site is a client-side React SPA:
 * the built dist/index.html ships an empty <div id="root"></div>, so crawlers
 * (especially Yandex, whose JS rendering is limited), social-preview bots and
 * no-JS clients would see an empty page at /agent-platforms.html.
 *
 * This script takes the clean dist/index.html as a template and writes a
 * sibling dist/agent-platforms.html with:
 *   - a tightened <title>, meta description/keywords
 *   - <link rel="canonical">
 *   - Open Graph + Twitter Card tags
 *   - JSON-LD (WebPage + Article)
 *   - a static, crawlable snapshot of the comparison injected into #root
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
const PATH = '/agent-platforms.html'

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
//  Static snapshot — mirrors src/pages/AgentPlatforms.tsx headings so crawlers
//  see the representative comparison content.
// ───────────────────────────────────────────────────────────────────────────
const competitors = [
  {
    h: 'Retool + Retool AI',
    p: 'По описанию генерирует приложение, но права и пользователей администрирует человек в интерфейсе, а агент заперт в песочнице.',
  },
  {
    h: 'Microsoft Power Platform + Copilot',
    p: 'Создаёт таблицы Dataverse и Canvas-приложения, но управление ролями безопасности недоступно агенту, а интерфейс собирается из готовых блоков.',
  },
  {
    h: 'NocoDB',
    p: 'Полный REST API для таблиц, связей и ролей, но изменения идут в реальный SQL — неосторожный агент может удалить колонку с данными.',
  },
  {
    h: 'Appsmith',
    p: 'GitOps через JSON и API, но управление пользователями и ролями остаётся в интерфейсе, а агенту нужно знать SQL-схему.',
  },
]

const pillars = [
  {
    h: 'Единая модель данных (EAV)',
    p: 'Все данные в одной физической таблице — ошибка агента создаёт новый тип, а не разрушает структуру.',
  },
  {
    h: 'Единый API для всего',
    p: 'Пользователи, роли, таблицы, колонки и связи — через одни и те же вызовы, без переключения между REST, SQL и SDK.',
  },
  {
    h: 'Сквозные права и маски через API',
    p: 'Ролевую модель полностью пишет скрипт, а не клики в интерфейсе.',
  },
  {
    h: 'Чистые HTML/JS-шаблоны',
    p: 'Агент генерирует интерфейс напрямую, без привязки к проприетарным виджетам.',
  },
  {
    h: 'Идемпотентные вызовы',
    p: 'Повторный запуск скрипта не падает и не плодит дубли.',
  },
]

const competitorsHtml = competitors
  .map(
    (c) => `
      <section class="ap-prerender__group">
        <h2>${escape(c.h)}</h2>
        <p>${escape(c.p)}</p>
      </section>`
  )
  .join('')

const pillarsHtml = pillars
  .map(
    (p) => `
      <section class="ap-prerender__group">
        <h3>${escape(p.h)}</h3>
        <p>${escape(p.p)}</p>
      </section>`
  )
  .join('')

const ruPlatforms = [
  { h: 'Bpium', p: 'No-code конструктор с таблицами, формами, API и правами до уровня поля, но приложение собирает человек — ИИ-генерации нет.' },
  { h: 'ELMA365', p: 'Low-code экосистема BPM/CRM/КЭДО с ИИ-ассистентом, который помогает человеку в визуальном конструкторе (human-in-the-loop).' },
  { h: 'BPMSoft', p: 'Low-code BPM/CRM (замена Creatio, реестр РФ, ФСТЭК) с LLM-агентами, но агент автоматизирует бизнес-процессы, а не схему и права.' },
  { h: 'AppMaster', p: 'No-code с ИИ-генерацией исходного кода (бэкенд, веб, мобайл), но это реальный код с риском поломки и без единого админ-API.' },
  { h: '1С:Элемент', p: 'Облачная low-code среда 1С для веб-кабинетов, порталов, браузерных и мобильных приложений, но приложение пишет разработчик — ИИ-сборки нет.' },
]

const ruPlatformsHtml = ruPlatforms
  .map(
    (p) => `
      <section class="ap-prerender__group">
        <h3>${escape(p.h)}</h3>
        <p>${escape(p.p)}</p>
      </section>`
  )
  .join('')

const codingAgents = [
  { h: 'Claude Code, Codex и другие агенты-кодеры', p: 'Автономные агенты-программисты сами пишут реальный код в репозитории, гоняют тесты и делают PR — мощно и гибко. Но БД, миграции, права, деплой и безопасность остаются на вас, нет встроенной безопасной модели данных и единого админ-API, а не-разработчик получает код, а не готовый самоадминистрируемый сервис.' },
]

const codingAgentsHtml = codingAgents
  .map(
    (p) => `
      <section class="ap-prerender__group">
        <h3>${escape(p.h)}</h3>
        <p>${escape(p.p)}</p>
      </section>`
  )
  .join('')

const bodyHtml = `
<article id="ap-prerender" itemscope itemtype="https://schema.org/Article">
  <header>
    <p class="ap-prerender__eyebrow">Агент как полноценный разработчик</p>
    <h1 itemprop="headline">ИИ-агент собирает и ведёт приложение под ключ</h1>
    <p class="ap-prerender__lead" itemprop="description">
      Подход «приложение полностью собирается ИИ-агентом» — горячий фронт. Ниже честное сравнение
      Интеграма с лучшими решениями за рубежом (Retool AI, Power Platform Copilot, NocoDB, Appsmith)
      и в России (Bpium, ELMA365, BPMSoft, AppMaster), где агент может выступать разработчиком и
      администратором.
    </p>
  </header>
  <h2>Главные зарубежные конкуренты</h2>
  ${competitorsHtml}
  <h2>Российские аналоги</h2>
  ${ruPlatformsHtml}
  <h2>А ИИ-агенты-программисты?</h2>
  ${codingAgentsHtml}
  <h2>Чем Интеграм уникален для полной автоматизации</h2>
  ${pillarsHtml}
  <section class="ap-prerender__group">
    <h2>Вывод</h2>
    <p>
      Ни за рубежом, ни в России нет точного аналога Интеграма по уровню контроля агента над
      платформой. Зарубежные и российские конкуренты заточены на human-in-the-loop: человек кликает
      в интерфейсе, агент помогает. Интеграм — платформа, где агент проходит полный цикл: структура
      базы → наполнение → роли и права → меню → шаблоны → тестовые данные, и всё это единообразными
      API-вызовами.
    </p>
  </section>
  <footer class="ap-prerender__footer">
    <p>
      <a href="/excel-to-app.html#excel-form">Загрузить Excel и получить приложение</a> ·
      <a href="/">На главную</a> ·
      <a href="/knowledge-base">База знаний</a>
    </p>
    <p style="margin-top:0.6rem">
      Читайте в блоге:
      <a href="https://blog.ideav.ru/posts/chto-umeet-ii-agent-pri-sborke-prilozheniya/">Что умеет ИИ-агент при сборке приложения</a> ·
      <a href="https://blog.ideav.ru/posts/ii-chat-vnutri-bazy-agent-dorabatyvaet-prilozhenie/">ИИ-чат внутри приложения: доработки изнутри</a> ·
      <a href="https://blog.ideav.ru/posts/programmisty-korobka-ili-ii-agent-kto-proektiruet-prilozhenie/">Программисты, коробка или ИИ-агент</a>
    </p>
  </footer>
</article>
<style>
  #ap-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #ap-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #ap-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #ap-prerender h3 { font-size: 1.1rem; margin: 1.5rem 0 0.25rem; }
  #ap-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #ap-prerender .ap-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #ap-prerender .ap-prerender__lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #ap-prerender .ap-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme, so a
     visitor who picked the dark theme while the OS is light does not get dark
     text on a dark background during loading (issue #325). */
  .dark #ap-prerender { color: #e2e8f0; }
  .dark #ap-prerender .ap-prerender__lead, .dark #ap-prerender .ap-prerender__footer { color: #94a3b8; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebPage + Article
// ───────────────────────────────────────────────────────────────────────────
const canonical = `${SITE}${PATH}`
const ogTitle =
  'Агент создаёт приложение: Интеграм против зарубежных и российских low-code платформ'
const ogDescription =
  'Подробное сравнение Интеграма с low-code платформами и агентами-программистами по модели «ИИ-агент создаёт и администрирует сервис под ключ»: за рубежом — Retool AI, Power Platform Copilot, NocoDB, Appsmith; в России — Bpium, ELMA365, BPMSoft, AppMaster, 1С:Элемент; агенты-кодеры — Claude Code, Codex.'
// SEO: <title> ≤ 60 симв. и <meta description> ≤ 158 (OG-теги ниже берут полные ogTitle/ogDescription)
const seoTitle = 'Интеграм против low-code платформ и ИИ-агентов'
const metaDescription =
  'Сравнение Интеграма с low-code платформами и ИИ-агентами-кодерами: Retool AI, Power Platform, NocoDB, Appsmith, Bpium, ELMA365, Claude Code, Codex.'
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
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Из Excel — приложение', item: `${SITE}/excel-to-app.html` },
        { '@type': 'ListItem', position: 3, name: 'ИИ-агент собирает приложение', item: canonical },
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
//  Write dist/agent-platforms.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-agent-platforms: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-agent-platforms: <div id="root"></div> not found in dist/index.html')
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

const outPath = resolve(dist, 'agent-platforms.html')
writeFileSync(outPath, html)
console.log(`✓ agent-platforms prerendered → dist/agent-platforms.html (${html.length} bytes)`)
