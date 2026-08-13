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
  {
    q: 'Сколько стоит забрать готовое приложение?',
    a: 'Демонстрацию можно забрать себе за 12 500 ₽. Дальнейшее владение базой — от 1950 рублей в месяц по тарифам ideav.ru; доработки с ИИ-агентом сверх первого месяца — 5950 рублей в месяц.',
  },
  {
    q: 'Какие ограничения на размер файлов?',
    a: 'До 10 файлов за один раз, каждый до 25 МБ. Если таблицы больше или их сильно больше десяти, напишите на abc@integram.io — примем выгрузку отдельно.',
  },
]

// Разделы ниже повторяют содержимое src/pages/ExcelToApp.tsx: до issue #559
// снимок нёс только шаги и FAQ (298 слов), из-за чего краулер не видел ни
// формы загрузки — главной цели страницы, — ни двух третей текста.
const deliverables = [
  {
    h: 'Реляционная база данных',
    p: 'Ваши прайс-листы, клиенты и заказы превратятся в связанные таблицы. Заказы ссылаются на клиентов, товары — на склад. Никакого ВПР и дублирования строк между файлами.',
  },
  {
    h: 'Рабочие места для сотрудников',
    p: 'Прораб получит простую форму для расхода материалов на телефоне, а руководитель — дашборд со сводкой. Интерфейс собирается под каждую роль отдельно.',
  },
  {
    h: 'Бизнес-логика 24/7',
    p: 'Система сама считает дедлайны, формирует заявки на закупку и отправляет уведомления в Telegram. Логика, которая была «в голове» у сотрудника, переезжает в облако.',
  },
]

const securityFeatures = [
  {
    h: 'Изолированная среда',
    p: 'Каждый проект разворачивается в отдельной реляционной базе данных. Ваши Excel-файлы не смешиваются с данными других клиентов.',
  },
  {
    h: '100 % ваши права',
    p: 'Данные и логика, сгенерированные из ваших таблиц, принадлежат только вам. Интеграм не использует их для обучения моделей.',
  },
  {
    h: 'Гибкие роли доступа',
    p: 'Вы управляете правами сотрудников: от режима «только чтение» до полного администрирования. Каждый видит только свою часть данных.',
  },
]

const comparison = {
  head: ['Что сравниваем', 'Интеграм', 'Готовый SaaS', 'Заказная разработка'],
  rows: [
    ['Скорость запуска', '45 минут', '1–2 недели настройки', '3–4 месяца'],
    ['Бюджет (MVP)', '12 500 ₽', 'от 50 000 ₽ плюс подписки', 'от 1 500 000 ₽'],
    ['Адаптация под процессы', '100 %, логика из вашего Excel', 'Работа по шаблону', '100 %, но дорого и долго'],
    ['Изменения без подрядчика', 'Самостоятельно за 5 минут', 'Через техподдержку', 'Очередь в бэклог'],
  ],
}

const agentCompare = {
  head: ['Что сравниваем', 'Интеграм', 'Зарубежные ИИ-платформы'],
  rows: [
    ['Кто настраивает права доступа', 'Агент — сам, по описанию', 'Человек вручную в интерфейсе'],
    ['Интерфейс под ваш бренд', 'Чистый HTML/CSS без ограничений', 'Готовые виджеты платформы'],
    ['Где лежат данные', 'Сервер в России — ideav.ru', 'Зарубежный хостинг'],
    ['Привязка к вендору', 'Нет — можно поставить на свой сервер', 'Высокая'],
  ],
}

