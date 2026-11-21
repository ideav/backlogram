#!/usr/bin/env node
/**
 * Post-build prerender for the help center (the SPA route
 * `/help.html`, backlogram#946, epic ideav/crm#5603).
 *
 * Как prerender-api.mjs: SPA отдаёт пустой <div id="root"></div>, а сайт
 * помощи должен быть в самом HTTP-ответе — его читают краулеры, клиенты без
 * JS и ИИ-агенты. Текст берётся из src/data/helpCenter.mjs — того же
 * источника, что питает src/pages/HelpCenter.tsx.
 *
 * Должен выполняться ПОСЛЕ vite build и ДО prerender-landing.mjs: он читает
 * ещё чистый dist/index.html (пререндер главной перезаписывает index.html
 * последним).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HELP_META, HELP_INTRO, HELP_SECTIONS } from '../src/data/helpCenter.mjs'
import { docsRingHtml } from '../src/data/docsRing.mjs'
import { pageLinkAttrs } from '../src/data/pageTarget.mjs'
import { humanDate } from '../src/lib/dates.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const PATH = HELP_META.path
const ID = 'help-prerender'

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

/** Фрагменты в обратных кавычках — <code>, остальное экранируется. */
function inline(text) {
  return String(text)
    .split('`')
    .map((part, i) => (i % 2 === 1 ? `<code>${escape(part)}</code>` : escape(part)))
    .join('')
}

