#!/usr/bin/env node
/**
 * Post-build prerender посадочных с калькулятором потерь (python2node#1203):
 * /poisk-po-dokumentam.html, /planirovanie-zakupok.html, /platezhnyj-kalendar.html
 * и служебной /cost-of-inaction.html (noindex). Контент — из
 * src/data/lossLandings.mjs, тот же источник, что у React-страницы.
 *
 * Снапшот содержит форму калькулятора со значениями по умолчанию и уже
 * посчитанным итогом: краулер видит числа, React заменяет #root при загрузке.
 * Запускать ПОСЛЕ prerender-usecases.mjs и ДО prerender-landing.mjs (читает
 * чистый dist/index.html).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  LOSS_LANDINGS, LOSS_SITE, LOSS_CTA_URL, LOSS_PHONE, LOSS_EMAIL, LOSS_CALC_NOTE,
  LOSS_DEFAULT_CTA, LOSS_DEFAULT_RESULT_LABEL,
} from '../src/data/lossLandings.mjs'
import { computeLoss, defaultValues, formatPct, formatRub } from '../src/lib/lossCalc.mjs'

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const OG_IMAGE = `${LOSS_SITE}/og/knowledge-base.png`
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c])

const STYLE = `
<style>
  #loss-prerender { max-width: 64rem; margin: 0 auto; padding: 4rem 1rem 2rem;
    font-family: ui-sans-serif, system-ui, sans-serif; color: #1e293b; }
  #loss-prerender h1 { font-size: 2.2rem; line-height: 1.12; margin: 0.5rem 0 1rem; }
  #loss-prerender h2 { font-size: 1.4rem; margin: 2.25rem 0 0.75rem; }
  #loss-prerender h3, #loss-prerender h4 { font-size: 1.05rem; margin: 1.1rem 0 0.25rem; }
  #loss-prerender p, #loss-prerender li { line-height: 1.6; }
  #loss-prerender .loss-eyebrow { text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.72rem; color: #3b82f6; font-weight: 700; margin: 0; }
  #loss-prerender .loss-lead { font-size: 1.1rem; color: #475569; }
  #loss-prerender .loss-total { font-size: 2.2rem; font-weight: 800; color: #2563eb; margin: 0.25rem 0; }
  #loss-prerender table { border-collapse: collapse; width: 100%; font-size: 0.92rem; }
  #loss-prerender td, #loss-prerender th { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; vertical-align: top; }
  #loss-prerender .loss-note { font-size: 0.85rem; color: #64748b; }
  .dark #loss-prerender { color: #e2e8f0; }
  .dark #loss-prerender .loss-lead, .dark #loss-prerender .loss-note { color: #94a3b8; }
  .dark #loss-prerender td, .dark #loss-prerender th { border-color: #1e293b; }
</style>`

function bodyFor(p) {
  const c = p.calc
  const r = computeLoss(c, defaultValues(c))
  const input = (f) => `<label for="${f.id}">${esc(f.label)}</label> <input id="${f.id}" type="number" min="0" step="${f.step ?? 1}" value="${f.value}" readonly /> ${esc(f.unit ?? '')}${f.hint ? ` <small>${esc(f.hint)}</small>` : ''}`
  const pains = p.pains
    ? `<h2>${esc(p.pains.title)}</h2><ul>${p.pains.items.map((x) => `<li><strong>${esc(x.title)}.</strong> ${esc(x.text)}</li>`).join('')}</ul>` : ''
  const k = p.case
  const kase = k
    ? `<h2 id="case">${esc(k.title)}</h2><p>${esc(k.segment)}</p><h3>${esc(k.headline)}</h3>` +
      k.story.map((s) => `<h4>${esc(s.h)}</h4><p>${esc(s.p)}</p>`).join('') +
      `<table><thead><tr>${k.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>` +
      k.table.map((x) => `<tr><td>${esc(x.metric)}</td><td>${esc(x.before)}</td><td>${esc(x.after)}</td></tr>`).join('') +
      `</tbody></table>${k.note ? `<p class="loss-note">${esc(k.note)}</p>` : ''}` : ''
  const steps = p.steps
    ? `<h2>${esc(p.steps.title)}</h2><ol>${p.steps.items.map((s) => `<li><strong>${esc(s.title)}.</strong> ${esc(s.text)}</li>`).join('')}</ol>` : ''
  const faq = p.faq?.length
    ? `<h2 id="faq">Частые вопросы</h2>${p.faq.map((f) => `<section><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></section>`).join('')}` : ''
  const related = p.related.map((x) => `<a href="${esc(x.href)}">${esc(x.label)}</a>`).join(' · ')
  const cta = c.ctaText ?? LOSS_DEFAULT_CTA
  return `
<article id="loss-prerender">
  <header>
    <p class="loss-eyebrow">${esc(p.kicker)}</p>
    <h1>${esc(p.h1)}</h1>
    <p class="loss-lead">${esc(p.lead)}</p>
    <p><a href="#calc">${esc(p.heroCta ?? 'Посчитать потери')}</a>${k ? ` · <a href="#case">${esc(p.heroCta2 ?? 'Пример внедрения')}</a>` : ''}</p>
  </header>
  ${pains}
  <section id="calc">
    <h2>${esc(c.title)}</h2>
    ${c.fields.map((f) => `<p>${input(f)}</p>`).join('')}
    <details><summary>Допущения расчёта</summary>${c.assumptions.map((f) => `<p>${input(f)}</p>`).join('')}${c.parts.map((x) => `<p><strong>${esc(x.label)}</strong> = ${esc(x.text)}</p>`).join('')}</details>
    <p>${esc(c.resultLabel ?? LOSS_DEFAULT_RESULT_LABEL)}</p>
    <p class="loss-total">${formatRub(r.total)}</p>
    <p>${r.share !== null ? `${formatPct(r.share)} ${esc(c.baseLabel ?? '')} · ` : ''}${formatRub(r.perMonth)} в месяц</p>
    <ul>${c.parts.map((x, i) => `<li>${esc(x.label)}: <strong>${formatRub(r.parts[i])}</strong></li>`).join('')}</ul>
    <p><a href="${LOSS_CTA_URL}">${esc(cta)}</a> · <a href="${LOSS_PHONE.href}">${LOSS_PHONE.text}</a> · <a href="mailto:${LOSS_EMAIL}">${LOSS_EMAIL}</a></p>
    <p class="loss-note">${esc(LOSS_CALC_NOTE)}</p>
  </section>
  ${kase}${steps}${faq}
  <h2>${esc(p.final.title)}</h2>
  <p>${esc(p.final.text)}</p>
  <p><a href="${LOSS_CTA_URL}">${esc(cta)}</a></p>
  <footer><p>${related}${related ? ' · ' : ''}<a href="/resheniya.html">Все решения вместо Excel</a> · <a href="/">На главную</a></p></footer>
</article>${STYLE}`
}

function headFor(p, canonical) {
  const crumbs = p.indexable
    ? [['Интеграм', `${LOSS_SITE}/`], ['Решения', `${LOSS_SITE}/resheniya.html`], [p.navTitle, canonical]]
    : [['Интеграм', `${LOSS_SITE}/`], [p.navTitle, canonical]]
  const graph = [
    { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: p.seoTitle, description: p.metaDescription, inLanguage: 'ru', isPartOf: { '@id': `${LOSS_SITE}/#website` } },
    { '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`, itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
  ]
  if (p.indexable) graph.push({ '@type': 'Service', '@id': `${canonical}#service`, name: p.navTitle, serviceType: p.kicker, provider: { '@id': `${LOSS_SITE}/#organization` }, areaServed: 'RU', url: canonical, description: p.metaDescription })
  if (p.faq?.length) graph.push({ '@type': 'FAQPage', '@id': `${canonical}#faq`, mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) })
  return [
    `<link rel="canonical" href="${esc(canonical)}" />`,
    p.indexable ? '' : '<meta name="robots" content="noindex, nofollow" />',
    '<meta property="og:type" content="website" />',
    `<meta property="og:url" content="${esc(canonical)}" />`,
    `<meta property="og:title" content="${esc(p.seoTitle)}" />`,
    `<meta property="og:description" content="${esc(p.metaDescription)}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:locale" content="ru_RU" />',
    '<meta property="og:site_name" content="Интеграм" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(p.seoTitle)}" />`,
    `<meta name="twitter:description" content="${esc(p.metaDescription)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`,
  ].filter(Boolean).join('\n    ')
}

const source = readFileSync(resolve(dist, 'index.html'), 'utf8')
if (source.includes('id="lp-prerender"')) {
  console.error('✗ prerender-loss-landings: dist/index.html уже содержит снапшот главной — запускать ДО prerender-landing.mjs')
  process.exit(1)
}
if (!source.includes('<div id="root"></div>')) {
  console.error('✗ prerender-loss-landings: <div id="root"></div> не найден в dist/index.html')
  process.exit(1)
}
for (const p of LOSS_LANDINGS) {
  const canonical = `${LOSS_SITE}/${p.slug}.html`
  const html = source
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${esc(p.seoTitle)}</title>`)
    .replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${esc(p.metaDescription)}" />`)
    .replace('</head>', () => `    ${headFor(p, canonical)}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${bodyFor(p)}</div>`)
  writeFileSync(resolve(dist, `${p.slug}.html`), html)
  console.log(`✓ loss landing prerendered → dist/${p.slug}.html${p.indexable ? '' : ' (noindex)'}`)
}