function tableHtml({ head, rows }) {
  return `
      <table class="etl-prerender__table">
        <thead>
          <tr>${head.map((c) => `<th scope="col">${escape(c)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr><th scope="row">${escape(r[0])}</th>${r
                  .slice(1)
                  .map((c) => `<td>${escape(c)}</td>`)
                  .join('')}</tr>`
            )
            .join('\n          ')}
        </tbody>
      </table>`
}

function groupsHtml(items) {
  return items
    .map(
      (s) => `
      <section class="etl-prerender__group">
        <h3>${escape(s.h)}</h3>
        <p>${escape(s.p)}</p>
      </section>`
    )
    .join('')
}

const stepsHtml = steps
  .map(
    (s) => `
      <section class="etl-prerender__group">
        <h3>${escape(s.h)}</h3>
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
    <h1 itemprop="name">Загрузите ваши Excel — получите приложение</h1>
    <p class="etl-prerender__lead" itemprop="description">
      Пришлите свои таблицы Excel и пару слов о задаче — мы превратим их в работающее
      веб-приложение на платформе Интеграм быстрее, чем вы найдёте фрилансера.
      Никаких формул, макросов и настройки: загружаете файлы, указываете тематику и
      контакт — и получаете ссылку на готовую базу со своими данными.
    </p>
  </header>
  <h2>Как это работает</h2>
  <p>Три шага до рабочего приложения — от загрузки файлов до ссылки на готовую базу.</p>
  ${stepsHtml}

  <h2>Что конкретно вы получите через 45 минут</h2>
  <p>Не просто таблицу в облаке, а рабочую систему: связанные данные, интерфейсы под роли и логику, которая работает без вас.</p>
  ${groupsHtml(deliverables)}

  <h2>Прекратите подстраивать бизнес под софт</h2>
  <p>Сравнение с привычными способами получить корпоративную систему — по срокам, бюджету и тому, кто вносит изменения потом.</p>
  ${tableHtml(comparison)}

  <h2>Ваши данные — ваша собственность</h2>
  <p>Таблицы с финансами и клиентами — сердце бизнеса, поэтому режим хранения описан прямо здесь.</p>
  ${groupsHtml(securityFeatures)}

  <h2>А что у зарубежных ИИ-платформ</h2>
  <p>Приложение по описанию собирают и другие платформы. Разница — в том, что делает агент, и в том, где остаются данные. Подробный разбор — на странице <a href="/agent-platforms.html">платформ с ИИ-агентами</a>.</p>
  ${tableHtml(agentCompare)}

  <h2 id="excel-form-title">Загрузите свои таблицы</h2>
  <p>Excel, CSV или экспорт из Google Sheets. Всё остальное сделаем мы: разберём структуру, соберём базу и пришлём ссылку.</p>
  <form id="excel-form" class="etl-prerender__form" action="/excel-to-app.php" method="post" enctype="multipart/form-data" aria-labelledby="excel-form-title">
    <input type="hidden" name="source" value="excel-to-app" />
    <p>
      <label for="etl-files">Excel-файлы</label>
      <input id="etl-files" name="files[]" type="file" multiple accept=".xls,.xlsx,.xlsm,.csv,.ods" />
      <span class="etl-prerender__hint">.xls, .xlsx, .xlsm, .csv, .ods · до 25 МБ каждый · до 10 файлов</span>
    </p>
    <p>
      <label for="etl-topic">Тематика</label>
      <textarea id="etl-topic" name="topic" rows="3" placeholder="Например: учёт заказов в пекарне — клиенты, позиции, статусы доставки."></textarea>
    </p>
    <p>
      <label for="etl-contact">Контакт — email или Telegram</label>
      <input id="etl-contact" name="contact" type="text" required placeholder="@username или mail@company.ru" />
    </p>
    <p><button type="submit">Отправить и получить приложение</button></p>
    <p class="etl-prerender__hint">
      Отправляя файлы, вы соглашаетесь на <a href="/privacy.html">обработку персональных данных</a>.
    </p>
    <p class="etl-prerender__hint">
      Форма выше — версия страницы без JavaScript, и проверку капчи она не проходит. Если скрипты
      отключены, пришлите файлы письмом на <a href="mailto:abc@integram.io">abc@integram.io</a> или
      позвоните по телефону <a href="tel:+79955060167">+7 995 506-01-67</a> — заявку примем так же.
    </p>
  </form>

  <h2>Частые вопросы</h2>
  ${faqHtml}
  <p class="etl-prerender__note">
    Приложение будет в виде схемы данных, основных рабочих мест и базовых действий,
    которые описаны в вашем ТЗ или могут быть из него однозначно поняты. Вы сможете
    сразу его протестировать и потом забрать себе за 12 500 ₽. В первый месяц вам
    доступны доработки вашего проекта с использованием ИИ-агента. Дальнейшее
    использование ИИ-агента — дополнительно 5950 рублей в месяц к
    <a href="${SITE}/start.html#tarif">основному тарифу</a>.
  </p>
  <p class="etl-prerender__note">
    Стоимость владения этой базой согласно
    <a href="${SITE}/start.html#tarif">тарифам ideav.ru</a> — от 1950 рублей в месяц.
  </p>
  <footer class="etl-prerender__footer">
    <p>
      <a href="${PATH}#excel-form">Загрузить файлы</a> ·
      <a href="/">На главную</a> ·
      <a href="/knowledge-base">База знаний</a>
    </p>
    <p style="margin-top:0.6rem">
      Читайте в блоге:
      <a href="https://ideav.ru/blog/posts/excel-v-prilozhenie-za-45-minut-kak-rabotaet-ii-agent-integrama/">Excel в приложение за 45 минут</a> ·
      <a href="https://ideav.ru/blog/posts/keis-pekarnya-zamenila-5-excel-na-sistemu-ucheta-zakazov/">Кейс: пекарня заменила 5 Excel на систему учёта</a> ·
      <a href="https://ideav.ru/blog/posts/keis-logistika-dispetcher-otgruzok-iz-excel-za-den/">Кейс: диспетчер отгрузок из Excel за день</a>
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
  #etl-prerender .etl-prerender__note { margin-top: 2.5rem; font-size: 1rem;
    color: #475569; max-width: 50rem; }
  #etl-prerender .etl-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  #etl-prerender .etl-prerender__table { width: 100%; border-collapse: collapse;
    margin: 1rem 0 2rem; font-size: 0.95rem; }
  #etl-prerender .etl-prerender__table th,
  #etl-prerender .etl-prerender__table td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem;
    text-align: left; vertical-align: top; }
  #etl-prerender .etl-prerender__table thead th { background: #f8fafc; font-weight: 700; }
  #etl-prerender .etl-prerender__form { margin: 1rem 0 2rem; max-width: 34rem; }
  #etl-prerender .etl-prerender__form label { display: block; font-size: 0.78rem;
    text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #64748b;
    margin-bottom: 0.35rem; }
  #etl-prerender .etl-prerender__form input[type="text"],
  #etl-prerender .etl-prerender__form textarea { width: 100%; padding: 0.6rem 0.75rem;
    border: 1px solid #cbd5e1; border-radius: 0.75rem; font: inherit; background: #fff;
    color: inherit; }
  #etl-prerender .etl-prerender__form button { padding: 0.7rem 1.4rem; border: 0;
    border-radius: 0.75rem; background: #2563eb; color: #fff; font: inherit;
    font-weight: 700; cursor: pointer; }
  #etl-prerender .etl-prerender__hint { font-size: 0.85rem; color: #64748b; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme. The body
     background comes from the bundled CSS keyed on the same .dark class, so the
     fallback text must use that signal too; otherwise a visitor who picked the
     site's dark theme while the OS is light sees dark text on a dark background —
     a black screen during loading (issue #325). */
  .dark #etl-prerender { color: #e2e8f0; }
  .dark #etl-prerender .etl-prerender__lead, .dark #etl-prerender .etl-prerender__note, .dark #etl-prerender .etl-prerender__footer, .dark #etl-prerender .etl-prerender__hint { color: #94a3b8; }
  .dark #etl-prerender .etl-prerender__table th,
  .dark #etl-prerender .etl-prerender__table td { border-color: #1e293b; }
  .dark #etl-prerender .etl-prerender__table thead th { background: #0f172a; }
  .dark #etl-prerender .etl-prerender__form input[type="text"],
  .dark #etl-prerender .etl-prerender__form textarea { background: #020617; border-color: #1e293b; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebPage + Service + FAQPage
// ───────────────────────────────────────────────────────────────────────────
const canonical = `${SITE}${PATH}`
const ogTitle = 'Загрузите Excel — получите приложение за ~45 минут | Интеграм'
const ogDescription =
  'Пришлите Excel-файлы и тематику — вернём ссылку на готовое веб-приложение на платформе Интеграм. Замена Excel на приложение без программирования примерно за 45 минут.'
// SEO: <meta description> ≤ 158 симв. (OG-описание ниже берёт полный ogDescription)
const metaDescription =
  'Пришлите Excel-файлы и тематику — вернём ссылку на готовое веб-приложение на платформе Интеграм. Замена Excel на приложение без кода примерно за 45 минут.'
const ogImage = `${SITE}/og/excel-to-app.png`

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
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Из Excel — приложение', item: canonical },
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
    `<meta name="description" content="${escape(metaDescription)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

const outPath = resolve(dist, 'excel-to-app.html')
writeFileSync(outPath, html)
console.log(`✓ excel-to-app prerendered → dist/excel-to-app.html (${html.length} bytes)`)
