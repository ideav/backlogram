#!/usr/bin/env node
/**
 * Post-build prerender for the storage quiz (the SPA route
 * `/kvintety-ili-tablicy.html`, issue #605).
 *
 * Сам опросник интерактивный: галочки, счёт, вердикт — это React. Но содержание
 * страницы — тринадцать вопросов с баллами, часами и пояснениями — обязано быть
 * в самом HTTP-ответе: SPA отдаёт пустой <div id="root"></div>, у Яндекса
 * рендеринг JS ограничен, плюс клиенты без JS. Поэтому снапшот пишет ту же
 * таблицу целиком, что страница показывает внизу, — читать и печатать её можно
 * без единой строчки скрипта.
 *
 * Скрипт берёт чистый dist/index.html как шаблон и пишет соседний
 * dist/kvintety-ili-tablicy.html с <title>, meta description/keywords,
 * self-canonical (его требовал Яндекс.Вебмастер — issue #410), Open Graph +
 * Twitter Card, JSON-LD (WebPage + BreadcrumbList) и таблицей внутри #root.
 *
 * Вопросы, баллы, часы и правила счёта берутся из src/data/quintetsQuiz.mjs —
 * того же источника, что питает src/pages/KvintetyIliTablicy.tsx, поэтому
 * снапшот не может разойтись с React-версией.
 *
 * Должен выполняться ПОСЛЕ prerender-knowledge-base.mjs и ДО
 * prerender-landing.mjs: он читает ещё чистый dist/index.html (пререндер
 * главной перезаписывает index.html последним).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  QUIZ_META,
  QUIZ_INTRO,
  QUIZ_SOURCES,
  QUIZ_FOOTER,
  QUESTIONS,
  CROSS,
  points,
  hours,
  rescue,
  ceilings,
  worstHours,
  hoursLabel,
} from '../src/data/quintetsQuiz.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const PATH = QUIZ_META.path

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

/** Пояснение к ответу: `{link}` разворачивается в <a>, остальное экранируется. */
function noteHtml(option) {
  const text = option[3] ?? ''
  const link = option[4]
  if (!link) return escape(text)
  const [before, after = ''] = text.split('{link}')
  return `${escape(before)}<a href="${escape(link.href)}">${escape(link.text)}</a>${escape(after)}`
}

// ───────────────────────────────────────────────────────────────────────────
//  Статический снапшот — те же данные, что рендерит KvintetyIliTablicy.tsx
// ───────────────────────────────────────────────────────────────────────────
const introHtml = QUIZ_INTRO
  .map(([head, body]) => `<p><b>${escape(head)}</b> ${escape(body)}</p>`)
  .join('\n    ')

const sourcesHtml = QUIZ_SOURCES.map((s) => `<li>${escape(s)}</li>`).join('\n      ')

const rowsHtml = QUESTIONS.flatMap((q, qi) =>
  q.o.map((o, oi) => {
    const p = points(o, q.w)
    const h = hours(o)
    const noPenalty = rescue(o[1][0], o[1][1], q.w)
    const head =
      oi === 0
        ? `<td rowspan="${q.o.length}" class="n">${qi + 1}</td>` +
          `<td rowspan="${q.o.length}"><b>${escape(q.t)}</b><br><small>вес ${q.w}</small></td>`
        : ''
    const pointCells = p
      .map((val, i) => `<td class="n${val === 0 ? ' zero' : ''}${i === 2 && noPenalty ? ' free' : ''}">${val}</td>`)
      .join('')
    const hourCells = h.map((val) => `<td class="n mute">${escape(hoursLabel(val))}</td>`).join('')
    return `<tr>${head}<td>${escape(o[0])}</td>${pointCells}${hourCells}<td>${noteHtml(o)}</td></tr>`
  }),
).join('\n      ')

const ceil = ceilings()
const worst = worstHours()

const totalsHtml =
  `<tr class="tot"><th colspan="3">Потолок баллов и самый трудоёмкий набор ответов</th>` +
  ceil.map((c) => `<th class="n">${c}</th>`).join('') +
  worst.map((c) => `<th class="n">${c} ч</th>`).join('') +
  `<th>у комбинации потолок баллов ниже ста по устройству шкалы, а к часам добавлена надбавка за стык</th></tr>`

const crossHtml = CROSS.map(
  (c) =>
    `<tr class="cross"><td colspan="3"><b>${escape(c.title)}</b></td>` +
    `<td class="n" colspan="3">баллы не меняются</td>` +
    c.add.map((v) => `<td class="n mute">${v ? `+${v} ч` : '—'}</td>`).join('') +
    `<td>${escape(c.why)}</td></tr>`,
).join('\n      ')

const footerLinksHtml = QUIZ_FOOTER.links
  .map((l) => `<a href="${escape(l.href)}">${escape(l.text)}</a>`)
  .join(' · ')

const h1Head = QUIZ_META.h1.slice(0, QUIZ_META.h1.length - QUIZ_META.h1Accent.length)
const canonical = `${SITE}${PATH}`