/** Текст без разметки обратных кавычек — для JSON-LD. */
const plain = (text) => String(text ?? '').replace(/`/g, '')

function blockHtml(b) {
  switch (b.t) {
    case 'p':
      return `<p>${inline(b.text)}</p>`
    case 'note':
      return `<p class="api-prerender__note">${inline(b.text)}${b.link ? ` <a href="${escape(b.link.href)}"${pageLinkAttrs(b.link.href, PATH)}>${escape(b.link.text)}</a>` : ''}</p>`
    case 'list':
      return `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`
    case 'code':
      return `${b.label ? `<p class="api-prerender__label">${escape(b.label)}</p>` : ''}<pre><code>${escape(b.code)}</code></pre>`
    case 'table':
      return `<table><thead><tr>${b.head.map((h) => `<th>${escape(h)}</th>`).join('')}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`
    default:
      throw new Error(`prerender-help: неизвестный блок ${b.t}`)
  }
}

// ───────────────────────────────────────────────────────────────────────────
//  Статический снапшот — тот же текст, что рендерит src/pages/HelpCenter.tsx
//  (консультант и поиск — только в SPA; здесь ликбез, оглавление и статьи)
// ───────────────────────────────────────────────────────────────────────────
const LEVEL = { start: 'в интерфейсе', pro: 'для разработчика' }
const ARTICLE_COUNT = HELP_SECTIONS.reduce((n, s) => n + s.articles.length, 0)

const tocHtml = [
  `<li><a href="#basics">Что такое Интеграм</a></li>`,
  ...HELP_SECTIONS.map(
    (s) =>
      `<li><a href="#${s.id}">${escape(s.title)}</a><ul>${s.articles
        .map((a) => `<li><a href="#${a.id}">${escape(a.title)}</a></li>`)
        .join('')}</ul></li>`,
  ),
].join('')

const introHtml = `
  <section id="basics">
    <h2>Что такое Интеграм</h2>${HELP_INTRO.blocks
      .map(
        (b) => `
    <section id="basics-${b.id}">
      <h3>${escape(b.title)}</h3>
      ${(b.paras ?? []).map((p) => `<p>${inline(p)}</p>`).join('')}
      ${b.layers ? `<dl>${b.layers.map((l) => `<dt>${escape(l.name)}</dt><dd>${inline(l.text)}</dd>`).join('')}</dl>` : ''}
      ${b.points ? `<ul>${b.points.map((p) => `<li>${inline(p)}</li>`).join('')}</ul>` : ''}
    </section>`,
      )
      .join('')}
    <h3>Словарик терминов</h3>
    <dl>${HELP_INTRO.glossary.map((g) => `<dt>${escape(g.term)}</dt><dd>${inline(g.text)}</dd>`).join('')}</dl>
  </section>`

const articleHtml = (a) => `
    <article id="${a.id}">
      <h3>${escape(a.title)}</h3>
      ${a.level ? `<p class="api-prerender__label">${escape(LEVEL[a.level] ?? a.level)}</p>` : ''}
      <p>${inline(a.summary)}</p>
      ${a.steps?.length ? `<ol>${a.steps.map((s) => `<li>${inline(s)}</li>`).join('')}</ol>` : ''}
      ${(a.blocks ?? []).map(blockHtml).join('\n      ')}
      ${a.links?.length ? `<p>Подробнее: ${a.links.map((l) => `<a href="${escape(l.href)}"${pageLinkAttrs(l.href, PATH)}>${escape(l.text)}</a>`).join(' · ')}</p>` : ''}
    </article>`

const sectionsHtml = HELP_SECTIONS.map(
  (s) => `
  <section id="${s.id}">
    <h2>${escape(s.title)}</h2>
    <p>${inline(s.lead)}</p>${s.articles.map(articleHtml).join('')}
  </section>`,
).join('')

const canonical = `${SITE}${PATH}`

const bodyHtml = `
<article id="${ID}">
  <header>
    <nav class="api-prerender__crumbs" aria-label="Хлебные крошки">
      <a href="/">Интеграм</a> / <span>Помощь</span>
    </nav>
    <p class="api-prerender__eyebrow">Помощь по шагам</p>
    <h1>${escape(HELP_META.h1)}</h1>
    ${HELP_INTRO.lead.map((p) => `<p class="api-prerender__lead">${inline(p)}</p>`).join('\n    ')}
    <p class="api-prerender__label">${ARTICLE_COUNT} приёмов по шагам · обновлено <time datetime="${HELP_META.updated}">${humanDate(HELP_META.updated)}</time></p>
    ${docsRingHtml(PATH)}
  </header>
  <nav class="api-prerender__toc" aria-label="Оглавление">
    <ol>${tocHtml}</ol>
  </nav>${introHtml}${sectionsHtml}
  <footer class="api-prerender__footer">
    <p>
      <a href="/">На главную</a> ·
      <a href="/api.html">Справочник API</a> ·
      <a href="/queries.html">Запросы</a> ·
      <a href="/templater.html">Шаблонизатор</a> ·
      <a href="/knowledge-base.html">База знаний</a>
    </p>
  </footer>
</article>
<style>
  #${ID} { max-width: 60rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #${ID} h1 { font-size: 2.2rem; line-height: 1.15; margin: 0.5rem 0 0.75rem; }
  #${ID} h2 { font-size: 1.6rem; margin: 2.5rem 0 1rem; }
  #${ID} h3 { font-size: 1.2rem; margin: 1.75rem 0 0.5rem; }
  #${ID} p, #${ID} li { line-height: 1.65; margin: 0.4rem 0; }
  #${ID} a { color: #2563eb; }
  #${ID} code { font-family: ui-monospace, monospace; font-size: 0.9em; }
  #${ID} pre { background: #0f172a; color: #f1f5f9; padding: 1rem; border-radius: 0.75rem;
    overflow-x: auto; font-size: 0.85rem; line-height: 1.5; }
  #${ID} table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
  #${ID} th, #${ID} td { border: 1px solid #e2e8f0; padding: 0.35rem 0.6rem;
    text-align: left; vertical-align: top; }
  #${ID} .api-prerender__crumbs { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1rem; }
  #${ID} .api-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #${ID} .api-prerender__lead { font-size: 1.05rem; color: #475569; }
  #${ID} .api-prerender__label { font-size: 0.8rem; color: #64748b; margin-bottom: 0; }
  #${ID} .api-prerender__note { border-left: 3px solid #f59e0b; padding-left: 0.75rem; }
  #${ID} .docs-see-also { font-size: 0.92rem; margin: 1rem 0 0; }
  #${ID} .docs-see-also span { color: #64748b; }
  #${ID} .api-prerender__footer { margin-top: 2rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Тёмная тема идёт от .dark на <html>, как в остальных снапшотах. */
  .dark #${ID} { color: #e2e8f0; }
  .dark #${ID} .api-prerender__lead, .dark #${ID} .api-prerender__footer { color: #94a3b8; }
  .dark #${ID} th, .dark #${ID} td { border-color: #334155; }
