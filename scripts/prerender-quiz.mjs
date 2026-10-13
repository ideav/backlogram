#!/usr/bin/env node
/**
 * Post-build prerender for the project-estimate quiz page (/quiz.html, issue #745).
 *
 * Страница перенесена с заготовки ideav.ru/victor/: квиз интерактивный
 * (вопросы, оценка, заявка — это React), но содержание — hero с призывом,
 * боли, шаги работы и аудитория — обязано быть в самом HTTP-ответе: SPA отдаёт
 * пустой <div id="root"></div>, а JS у Яндекса и клиентов без JS ограничен.
 *
 * Тексты — из src/data/quizCalc.mjs, того же источника, что питает
 * src/pages/Quiz.tsx, поэтому снапшот не может разойтись со страницей.
 *
 * Must run AFTER vite build and BEFORE prerender-landing.mjs: it reads the
 * still-clean dist/index.html (prerender-landing overwrites the home page
 * last, injecting its own #lp-prerender content into #root).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  HERO_CHIPS,
  HERO_LEAD,
  AUDIENCE,
  PROBLEMS,
  QUIZ_META,
  STEPS,
} from '../src/data/quizCalc.mjs'

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

const canonical = `${SITE}${PATH}`

// ───────────────────────────────────────────────────────────────────────────
//  Static snapshot — mirrors src/pages/Quiz.tsx section headings.
// ───────────────────────────────────────────────────────────────────────────
const chipsHtml = HERO_CHIPS.map((c) => `<span class="qz-prerender__chip">${escape(c)}</span>`).join(' ')

const problemsHtml = PROBLEMS.map(
  (p) => `
      <section class="qz-prerender__group">
        <h3>${escape(p.h)}</h3>
        <p>${escape(p.p)}</p>
      </section>`,
).join('')

const stepsHtml = STEPS.map(
  (s, i) => `
      <section class="qz-prerender__group">
        <h3>${i + 1}. ${escape(s.h)} <small>(${escape(s.duration)})</small></h3>
        <p>${escape(s.p)}</p>
      </section>`,
).join('')

const audienceHtml = AUDIENCE.map((a) => `<li>${escape(a)}</li>`).join('\n        ')

const bodyHtml = `
<article id="qz-prerender">
  <header>
    <h1>${escape(QUIZ_META.h1)}</h1>
    <p class="qz-prerender__lead">${escape(HERO_LEAD)}</p>
    <p>${chipsHtml}</p>
  </header>
  <section class="qz-prerender__group">
    <h2>Как устроен расчёт</h2>
    <p>Два вопроса о задаче и масштабе команды — и на экране вилка бюджета и сроков: от «Базового» (от 75 000 ₽, 2–3 недели) до «Комплексного» (450 000 – 600 000 ₽, 10–16 недель). Дальше предлагаем короткий живой разговор — 15 минут, чтобы назвать точную цифру и понять друг друга. Расчёт бесплатный и ни к чему не обязывает.</p>
    <p>Квиз интерактивный: вопросы и оценка живут в JavaScript-версии страницы, этот текст — её статический снимок для чтения без JS.</p>
  </section>
  <section class="qz-prerender__group">
    <h2>Знакомо?</h2>${problemsHtml}
  </section>
  <section class="qz-prerender__group">
    <h2>От идеи до работающей системы — четыре шага</h2>${stepsHtml}
  </section>
  <section class="qz-prerender__group">
    <h2>Кому это подходит</h2>
    <ul>
        ${audienceHtml}
    </ul>
  </section>
</article>`

// ───────────────────────────────────────────────────────────────────────────
//  JSON-LD: WebPage + BreadcrumbList (разметка организации — как у соседних
//  страниц, ссылки publisher по @id разрешаются внутри графа).
// ───────────────────────────────────────────────────────────────────────────
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
      dateModified: QUIZ_META.updatedAt,
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: PUBLISHER,
      url: `${SITE}/`,
      logo: { '@type': 'ImageObject', url: `${SITE}/logos/integram-og.png` },
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
  `<meta property="og:type" content="website" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(QUIZ_META.title)}" />`,
  `<meta property="og:description" content="${escape(QUIZ_META.description)}" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="${PUBLISHER}" />`,
  `<meta name="twitter:card" content="summary" />`,
  `<meta name="twitter:title" content="${escape(QUIZ_META.title)}" />`,
  `<meta name="twitter:description" content="${escape(QUIZ_META.description)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

// ───────────────────────────────────────────────────────────────────────────
//  Write dist/quiz.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-quiz: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-quiz: <div id="root"></div> not found in dist/index.html')
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

const outPath = resolve(dist, 'quiz.html')
writeFileSync(outPath, html)
console.log(`✓ project quiz prerendered → dist/quiz.html (${html.length} bytes)`)
