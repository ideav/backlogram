#!/usr/bin/env node
/**
 * Страница integram.io/api.html — описание API ядра integram.io (backlogram#874).
 *
 * По подобию ideav.ru/api.html, но:
 *   • данные — src/data/apiDocsIo.mjs (ядро integram.io, не index.php ideav.ru);
 *   • без шапки и навигации сайта: одна самостоятельная страница справочника;
 *   • статический HTML без сборки: папка integram.io/ выкладывается как есть.
 *
 *   node scripts/build-integram-io-api.mjs          — записать integram.io/api.html
 *   node scripts/build-integram-io-api.mjs --check  — сверить файл с данными (тест, CI)
 *
 * Типографика (неразрывные пробелы) — тот же nbspHtml, что у страниц ideav.ru.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { API_IO_META, API_IO_INTRO, API_IO_SECTIONS, IO_SITE } from '../src/data/apiDocsIo.mjs'
import { escape, inline, tocHtml, sectionsHtml } from '../src/data/apiDocsHtml.mjs'
import { nbspHtml } from '../src/lib/typography.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = resolve(root, 'integram.io/api.html')
const canonical = `${IO_SITE}${API_IO_META.path}`
const CLS = 'api'

export function renderIoApiPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${canonical}#article`,
    url: canonical,
    headline: API_IO_META.h1,
    name: API_IO_META.title,
    description: API_IO_META.description,
    inLanguage: 'ru',
    publisher: { '@type': 'Organization', name: 'Интеграм', url: `${IO_SITE}/` },
    keywords: API_IO_META.keywords,
  }

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escape(API_IO_META.title)}</title>
<meta name="description" content="${escape(API_IO_META.description)}">
<meta name="keywords" content="${escape(API_IO_META.keywords)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="img/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${escape(API_IO_META.title)}">
<meta property="og:description" content="${escape(API_IO_META.description)}">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="Интеграм">
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
<style>
  :root { --fg: #1e293b; --muted: #475569; --faint: #64748b; --bg: #ffffff; --line: #e2e8f0;
    --link: #2563eb; --accent: #3b82f6; --code-bg: #0f172a; --code-fg: #f1f5f9; --inline-bg: #f1f5f9; }
  @media (prefers-color-scheme: dark) {
    :root { --fg: #e2e8f0; --muted: #94a3b8; --faint: #94a3b8; --bg: #0b1120; --line: #334155;
      --link: #60a5fa; --accent: #60a5fa; --code-bg: #020617; --code-fg: #e2e8f0; --inline-bg: #1e293b; }
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; background: var(--bg); color: var(--fg);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  #${CLS} { max-width: 60rem; margin: 0 auto; padding: 3rem 1rem 2rem; }
  #${CLS} h1 { font-size: 2.2rem; line-height: 1.15; margin: 0.5rem 0 0.75rem; }
  #${CLS} h2 { font-size: 1.6rem; margin: 2.5rem 0 1rem; padding-top: 1rem; border-top: 1px solid var(--line); }
  #${CLS} h3 { font-size: 1.2rem; margin: 1.75rem 0 0.5rem; }
  #${CLS} p, #${CLS} li { line-height: 1.65; margin: 0.4rem 0; }
  #${CLS} a { color: var(--link); }
  #${CLS} code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.9em; }
  #${CLS} :not(pre) > code { background: var(--inline-bg); padding: 0.05em 0.3em; border-radius: 0.25rem; }
  #${CLS} pre { background: var(--code-bg); color: var(--code-fg); padding: 1rem; border-radius: 0.75rem;
    overflow-x: auto; font-size: 0.85rem; line-height: 1.5; }
  #${CLS} table { border-collapse: collapse; width: 100%; font-size: 0.9rem; display: block; overflow-x: auto; }
  #${CLS} th, #${CLS} td { border: 1px solid var(--line); padding: 0.35rem 0.6rem; text-align: left; vertical-align: top; }
  #${CLS} .${CLS}__eyebrow { text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.72rem;
    color: var(--accent); font-weight: 700; margin: 0; }
  #${CLS} .${CLS}__lead { font-size: 1.05rem; color: var(--muted); }
  #${CLS} .${CLS}__label { font-size: 0.8rem; color: var(--faint); margin-bottom: 0; }
  #${CLS} .${CLS}__note { border-left: 3px solid #f59e0b; padding-left: 0.75rem; }
  #${CLS} .${CLS}__toc ol { padding-left: 1.25rem; }
  #${CLS} .${CLS}__toc ul { padding-left: 1rem; font-size: 0.92rem; }
  #${CLS} .${CLS}__footer { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--line);
    font-size: 0.92rem; color: var(--muted); }
</style>
</head>
<body>
<main id="${CLS}">
  <header>
    <p class="${CLS}__eyebrow">integram.io · для разработчиков</p>
    <h1>${escape(API_IO_META.h1)}</h1>
    ${API_IO_INTRO.map((p) => `<p class="${CLS}__lead">${inline(p)}</p>`).join('\n    ')}
  </header>
  <nav class="${CLS}__toc" aria-label="Содержание">
    <ol>${tocHtml(API_IO_SECTIONS)}</ol>
  </nav>${sectionsHtml(API_IO_SECTIONS, CLS)}
  <footer class="${CLS}__footer">
    <p><a href="/">integram.io</a></p>
  </footer>
</main>

<!-- Yandex.Metrika counter -->
<script type="text/javascript">
   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   m[i].l=1*new Date();
   for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
   k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(97768013, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true
   });
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/97768013" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->
</body>
</html>
`
  return nbspHtml(html)
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const html = renderIoApiPage()
  if (process.argv.includes('--check')) {
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8').replace(/\r\n/g, '\n') : ''
    if (current !== html) {
      console.error('✗ integram.io/api.html устарел: node scripts/build-integram-io-api.mjs')
      process.exit(1)
    }
    console.log('✓ integram.io/api.html совпадает с данными')
  } else {
    writeFileSync(outPath, html)
    console.log(`✓ integram.io/api.html (${html.length} bytes)`)
  }
}
