#!/usr/bin/env node
/**
 * Post-build prerender for the help center: хаб `/help.html` (backlogram#946,
 * эпик ideav/crm#5603) и страницы разделов `/help/<id>.html` (backlogram#961).
 *
 * Как prerender-api.mjs: SPA отдаёт пустой <div id="root"></div>, а сайт
 * помощи должен быть в самом HTTP-ответе — его читают краулеры, клиенты без
 * JS и ИИ-агенты. Текст берётся из src/data/helpCenter.mjs — того же
 * источника, что питает src/pages/HelpCenter.tsx и src/pages/HelpSection.tsx.
 *
 * Хаб — ликбез и оглавление со ссылками на разделы; сами приёмы живут только
 * на страницах разделов (одна страница на 374 приёма не ранжировалась, #959).
 * Старые адреса `/help.html#<приём>` уводит на раздел скрипт в <head> хаба.
 *
 * Должен выполняться ПОСЛЕ vite build и ДО prerender-landing.mjs: он читает
 * ещё чистый dist/index.html (пререндер главной перезаписывает index.html
 * последним).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HELP_API_TITLE, helpLevelLabel, helpSplitBlocks, HELP_META, HELP_INTRO, HELP_SECTIONS, helpCountLabel } from '../src/data/helpCenter.mjs'
import { docsRingHtml } from '../src/data/docsRing.mjs'
import { pageLinkAttrs } from '../src/data/pageTarget.mjs'
import { humanDate } from '../src/lib/dates.mjs'
import { EMPTY_ROOT, rootWithMain } from './lib/root-main.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const HUB = HELP_META.path
const HUB_URL = `${SITE}${HUB}`
const ID = 'help-prerender'
const ARTICLE_COUNT = HELP_SECTIONS.reduce((n, s) => n + s.articles.length, 0)

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

const link = (href, text, path) => `<a href="${escape(href)}"${pageLinkAttrs(href, path)}>${escape(text)}</a>`

function blockHtml(b, path) {
  switch (b.t) {
    case 'p':
      return `<p>${inline(b.text)}</p>`
    case 'note':
      return `<p class="api-prerender__note">${inline(b.text)}${b.link ? ` ${link(b.link.href, b.link.text, path)}` : ''}</p>`
    case 'list':
      return `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`
    case 'code':
      return `${b.label ? `<p class="api-prerender__label">${escape(b.label)}</p>` : ''}<pre><code>${escape(b.code)}</code></pre>`
    case 'table':
      return `<table><thead><tr>${b.head.map((h) => `<th>${escape(h)}</th>`).join('')}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`
    case 'img':
      return `<figure class="api-prerender__figure"><img src="${escape(b.src)}" alt="${escape(b.alt)}" loading="lazy" />${
        b.caption ? `<figcaption>${inline(b.caption)}</figcaption>` : ''
      }</figure>`
    default:
      throw new Error(`prerender-help: неизвестный блок ${b.t}`)
  }
}

/** Приём на странице раздела: заголовок второго уровня, сразу ответ, потом шаги. */
const articleHtml = (a, path, { ui, api } = helpSplitBlocks(a)) => `
    <article id="${a.id}">
      <h2>${escape(a.title)}</h2>
      ${a.level ? `<p class="api-prerender__label">${escape(helpLevelLabel(a))}</p>` : ''}
      <p>${inline(a.summary)}</p>
      ${a.steps?.length ? `<ol>${a.steps.map((s) => `<li>${inline(s)}</li>`).join('')}</ol>` : ''}
      ${ui.map((b) => blockHtml(b, path)).join('\n      ')}
      ${api.length ? `<section class="api-prerender__api"><p class="api-prerender__label">${escape(HELP_API_TITLE)}</p>${api.map((b) => blockHtml(b, path)).join('\n      ')}</section>` : ''}
      ${a.links?.length ? `<p>Подробнее: ${a.links.map((l) => link(l.href, l.text, path)).join(' · ')}</p>` : ''}
    </article>`

/** Плашка «работу делают ИИ-агенты» в начале хаба и раздела (#5626). */
const agentsHtml = (path) =>
  `<aside class="api-prerender__agents"><p><strong>${escape(HELP_INTRO.agents.title)}.</strong> ${inline(HELP_INTRO.agents.text)}</p><p>${HELP_INTRO.agents.links.map((l) => link(l.href, l.text, path)).join(' · ')}</p></aside>`

const freshness = (count) =>
  `<p class="api-prerender__label">${helpCountLabel(count)} по шагам · обновлено <time datetime="${HELP_META.updated}">${humanDate(HELP_META.updated)}</time></p>`

const footerHtml = `
  <footer class="api-prerender__footer">
    <p>
      <a href="/">На главную</a> ·
      <a href="${HUB}">Помощь</a> ·
      <a href="/api.html">Справочник API</a> ·
      <a href="/queries.html">Запросы</a> ·
      <a href="/templater.html">Шаблонизатор</a> ·
      <a href="/knowledge-base.html">База знаний</a>
    </p>
  </footer>`

