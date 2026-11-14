#!/usr/bin/env node
/**
 * Post-build prerender /reshenie.html — одного шаблона посадочной для Директа
 * (python2node#1233). Снапшот — список задач (страница без ?f=) и тексты всех
 * фокусов; React по ?f= показывает нужный и подменяет H1 фразой из utm_term.
 * Страница рекламная: robots noindex, nofollow, в sitemap не входит.
 *
 * Запускать ДО prerender-landing.mjs (читает чистый dist/index.html).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FOCUS_HUB, FOCUS_LANDINGS, FOCUS_PATH, FOCUS_SITE } from '../src/data/focusLandings.mjs'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c])
const canonical = `${FOCUS_SITE}/${FOCUS_PATH}.html`

const STYLE = `
<style>
  #focus-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #focus-prerender h1 { font-size: 2.2rem; line-height: 1.12; margin: 0.5rem 0 1rem; }
  #focus-prerender h2 { font-size: 1.4rem; margin: 2.25rem 0 0.75rem; }
  #focus-prerender p, #focus-prerender li { line-height: 1.6; }
  #focus-prerender .focus-eyebrow { text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  .dark #focus-prerender { color: #e2e8f0; }
</style>`

function focusBlock(f) {
  return `<section id="f-${esc(f.id)}"><h2><a href="/${FOCUS_PATH}.html?f=${esc(f.id)}">${esc(f.navTitle)}</a></h2>` +
    `<p>${esc(f.lead)}</p><ul>${f.we.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` +
    `<p><em>${esc(f.case.segment)}.</em> ${esc(f.case.text)}</p></section>`
}

const body = `
<article id="focus-prerender">
  <header>
    <p class="focus-eyebrow">${esc(FOCUS_HUB.kicker)}</p>
    <h1>${esc(FOCUS_HUB.h1)}</h1>
    <p>${esc(FOCUS_HUB.lead)}</p>
  </header>
  ${FOCUS_LANDINGS.map(focusBlock).join('\n  ')}
  <footer><p><a href="/">На главную</a></p></footer>
</article>${STYLE}`

const source = readFileSync(resolve(dist, 'index.html'), 'utf8')
if (source.includes('id="lp-prerender"')) {
  console.error('✗ prerender-focus-landing: dist/index.html уже содержит снапшот главной — запускать ДО prerender-landing.mjs')
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-focus-landing: <div id="root"></div> не найден в dist/index.html')
  process.exit(1)
}
const html = source
  .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(FOCUS_HUB.seoTitle)}</title>`)
  .replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${esc(FOCUS_HUB.metaDescription)}" />`)
  // Один тег robots: дописанный рядом с index, follow противоречил бы ему.
  .replace(/<meta name="robots"[^>]*>/, () => '<meta name="robots" content="noindex, nofollow" />')
  .replace('</head>', () => `    <link rel="canonical" href="${esc(canonical)}" />\n  </head>`)
  .replace('<div id="root"></div>', () => `<div id="root">${body}</div>`)
if (!html.includes('noindex, nofollow')) {
  console.error('✗ prerender-focus-landing: в dist/index.html нет meta robots — noindex не поставлен')
  process.exit(1)
}
writeFileSync(resolve(dist, `${FOCUS_PATH}.html`), html)
console.log(`✓ focus landing prerendered → dist/${FOCUS_PATH}.html (noindex, ${FOCUS_LANDINGS.length} фокусов)`)
