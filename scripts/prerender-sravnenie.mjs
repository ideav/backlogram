#!/usr/bin/env node
/**
 * Post-build prerender for the «Интеграм vs Битрикс24 / AmoCRM» comparison page
 * (the SPA route `/sravnenie-s-bitrix-amocrm.html`).
 *
 * Like scripts/prerender-catalog-matching.mjs, the site is a client-side React
 * SPA: the built dist/index.html ships an empty <div id="root"></div>, so
 * crawlers (especially Yandex), social-preview bots and no-JS clients would see
 * an empty page at /sravnenie-s-bitrix-amocrm.html.
 *
 * This script takes the clean dist/index.html as a template and writes a sibling
 * dist/sravnenie-s-bitrix-amocrm.html with:
 *   - a tightened <title>, meta description/keywords
 *   - <link rel="canonical">
 *   - Open Graph + Twitter Card tags
 *   - JSON-LD (WebPage + Article + FAQPage)
 *   - a static, crawlable snapshot injected into #root, incl. a cross-link to
 *     /crm-uchet-klientov.html
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
const PATH = '/sravnenie-s-bitrix-amocrm.html'

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
//  Static snapshot — mirrors src/pages/BitrixAmoComparison.tsx headings so
//  crawlers see the representative content.
// ───────────────────────────────────────────────────────────────────────────
const locked = [
  {
    h: 'Воронки и перенос лида',
    p: 'Структура воронок и правила перехода лида между ними заданы вендором. Перенести лид из одной воронки в другую без потери данных и истории — типовая боль, которую не закрывает ни настройка, ни доработка.',
  },
  {
    h: 'Модель данных',
    p: 'Сущности «лид / сделка / контакт / компания» фиксированы. Добавить свою сущность с собственной логикой или переопределить связи между ними нельзя — можно лишь навесить поля.',
  },
  {
    h: 'Модель оплаты',
    p: 'Оплата за каждого пользователя ежемесячно. Читающие руководители, подрядчики, аудиторы — все считаются «пользователями» и увеличивают счёт.',
  },
  {
    h: 'Границы кастомизации',
    p: 'Доработки упираются в API, виджеты и маркетплейс — надстройку над закрытым ядром. Само ядро продукта заказчику недоступно, поэтому часть ограничений не снимается в принципе.',
  },
]

const compare = [
  { c: 'Модель данных и сущности', us: 'Любые сущности, поля и связи — под ваш процесс' },
  { c: 'Воронки и перенос лида', us: 'Воронки, статусы и правила переходов настраиваются запросом' },
  { c: 'Изменить логику ядра', us: 'Да, это конструктор — бизнес-логика ваша' },
  { c: 'За рамки CRM (склад, производство, договоры)', us: 'Одна платформа под любые смежные процессы' },
  { c: 'Объём данных', us: 'Сотни тысяч+ записей, ядро QDM без потолка «как в Excel»' },
  { c: 'Модель оплаты', us: 'Подписка или лицензия — не за каждого пользователя' },
  { c: 'Локальная установка (on-prem)', us: 'Возможна, на вашем сервере' },
]

const faq = [
  {
    q: 'Можно ли перенести данные из Битрикс24 или AmoCRM?',
    a: 'Да. Клиенты, сделки и история выгружаются из Битрикс24 / AmoCRM в Excel или CSV и загружаются в базу Интеграма при настройке.',
  },
  {
    q: 'Это дороже коробочной CRM?',
    a: 'Модель оплаты другая — не за каждого пользователя ежемесячно, а подписка или лицензия. На командах с большим числом «читающих» пользователей и на объёме данных это часто выходит дешевле.',
  },
  {
    q: 'А если нам хватает возможностей коробки?',
    a: 'Тогда честно берите коробку — это быстрее. Интеграм нужен там, где процесс нестандартный, выходит за рамки CRM или вы уже упёрлись в «это нельзя изменить».',
  },
  {
    q: 'Можно ли развернуть на своём сервере?',
    a: 'Да, возможна локальная установка (on-prem) на вашей инфраструктуре — в отличие от облачных CRM, где данные остаются у вендора.',
  },
]

const lockedHtml = locked
  .map((s) => `
      <section class="sr-prerender__group">
        <h3>${escape(s.h)}</h3>
        <p>${escape(s.p)}</p>
      </section>`)
  .join('')

const compareHtml = compare
  .map((r) => `<li><strong>${escape(r.c)}:</strong> ${escape(r.us)}</li>`)
  .join('')

const faqHtml = faq
  .map((f) => `
      <section class="sr-prerender__group">
        <h3>${escape(f.q)}</h3>
        <p>${escape(f.a)}</p>
      </section>`)
  .join('')

const bodyHtml = `
<article id="sr-prerender" itemscope itemtype="https://schema.org/Article">
  <header>
    <p class="sr-prerender__eyebrow">Сравнение CRM · конструктор Интеграм</p>
    <h1 itemprop="headline">Интеграм vs Битрикс24 и AmoCRM: что нельзя поменять в коробке</h1>
    <p class="sr-prerender__lead" itemprop="description">
      В Битрикс24 и AmoCRM есть вещи, которые нельзя изменить даже за деньги: они зашиты в ядро
      продукта. Типичный пример — переключение воронок и перенос лида из одной воронки в другую.
      Интеграм — это конструктор: модель данных, воронки и правила процесса настраиваются под вас,
      а не вы подстраиваетесь под чужую логику.
    </p>
  </header>
  <h2>Реальный случай: перенос лида между воронками</h2>
  <p>
    У клиента процесс продаж шёл через несколько воронок, и лид должен был переходить из одной в
    другую по ходу сделки. В коробочной CRM переключение воронок и перенос лида ограничены логикой
    продукта: теряются поля, история и связи, а доработка за деньги не помогает — это поведение ядра.
    На Интеграме воронка — это ваши поля и правила: перенос лида, свои этапы и условия переходов
    настраиваются запросом, история и связи сохраняются.
  </p>
  <h2>Что в коробочных CRM нельзя поменять даже за деньги</h2>
  ${lockedHtml}
  <section class="sr-prerender__group">
    <h2>Интеграм, Битрикс24 и AmoCRM — по пунктам</h2>
    <ul>${compareHtml}</ul>
  </section>
  <h2>Частые вопросы</h2>
  ${faqHtml}
  <footer class="sr-prerender__footer">
    <p>
      <a href="/crm-uchet-klientov.html">CRM-учёт клиентов на Интеграме</a> ·
      <a href="https://ideav.ru/start.html">Начать с Интеграмом</a> ·
      <a href="/resheniya.html">Все решения вместо Excel</a> ·
      <a href="/">На главную</a>
    </p>
  </footer>
</article>
<style>
  #sr-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #sr-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #sr-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #sr-prerender h3 { font-size: 1.1rem; margin: 1.5rem 0 0.25rem; }
  #sr-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #sr-prerender ul { line-height: 1.7; margin: 0.5rem 0; padding-left: 1.2rem; }
  #sr-prerender .sr-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #sr-prerender .sr-prerender__lead { font-size: 1.1rem; color: #475569; max-width: 50rem; }
  #sr-prerender .sr-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Dark colours follow the app theme (.dark on <html>, set synchronously by the
     inline <head> script from localStorage) — NOT prefers-color-scheme. */
  .dark #sr-prerender { color: #e2e8f0; }
  .dark #sr-prerender .sr-prerender__lead, .dark #sr-prerender .sr-prerender__footer { color: #94a3b8; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebPage + Article + FAQPage