const STYLE = `<style>
  #${ID} { max-width: 60rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #${ID} h1 { font-size: 2.2rem; line-height: 1.15; margin: 0.5rem 0 0.75rem; }
  #${ID} h2 { font-size: 1.5rem; margin: 2.25rem 0 0.75rem; }
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
  #${ID} .api-prerender__agents { border: 1px solid #a7f3d0; background: #ecfdf5; border-radius: 0.75rem; padding: 0.75rem 1rem; margin: 0.75rem 0; }
  .dark #${ID} .api-prerender__agents { border-color: #065f46; background: transparent; }
  #${ID} .api-prerender__api { border: 1px dashed #cbd5e1; border-radius: 0.75rem; padding: 0.75rem 1rem; margin: 0.75rem 0; }
  #${ID} .api-prerender__figure { margin: 0.75rem 0; }
  #${ID} .api-prerender__figure img { max-width: 100%; border: 1px solid #e2e8f0;
    border-radius: 0.75rem; height: auto; }
  #${ID} .api-prerender__figure figcaption { font-size: 0.85rem; color: #64748b;
    margin-top: 0.375rem; }
  .dark #${ID} .api-prerender__figure img { border-color: #334155; }
  .dark #${ID} .api-prerender__figure figcaption { color: #94a3b8; }
  #${ID} .docs-see-also { font-size: 0.92rem; margin: 1rem 0 0; }
  #${ID} .docs-see-also span { color: #64748b; }
  #${ID} .api-prerender__footer { margin-top: 2rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  /* Тёмная тема идёт от .dark на <html>, как в остальных снапшотах. */
  .dark #${ID} { color: #e2e8f0; }
  .dark #${ID} .api-prerender__lead, .dark #${ID} .api-prerender__footer { color: #94a3b8; }
  .dark #${ID} th, .dark #${ID} td { border-color: #334155; }
</style>`

const about = {
  '@type': 'SoftwareApplication',
  name: PUBLISHER,
  alternateName: 'Integram',
  applicationCategory: 'BusinessApplication',
  url: `${SITE}/`,
}
const org = { '@type': 'Organization', name: PUBLISHER, url: `${SITE}/` }

// ───────────────────────────────────────────────────────────────────────────
//  Хаб /help.html: ликбез и оглавление разделов (без текста приёмов)
// ───────────────────────────────────────────────────────────────────────────
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

const hubSectionsHtml = `
  <section id="sections">
    <h2>Разделы помощи</h2>${HELP_SECTIONS.map(
      (s) => `
    <section id="${s.id}">
      <h3><a href="${s.path}">${escape(s.title)}</a></h3>
      <p>${inline(s.lead)}</p>
      <ul>${s.articles.map((a) => `<li><a href="${s.path}#${a.id}">${escape(a.title)}</a></li>`).join('')}</ul>
    </section>`,
    ).join('')}
  </section>`

const hubBody = `
<article id="${ID}">
  <header>
    <nav class="api-prerender__crumbs" aria-label="Хлебные крошки">
      <a href="/">Интеграм</a> / <span>Помощь</span>
    </nav>
    <p class="api-prerender__eyebrow">Помощь по шагам</p>
    <h1>${escape(HELP_META.h1)}</h1>
    ${agentsHtml(HUB)}
    ${HELP_INTRO.lead.map((p) => `<p class="api-prerender__lead">${inline(p)}</p>`).join('\n    ')}
    ${freshness(ARTICLE_COUNT)}
    ${docsRingHtml(HUB)}
  </header>
  <nav class="api-prerender__toc" aria-label="Оглавление">
    <ol><li><a href="#basics">Что такое Интеграм</a></li>${HELP_SECTIONS.map((s) => `<li><a href="${s.path}">${escape(s.title)}</a> (${s.articles.length})</li>`).join('')}</ol>
  </nav>${introHtml}${hubSectionsHtml}${footerHtml}
</article>
${STYLE}`

const hubJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': `${HUB_URL}#page`,
      url: HUB_URL,
      name: HELP_META.title,
      headline: HELP_META.h1,
      description: HELP_META.description,
      inLanguage: 'ru',
      // Свежесть и картинка — сигналы для сниппета и ИИ-выдачи (backlogram#959).
      datePublished: HELP_META.published,
      dateModified: HELP_META.updated,
      image: `${SITE}/og/help.png`,
      isPartOf: { '@type': 'WebSite', '@id': `${SITE}/#website`, name: PUBLISHER, url: `${SITE}/` },
      author: org,
      publisher: org,
      about,
      keywords: HELP_META.keywords,
      // Разделы — отдельные страницы (backlogram#961).
      hasPart: HELP_SECTIONS.map((s) => ({
        '@type': 'TechArticle',
        '@id': `${SITE}${s.path}#article`,
        url: `${SITE}${s.path}`,
        name: s.title,
        description: s.description,
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${HUB_URL}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Помощь', item: HUB_URL },
      ],
    },
  ],
}