const bodyHtml = `
<article id="qz-prerender" itemscope itemtype="https://schema.org/WebPage">
  <header>
    <nav class="qz-prerender__crumbs" aria-label="Хлебные крошки">
      <a href="/">Интеграм</a> / <span>Квинтеты или таблицы</span>
    </nav>
    <p class="qz-prerender__eyebrow">Опросник по архитектуре хранения</p>
    <h1 itemprop="headline">${escape(h1Head)}<span>${escape(QUIZ_META.h1Accent)}</span></h1>
    <p class="qz-prerender__lead" itemprop="description">${escape(QUIZ_META.lead)}</p>
    ${introHtml}
    <details>
      <summary>Откуда взяты часы</summary>
      <ul>
      ${sourcesHtml}
      </ul>
    </details>
  </header>
  <h2>Таблица баллов и часов целиком</h2>
  <p>Отметьте по одному ответу в каждом вопросе, сложите баллы и сложите часы. Подсвеченная клетка — комбинация без штрафа в баллах: один из чистых вариантов вопрос не тянет. Часы — человеко-часы за 36 месяцев, «—» значит «так не делается».</p>
  <div class="qz-prerender__wrap">
    <table>
      <thead>
        <tr>
          <th rowspan="2">№</th><th rowspan="2">Вопрос</th><th rowspan="2">Ответ</th>
          <th colspan="3">Баллы</th><th colspan="3">Человеко-часы за 3 года</th>
          <th rowspan="2">Почему</th>
        </tr>
        <tr>
          <th class="n">Кв.</th><th class="n">РСУБД</th><th class="n">Комб.</th>
          <th class="n">Кв.</th><th class="n">РСУБД</th><th class="n">Комб.</th>
        </tr>
      </thead>
      <tbody>
      ${rowsHtml}
      ${totalsHtml}
      ${crossHtml}
      </tbody>
    </table>
  </div>
  <footer class="qz-prerender__footer">
    <p>${escape(QUIZ_FOOTER.text)}</p>
    <p>${footerLinksHtml} · <a href="/">На главную</a></p>
  </footer>
</article>
<style>
  #qz-prerender { max-width: 72rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #qz-prerender h1 { font-size: 2.2rem; line-height: 1.15; margin: 0.5rem 0 0.75rem; }
  #qz-prerender h1 span { color: #3b82f6; }
  #qz-prerender h2 { font-size: 1.4rem; margin: 2rem 0 0.5rem; }
  #qz-prerender p  { line-height: 1.65; margin: 0.5rem 0; max-width: 52rem; }
  #qz-prerender a  { color: #2563eb; }
  #qz-prerender .qz-prerender__crumbs { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1rem; }
  #qz-prerender .qz-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #qz-prerender .qz-prerender__lead { font-size: 1.05rem; color: #475569; }
  #qz-prerender details { margin: 1rem 0; font-size: 0.9rem; color: #475569; }
  #qz-prerender details summary { cursor: pointer; color: #1e293b; }
  #qz-prerender details li { margin: 0.4rem 0; line-height: 1.6; }
  #qz-prerender .qz-prerender__wrap { overflow-x: auto; margin: 1rem 0; }
  #qz-prerender table { border-collapse: collapse; width: 100%; min-width: 60rem;
    font-size: 0.8rem; }
  #qz-prerender th, #qz-prerender td { border: 1px solid #e2e8f0; padding: 0.4rem 0.5rem;
    vertical-align: top; text-align: left; }
  #qz-prerender thead th, #qz-prerender .tot th { background: #f1f5f9; }
  #qz-prerender td.n, #qz-prerender th.n { text-align: right; font-variant-numeric: tabular-nums;
    white-space: nowrap; }
  #qz-prerender td.mute { color: #64748b; }
  #qz-prerender td.zero { color: #e11d48; font-weight: 700; }
  #qz-prerender td.free, #qz-prerender .cross td { background: #fffbeb; }
  #qz-prerender .qz-prerender__footer { margin-top: 2rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Тёмная тема идёт от .dark на <html> (его синхронно ставит инлайновый скрипт
     в <head> по localStorage), а не от prefers-color-scheme — как в остальных
     снапшотах. */
  .dark #qz-prerender { color: #e2e8f0; }
  .dark #qz-prerender .qz-prerender__lead, .dark #qz-prerender details,
  .dark #qz-prerender .qz-prerender__footer { color: #94a3b8; }
  .dark #qz-prerender details summary { color: #e2e8f0; }
  .dark #qz-prerender th, .dark #qz-prerender td { border-color: #1e293b; }
  .dark #qz-prerender thead th, .dark #qz-prerender .tot th { background: #0f172a; }
  .dark #qz-prerender td.mute { color: #94a3b8; }
  .dark #qz-prerender td.free, .dark #qz-prerender .cross td { background: #422006; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: WebPage + BreadcrumbList
// ───────────────────────────────────────────────────────────────────────────
const ogImage = `${SITE}/og/kvintety-ili-tablicy.png`
const ogImageW = 1200
const ogImageH = 630

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: QUIZ_META.title,
      description: QUIZ_META.description,
      inLanguage: 'ru',
      isPartOf: { '@id': `${SITE}/#website` },
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: QUIZ_META.h1, item: canonical },
      ],
    },
  ],
}

const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="article" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(QUIZ_META.title)}" />`,
  `<meta property="og:description" content="${escape(QUIZ_META.description)}" />`,
  `<meta property="og:image" content="${escape(ogImage)}" />`,
  `<meta property="og:image:width" content="${ogImageW}" />`,
  `<meta property="og:image:height" content="${ogImageH}" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="${PUBLISHER}" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${escape(QUIZ_META.title)}" />`,
  `<meta name="twitter:description" content="${escape(QUIZ_META.description)}" />`,
  `<meta name="twitter:image" content="${escape(ogImage)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

// ───────────────────────────────────────────────────────────────────────────
//  Write dist/kvintety-ili-tablicy.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-kvintety: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-kvintety: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(QUIZ_META.title)}</title>`)
  .replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escape(QUIZ_META.description)}" />`,
  )
  .replace(
    /<meta name="keywords"[^>]*>/,
    `<meta name="keywords" content="${escape(QUIZ_META.keywords)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)

const outPath = resolve(dist, 'kvintety-ili-tablicy.html')
writeFileSync(outPath, html)
console.log(`✓ quintets quiz prerendered → dist/kvintety-ili-tablicy.html (${html.length} bytes)`)