// ───────────────────────────────────────────────────────────────────────────
const canonical = `${SITE}${PATH}`
const ogTitle = 'Интеграм vs Битрикс24 и AmoCRM: сравнение и альтернатива CRM-конструктор'
const ogDescription =
  'Чем Интеграм отличается от Битрикс24 и AmoCRM: в коробочных CRM часть логики нельзя изменить даже за деньги — например, перенос лида между воронками. Интеграм — конструктор: модель данных, воронки и правила процесса настраиваются под вас. Честное сравнение и альтернатива на собственном ядре.'
// SEO: <title> ≤ 60 симв. и <meta description> ≤ 158 (OG-теги ниже берут полные ogTitle/ogDescription)
const seoTitle = 'Интеграм vs Битрикс24 и AmoCRM — сравнение CRM'
const metaDescription =
  'Сравнение Интеграма с Битрикс24 и AmoCRM: что в коробочных CRM нельзя изменить даже за деньги (перенос лида между воронками) и когда нужен CRM-конструктор.'
const ogImage = `${SITE}/og/knowledge-base.png`
const ogImageW = 1200
const ogImageH = 630

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
//  Write dist/sravnenie-s-bitrix-amocrm.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-sravnenie: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-sravnenie: <div id="root"></div> not found in dist/index.html')
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

const outPath = resolve(dist, 'sravnenie-s-bitrix-amocrm.html')
writeFileSync(outPath, html)
console.log(`✓ sravnenie prerendered → dist/sravnenie-s-bitrix-amocrm.html (${html.length} bytes)`)
