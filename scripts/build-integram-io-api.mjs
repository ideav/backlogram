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
  /* Две колонки: слева липкое оглавление, справа справочник (#874). */
  #${CLS} { max-width: 80rem; margin: 0 auto; padding: 0 1rem;
    display: grid; grid-template-columns: 17rem minmax(0, 1fr); gap: 2.5rem; }
  #${CLS} .${CLS}__main { min-width: 0; max-width: 60rem; padding: 3rem 0 2rem; }
  #${CLS} [id] { scroll-margin-top: 1rem; }
  #${CLS} .${CLS}__side { position: sticky; top: 0; align-self: start; max-height: 100vh;
    overflow-y: auto; padding: 2rem 1rem 2rem 0; border-right: 1px solid var(--line);
    font-size: 0.88rem; scrollbar-width: thin; }
  #${CLS} .${CLS}__side summary { font-weight: 700; cursor: pointer; list-style: none; display: none; }
  #${CLS} .${CLS}__side summary::-webkit-details-marker { display: none; }
  #${CLS} .${CLS}__toc-title { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.72rem;
    font-weight: 700; color: var(--faint); margin: 0 0 0.75rem; }
  #${CLS} .${CLS}__toc ol, #${CLS} .${CLS}__toc ul { list-style: none; margin: 0; padding: 0; }
  #${CLS} .${CLS}__toc > ol > li { margin: 0 0 0.6rem; }
  #${CLS} .${CLS}__toc > ol > li > a { font-weight: 600; color: var(--fg); }
  #${CLS} .${CLS}__toc ul { margin-top: 0.2rem; border-left: 1px solid var(--line); }
  #${CLS} .${CLS}__toc li { margin: 0; line-height: 1.4; }
  #${CLS} .${CLS}__toc ul a { display: block; padding: 0.18rem 0 0.18rem 0.75rem; margin-left: -1px;
    border-left: 2px solid transparent; color: var(--muted); }
  #${CLS} .${CLS}__toc a { text-decoration: none; }
  #${CLS} .${CLS}__toc a:hover { color: var(--link); }
  #${CLS} .${CLS}__toc a[aria-current="true"] { color: var(--link); border-left-color: var(--link); font-weight: 600; }
  @media (max-width: 900px) {
    #${CLS} { display: block; padding: 0; }
    #${CLS} .${CLS}__main { padding: 1.5rem 16px 2rem; }
    #${CLS} [id] { scroll-margin-top: 3.5rem; }
    #${CLS} .${CLS}__side { position: sticky; top: 0; z-index: 10; max-height: none; overflow: visible;
      padding: 0; border-right: 0; border-bottom: 1px solid var(--line); background: var(--bg); }
    #${CLS} .${CLS}__side summary { display: block; padding: 0.75rem 16px; }
    #${CLS} .${CLS}__side summary::after { content: "▾"; float: right; color: var(--faint); }
    #${CLS} .${CLS}__side details[open] summary::after { content: "▴"; }
    #${CLS} .${CLS}__toc-title { display: none; }
    #${CLS} .${CLS}__toc { max-height: 70vh; overflow-y: auto; padding: 0 16px 1rem; }
  }
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
  #${CLS} .${CLS}__footer { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--line);
    font-size: 0.92rem; color: var(--muted); }
</style>
</head>
<body>
<div id="${CLS}">
<aside class="${CLS}__side">
  <details open>
    <summary>Содержание</summary>
    <nav class="${CLS}__toc" aria-label="Содержание">
      <p class="${CLS}__toc-title">Содержание</p>
      <ol>${tocHtml(API_IO_SECTIONS)}</ol>
    </nav>
  </details>
</aside>
<main class="${CLS}__main">
  <header>
    <p class="${CLS}__eyebrow">integram.io · для разработчиков</p>
    <h1>${escape(API_IO_META.h1)}</h1>
    ${API_IO_INTRO.map((p) => `<p class="${CLS}__lead">${inline(p)}</p>`).join('\n    ')}
  </header>${sectionsHtml(API_IO_SECTIONS, CLS)}
  <footer class="${CLS}__footer">
    <p><a href="/">integram.io</a></p>
  </footer>
</main>
</div>
<script>
// Оглавление: свёрнуто на узком экране, закрывается по клику на пункт;
// пункт текущей темы подсвечен и виден в прокрутке левой колонки.
(function () {
  var narrow = window.matchMedia('(max-width: 900px)');
  var side = document.querySelector('.${CLS}__side');
  var box = side.querySelector('details');
  if (narrow.matches) box.removeAttribute('open');
  narrow.addEventListener('change', function (e) { if (e.matches) box.removeAttribute('open'); else box.setAttribute('open', ''); });
  side.addEventListener('click', function (e) { if (e.target.closest('a') && narrow.matches) box.removeAttribute('open'); });
  var links = {};
  side.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  var targets = Array.prototype.slice.call(document.querySelectorAll('#${CLS} section[id], #${CLS} article[id]'));
  if (!targets.length) return;
  var current = null;
  function mark(id) {
    var a = links[id];
    if (!a || a === current) return;
    if (current) current.removeAttribute('aria-current');
    a.setAttribute('aria-current', 'true');
    current = a;
    if (!narrow.matches) {
      // offsetParent ссылки — сама липкая колонка (sticky позиционирована)
      var top = a.offsetTop, h = side.clientHeight;
      if (top < side.scrollTop + 40 || top > side.scrollTop + h - 60) side.scrollTop = top - h / 3;
    }
  }
  // Текущая тема — последняя, чей заголовок уже поднялся до верхней трети экрана.
  function update() {
    var line = Math.min(window.innerHeight / 3, 200), best = null;
    for (var i = 0; i < targets.length; i++) {
      if (targets[i].getBoundingClientRect().top <= line) best = targets[i]; else break;
    }
    // Внизу страницы последние темы до верха не доезжают — берём последнюю.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) best = targets[targets.length - 1];
    if (best) mark(best.id);
    else if (current) { current.removeAttribute('aria-current'); current = null; }
  }
  var queued = false;
  window.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; update(); });
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
</script>

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
