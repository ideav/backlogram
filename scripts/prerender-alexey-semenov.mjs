#!/usr/bin/env node
/**
 * Post-build prerender персональной страницы `/alexey-semenov.html`
 * (SPA-роут, компонент src/pages/AlexeySemenov.tsx) — issue #553.
 *
 * Без этого шага страница отдаётся SPA-фолбэком (голый dist/index.html), и по
 * ссылке из профиля Хабра и краулер, и человек с отключённым JS увидят ГЛАВНУЮ:
 * её <title> и её содержимое (issue #418). Для ссылки, которая ставится в профиль
 * вместо лендинга, это ровно то, чего быть не должно.
 *
 * Пишет sibling dist/alexey-semenov.html из чистого dist/index.html: свой <title>,
 * description, canonical, Open Graph и JSON-LD `Person` + статический снимок в
 * #root. React при загрузке заменяет #root живым SPA — снимок живёт только в
 * HTTP-ответе для краулера.
 *
 * Запускать ПОСЛЕ prerender-knowledge-base.mjs и ДО prerender-landing.mjs:
 * landing перезаписывает dist/index.html последним, вставляя свой #lp-prerender.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const PATH = '/alexey-semenov.html'

const PERSON = 'Алексей Семёнов'
const ROLE = 'Основатель Интеграма'
const TELEGRAM = 'qdmadept'
const EMAIL = 'abc@integram.io'
const PHONE_HREF = '+79955060167'
const PHONE_TEXT = '+7 (995) 506-01-67'

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
//  Статический снимок — зеркалит src/pages/AlexeySemenov.tsx.
//  Ни цен, ни услуг, ни призывов: страница персональная, и это её смысл (#553).
// ───────────────────────────────────────────────────────────────────────────
const bodyHtml = `
<article id="as-prerender">
  <p class="as-prerender__eyebrow">Персональная страница</p>
  <h1>${escape(PERSON)}</h1>
  <p class="as-prerender__lead">${escape(ROLE)} — конструктора, в котором бизнес-приложение собирается из описания задачи.</p>
  <p>Занимаюсь платформой и тем, что вокруг неё: разбираю задачи из практики, меряю, что получается, и пишу об этом — включая случаи, когда получается не так, как задумывалось.</p>
  <p>Пишу и отвечаю сам. Если у вас вопрос по платформе, задача или замечание — напишите любым удобным способом.</p>
  <h2>Контакты</h2>
  <ul class="as-prerender__contacts">
    <li><a href="https://t.me/${escape(TELEGRAM)}" rel="me">@${escape(TELEGRAM)}</a> — Telegram</li>
    <li><a href="mailto:${escape(EMAIL)}">${escape(EMAIL)}</a> — почта</li>
    <li><a href="tel:${escape(PHONE_HREF)}">${escape(PHONE_TEXT)}</a> — телефон</li>
  </ul>
  <footer class="as-prerender__footer">
    <p>АО «Интеграм», ИНН 9716002710, ОГРН 1247700757590.</p>
  </footer>
</article>
<style>
  #as-prerender { max-width: 42rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #as-prerender h1 { font-size: 2.4rem; line-height: 1.1; margin: 0.5rem 0 1rem; }
  #as-prerender h2 { font-size: 1.35rem; margin: 2.25rem 0 0.5rem; }
  #as-prerender p  { line-height: 1.6; margin: 0.5rem 0; }
  #as-prerender .as-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #as-prerender .as-prerender__lead { font-size: 1.1rem; color: #475569; }
  #as-prerender .as-prerender__contacts { line-height: 1.9; margin: 0.5rem 0; padding-left: 1.2rem; }
  #as-prerender .as-prerender__footer { margin-top: 3rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.88rem; color: #64748b; }
  /* Тёмная тема — по классу .dark на <html> (его ставит синхронный скрипт в <head>
     из localStorage), а НЕ по prefers-color-scheme: так же, как на прочих страницах. */
  .dark #as-prerender { color: #e2e8f0; }
  .dark #as-prerender .as-prerender__lead, .dark #as-prerender .as-prerender__footer { color: #94a3b8; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Разметка данных: Person + ProfilePage. Именно её ждёт площадка, проверяющая
//  «персональный сайт с контактами», и поисковик — от страницы про человека.
// ───────────────────────────────────────────────────────────────────────────
const canonical = `${SITE}${PATH}`
// Тексты пишем ЯВНО, а не собираем из PERSON/ROLE: склонение по-русски механически не выводится
// («страница Алексей Семёнов» вместо «Алексея Семёнова»), а toLowerCase() портит бренд
// («основатель интеграма»). Оба дефекта были в первой сборке этой страницы.
const seoTitle = 'Алексей Семёнов — контакты'
const ogTitle = 'Алексей Семёнов — основатель Интеграма'
const ogDescription =
  'Персональная страница Алексея Семёнова: чем занимаюсь и как со мной связаться — Telegram, почта, телефон.'
const metaDescription =
  'Персональная страница Алексея Семёнова, основателя Интеграма. Контакты для связи: Telegram, почта, телефон.'
const ogImage = `${SITE}/og/home.png`

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfilePage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: seoTitle,
      description: ogDescription,
      inLanguage: 'ru',
      isPartOf: { '@id': `${SITE}/#website` },
      mainEntity: { '@id': `${canonical}#person` },
    },
    {
      '@type': 'Person',
      '@id': `${canonical}#person`,
      name: PERSON,
      jobTitle: ROLE,
      url: canonical,
      email: `mailto:${EMAIL}`,
      telephone: PHONE_HREF,
      sameAs: [`https://t.me/${TELEGRAM}`],
      worksFor: { '@type': 'Organization', name: PUBLISHER, url: `${SITE}/` },
    },
  ],
}

const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="profile" />`,
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
//  Пишем dist/alexey-semenov.html из чистой оболочки SPA
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-alexey-semenov: dist/index.html уже несёт снимок главной — запускать ДО prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-alexey-semenov: <div id="root"></div> не найден в dist/index.html')
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

const outPath = resolve(dist, 'alexey-semenov.html')
writeFileSync(outPath, html)
console.log(`✓ personal page prerendered → dist/alexey-semenov.html (${html.length} bytes)`)