</style>`

// ───────────────────────────────────────────────────────────────────────────
//  Structured data: TechArticle + BreadcrumbList
// ───────────────────────────────────────────────────────────────────────────
const ogImage = `${SITE}/og/help.png`
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'TechArticle',
      '@id': `${canonical}#article`,
      url: canonical,
      headline: HELP_META.h1,
      name: HELP_META.title,
      description: HELP_META.description,
      inLanguage: 'ru',
      // Свежесть и картинка — сигналы для сниппета и ИИ-выдачи (backlogram#959).
      datePublished: HELP_META.published,
      dateModified: HELP_META.updated,
      image: ogImage,
      mainEntityOfPage: canonical,
      isPartOf: { '@type': 'WebSite', '@id': `${SITE}/#website`, name: PUBLISHER, url: `${SITE}/` },
      author: { '@type': 'Organization', name: PUBLISHER, url: `${SITE}/` },
      publisher: { '@type': 'Organization', name: PUBLISHER, url: `${SITE}/` },
      about: {
        '@type': 'SoftwareApplication',
        name: PUBLISHER,
        alternateName: 'Integram',
        applicationCategory: 'BusinessApplication',
        url: `${SITE}/`,
      },
      keywords: HELP_META.keywords,
      // Разделы с якорями: страница одна и длинная, по ним ИИ-ответ может
      // сослаться на нужное место, а не на шапку.
      hasPart: [
        { '@type': 'WebPageElement', '@id': `${canonical}#basics`, name: 'Что такое Интеграм', url: `${canonical}#basics` },
        ...HELP_SECTIONS.map((s) => ({
          '@type': 'WebPageElement',
          '@id': `${canonical}#${s.id}`,
          name: s.title,
          description: plain(s.lead),
          url: `${canonical}#${s.id}`,
        })),
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Помощь', item: canonical },
      ],
    },
  ],
}

const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="article" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(HELP_META.title)}" />`,
  `<meta property="og:description" content="${escape(HELP_META.description)}" />`,
  `<meta property="og:image" content="${escape(ogImage)}" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="${PUBLISHER}" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${escape(HELP_META.title)}" />`,
  `<meta name="twitter:description" content="${escape(HELP_META.description)}" />`,
  `<meta name="twitter:image" content="${escape(ogImage)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

// ───────────────────────────────────────────────────────────────────────────
//  Write dist/help.html from the clean SPA shell
// ───────────────────────────────────────────────────────────────────────────
const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')

if (source.includes('id="lp-prerender"')) {
  console.error(
    '✗ prerender-help: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs',
  )
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-help: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(HELP_META.title)}</title>`)
  .replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escape(HELP_META.description)}" />`,
  )
  .replace(
    /<meta name="keywords"[^>]*>/,
    `<meta name="keywords" content="${escape(HELP_META.keywords)}" />`,
  )
  .replace('</head>', `    ${headTags}\n  </head>`)
  // Функция замены: в тексте справочника есть `$`, который строковая замена
  // прочла бы как ссылку на группу.
  .replace('<div id="root"></div>', () => `<div id="root">${bodyHtml}</div>`)

const outPath = resolve(dist, 'help.html')
writeFileSync(outPath, html)
console.log(`✓ help prerendered → dist/help.html (${html.length} bytes)`)
