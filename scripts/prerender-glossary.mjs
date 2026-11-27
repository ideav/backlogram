#!/usr/bin/env node
/**
 * Post-build prerender for the glossary `/slovar-terminov.html` (backlogram#1032).
 *
 * Словарь собирает термины со всех страниц сайта: помощь, справочник API,
 * база знаний, лендинги и каталог решений ideav.ru/solutions. Как остальные
 * снапшоты: SPA отдаёт пустой <div id="root"></div>, а определения должны быть
 * в самом HTTP-ответе — их читают краулеры, клиенты без JS и ИИ-агенты.
 * Разметка — <dl> + JSON-LD DefinedTermSet, у каждого термина свой якорь.
 *
 * Данные — src/data/glossary.mjs, общий источник с src/pages/Glossary.tsx.
 *
 * Должен выполняться ПОСЛЕ vite build и ДО prerender-landing.mjs: он читает
 * ещё чистый dist/index.html (пререндер главной перезаписывает index.html
 * последним).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EMPTY_ROOT, rootWithMain } from './lib/root-main.mjs'
import {
  GLOSSARY_META,
  GLOSSARY_INTRO,
  GLOSSARY_GROUPS,
  GLOSSARY_TERMS,
  glossaryByLetter,
} from '../src/data/glossary.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const SITE = 'https://ideav.ru'
const PUBLISHER = 'Интеграм'
const PATH = GLOSSARY_META.path
const canonical = `${SITE}${PATH}`

function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]))
}

/** `код` → <code>, остальное экранируется. */
function inline(text) {
  return String(text).split(/(`[^`]+`)/g)
    .map((p) => (p.length > 1 && p.startsWith('`') && p.endsWith('`') ? `<code>${escape(p.slice(1, -1))}</code>` : escape(p)))
    .join('')
}

/** Текст без разметки — для JSON-LD. */
const plain = (text) => String(text).replace(/`/g, '')

const groupTitle = new Map(GLOSSARY_GROUPS.map((g) => [g.id, g.title]))
const letters = glossaryByLetter()

const indexHtml = letters
  .map((l) => `<a href="#letter-${escape(l.letter)}">${escape(l.letter)}</a>`)
  .join(' ')

const lettersHtml = letters.map((l) => `
  <section id="letter-${escape(l.letter)}">
    <h2>${escape(l.letter)}</h2>
    <dl>
${l.terms.map((t) => {
    const aka = t.aka && t.aka.length ? ` <span class="gl-prerender__aka">· ${escape(t.aka.join(', '))}</span>` : ''
    const src = (t.sources || []).slice(0, 3)
      .map((s) => `<a href="${escape(s.url)}">${escape(s.title)}</a>`).join(' · ')
    return `      <div id="${escape(t.id)}">
        <dt><a href="#${escape(t.id)}">${escape(t.term)}</a>${aka}</dt>
        <dd>${inline(t.text)}</dd>
        <dd class="gl-prerender__src">${escape(groupTitle.get(t.group) || '')}${src ? ` · ${src}` : ''}</dd>
      </div>`
  }).join('\n')}
    </dl>
  </section>`).join('\n')

const bodyHtml = `
<article id="gl-prerender">
  <header>
    <nav class="gl-prerender__crumbs" aria-label="Хлебные крошки">
      <a href="/">Интеграм</a> / <a href="/help.html">Помощь</a> / <span>Словарь терминов</span>
    </nav>
    <p class="gl-prerender__eyebrow">${GLOSSARY_TERMS.length} терминов</p>
    <h1>Словарь терминов</h1>
    <p class="gl-prerender__lead">${escape(GLOSSARY_INTRO)}</p>
  </header>
  <nav class="gl-prerender__index" aria-label="Алфавитный указатель">${indexHtml}</nav>
${lettersHtml}
  <footer class="gl-prerender__footer">
    <p>
      <a href="/help.html">Помощь</a> ·
      <a href="/knowledge-base.html">База знаний</a> ·
      <a href="/api.html">API для разработчиков</a> ·
      <a href="https://ideav.ru/solutions/catalog">Каталог решений</a>
    </p>
  </footer>
</article>
<style>
  #gl-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #gl-prerender h1 { font-size: 2.2rem; line-height: 1.15; margin: 0.5rem 0 0.75rem; }
  #gl-prerender h2 { font-size: 1.5rem; color: #3b82f6; margin: 2rem 0 0.75rem; }
  #gl-prerender p, #gl-prerender dd { line-height: 1.65; margin: 0.35rem 0; }
  #gl-prerender a { color: #2563eb; }
  #gl-prerender dl > div { margin: 0 0 1.25rem; }
  #gl-prerender dt { font-weight: 600; }
  #gl-prerender dt a { color: inherit; text-decoration: none; }
  #gl-prerender code { background: #f1f5f9; padding: 0 0.25rem; border-radius: 0.25rem; }
  #gl-prerender .gl-prerender__aka, #gl-prerender .gl-prerender__src { color: #64748b; font-weight: 400; font-size: 0.9rem; }
  #gl-prerender .gl-prerender__crumbs { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1rem; }
  #gl-prerender .gl-prerender__eyebrow { text-transform: uppercase; letter-spacing: 0.1em;
    font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #gl-prerender .gl-prerender__lead { font-size: 1.05rem; color: #475569; max-width: 50rem; }
  #gl-prerender .gl-prerender__index { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1.5rem 0; }
  #gl-prerender .gl-prerender__footer { margin-top: 2rem; padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0; font-size: 0.92rem; color: #475569; }
  .dark #gl-prerender { color: #e2e8f0; }
  .dark #gl-prerender code { background: #1e293b; }
  .dark #gl-prerender .gl-prerender__lead, .dark #gl-prerender .gl-prerender__footer { color: #94a3b8; }
</style>`

const ogImage = `${SITE}/og/knowledge-base.png`
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'DefinedTermSet',
      '@id': `${canonical}#termset`,
      url: canonical,
      name: 'Словарь терминов Интеграма',
      description: GLOSSARY_META.description,
      inLanguage: 'ru',
      isPartOf: { '@id': `${SITE}/#website` },
      publisher: { '@id': `${SITE}/#organization` },
      hasDefinedTerm: GLOSSARY_TERMS.map((t) => ({
        '@type': 'DefinedTerm',
        '@id': `${canonical}#${t.id}`,
        name: t.term,
        ...(t.aka && t.aka.length ? { alternateName: t.aka } : {}),
        description: plain(t.text),
        url: `${canonical}#${t.id}`,
        inDefinedTermSet: `${canonical}#termset`,
      })),
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Интеграм', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Помощь', item: `${SITE}/help.html` },
        { '@type': 'ListItem', position: 3, name: 'Словарь терминов', item: canonical },
      ],
    },
  ],
}