/**
 * Старые адреса /help.html#<приём> и /help.html#<раздел> (внешние ссылки,
 * закладки) → страница раздела. Якорь сервер не видит — только браузер.
 */
const sectionIds = HELP_SECTIONS.map((s) => s.id).join('|')
const hubRedirect = `<script>(function(){var h=decodeURIComponent(location.hash.slice(1));var m=/^(${sectionIds})(?:-|$)/.exec(h);if(m)location.replace('/help/'+m[1]+'.html'+location.search+(h===m[1]?'':'#'+h))})()</script>`

// ───────────────────────────────────────────────────────────────────────────
//  Страница раздела /help/<id>.html: все приёмы раздела по шагам
// ───────────────────────────────────────────────────────────────────────────
function sectionBody(s) {
  const others = HELP_SECTIONS.filter((x) => x.id !== s.id)
  return `
<article id="${ID}">
  <header>
    <nav class="api-prerender__crumbs" aria-label="Хлебные крошки">
      <a href="/">Интеграм</a> / <a href="${HUB}">Помощь</a> / <span>${escape(s.title)}</span>
    </nav>
    <p class="api-prerender__eyebrow">Помощь по шагам</p>
    <h1>${escape(s.title)}</h1>
    ${agentsHtml(s.path)}
    <p class="api-prerender__lead">${inline(s.lead)}</p>
    ${freshness(s.articles.length)}
    <p>Другие разделы: ${others.map((x) => `<a href="${x.path}">${escape(x.title)}</a>`).join(' · ')} · <a href="${HUB}">консультант и поиск</a></p>
  </header>
  <nav class="api-prerender__toc" aria-label="Оглавление">
    <ol>${s.articles.map((a) => `<li><a href="#${a.id}">${escape(a.title)}</a></li>`).join('')}</ol>
  </nav>${s.articles.map((a) => articleHtml(a, s.path)).join('')}${footerHtml}
</article>
${STYLE}`
}

function sectionJsonLd(s) {
  const url = `${SITE}${s.path}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        '@id': `${url}#article`,
        url,
        headline: s.title,
        name: s.pageTitle,
        description: s.description,
        inLanguage: 'ru',
        datePublished: HELP_META.published,
        dateModified: HELP_META.updated,
        image: `${SITE}/og/help-${s.id}.png`,
        isPartOf: { '@id': `${HUB_URL}#page` },
        author: org,
        publisher: org,
        about,
        abstract: plain(s.lead),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Помощь', item: HUB_URL },
          { '@type': 'ListItem', position: 3, name: s.title, item: url },
        ],
      },
    ],
  }
}

// ───────────────────────────────────────────────────────────────────────────
//  Запись страниц из чистой оболочки SPA
// ───────────────────────────────────────────────────────────────────────────
const source = readFileSync(resolve(dist, 'index.html'), 'utf8')
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

function page({ path, title, description, ogImage, jsonLd, body, extraHead = '' }) {
  const canonical = `${SITE}${path}`
  const headTags = [
    extraHead,
    `<link rel="canonical" href="${escape(canonical)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:url" content="${escape(canonical)}" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:image" content="${escape(ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="ru_RU" />`,
    `<meta property="og:site_name" content="${PUBLISHER}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(title)}" />`,
    `<meta name="twitter:description" content="${escape(description)}" />`,
    `<meta name="twitter:image" content="${escape(ogImage)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ')
  return source
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(description)}" />`)
    .replace(/<meta name="keywords"[^>]*>/, `<meta name="keywords" content="${escape(HELP_META.keywords)}" />`)
    .replace('</head>', `    ${headTags}\n  </head>`)
    // Функция замены: в тексте приёмов есть `$`, который строковая замена
    // прочла бы как ссылку на группу.
    // <main> — основной контент для экстракторов ИИ-поиска: меню inject-static-nav
    // встаёт перед ним первым ребёнком #root (backlogram#969). createRoot всё равно
    // заменяет содержимое #root целиком, гидратации нет.
    .replace(EMPTY_ROOT, rootWithMain(body))
}

const hubHtml = page({
  path: HUB,
  title: HELP_META.title,
  description: HELP_META.description,
  ogImage: `${SITE}/og/help.png`,
  jsonLd: hubJsonLd,
  body: hubBody,
  // Редирект — до всего остального, чтобы не грузить хаб зря.
  extraHead: hubRedirect,
})
writeFileSync(resolve(dist, 'help.html'), hubHtml)
console.log(`✓ help prerendered → dist/help.html (${hubHtml.length} bytes)`)

mkdirSync(resolve(dist, 'help'), { recursive: true })
for (const s of HELP_SECTIONS) {
  const html = page({
    path: s.path,
    title: s.pageTitle,
    description: s.description,
    ogImage: `${SITE}/og/help-${s.id}.png`,
    jsonLd: sectionJsonLd(s),
    body: sectionBody(s),
  })
  writeFileSync(resolve(dist, s.path.slice(1)), html)
  console.log(`✓ help prerendered → dist${s.path} (${html.length} bytes)`)
}