const headTags = [
  `<link rel="canonical" href="${escape(canonical)}" />`,
  `<meta property="og:type" content="article" />`,
  `<meta property="og:url" content="${escape(canonical)}" />`,
  `<meta property="og:title" content="${escape(GLOSSARY_META.title)}" />`,
  `<meta property="og:description" content="${escape(GLOSSARY_META.description)}" />`,
  `<meta property="og:image" content="${escape(ogImage)}" />`,
  `<meta property="og:image:width" content="1200" />`,
  `<meta property="og:image:height" content="630" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:site_name" content="${PUBLISHER}" />`,
  `<meta name="twitter:card" content="summary_large_image" />`,
  `<meta name="twitter:title" content="${escape(GLOSSARY_META.title)}" />`,
  `<meta name="twitter:description" content="${escape(GLOSSARY_META.description)}" />`,
  `<meta name="twitter:image" content="${escape(ogImage)}" />`,
  `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
].join('\n    ')

const indexPath = resolve(dist, 'index.html')
const source = readFileSync(indexPath, 'utf8')
if (source.includes('id="lp-prerender"')) {
  console.error('✗ prerender-glossary: dist/index.html already carries the landing snapshot — run this BEFORE prerender-landing.mjs')
  process.exit(1)
}
if (!source.includes(EMPTY_ROOT)) {
  console.error('✗ prerender-glossary: <div id="root"></div> not found in dist/index.html')
  process.exit(1)
}

const html = source
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(GLOSSARY_META.title)}</title>`)
  .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escape(GLOSSARY_META.description)}" />`)
  .replace(/<meta name="keywords"[^>]*>/, `<meta name="keywords" content="${escape(GLOSSARY_META.keywords)}" />`)
  .replace('</head>', `    ${headTags}\n  </head>`)
  .replace(EMPTY_ROOT, rootWithMain(bodyHtml))

const outName = PATH.replace(/^\//, '')
writeFileSync(resolve(dist, outName), html)
console.log(`✓ glossary prerendered → dist/${outName} (${GLOSSARY_TERMS.length} terms, ${html.length} bytes)`)
