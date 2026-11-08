#!/usr/bin/env node
/**
 * backlogram#910: в #root каждой страницы — настоящая страница, а не снимок.
 *
 * Раньше #root собранных страниц содержал упрощённую вёрстку из
 * scripts/prerender-*.mjs, а React после загрузки JS заменял её настоящей
 * страницей: посетитель видел сначала одну картинку, потом другую (а с #908 —
 * белый экран). Теперь React-дерево страницы рендерится на сборке
 * (dist-ssr/entry-server.js из `vite build --ssr src/entry-server.tsx`), кладётся
 * в #root, и в браузере src/main.tsx его гидрирует: первый кадр и есть итоговая
 * страница.
 *
 * Скрипты prerender-*.mjs по-прежнему собирают <head> страниц (title,
 * description, canonical, og, JSON-LD) — здесь меняется только содержимое
 * #root. Их снимок служит контрольной точкой SEO: если в настоящей странице
 * не нашлось H1 снимка или заметной доли его текста, сборка об этом пишет
 * (а при --strict падает).
 *
 * Страницы без React-маршрута (статика из public/) не трогаются.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrEntry = join(root, 'dist-ssr', 'entry-server.js')

const ROOT_OPEN = '<div id="root">'

/** Позиции содержимого #root: [начало, конец) — между открывающим и его </div>. */
export function rootContentRange(html) {
  const m = /<div id="root"[^>]*>/.exec(html)
  if (!m) return null
  const start = m.index + m[0].length
  const tagRe = /<(\/?)div\b[^>]*>|<(script|style)\b[^>]*>[\s\S]*?<\/\2>|<!--[\s\S]*?-->/gi
  tagRe.lastIndex = start
  let depth = 1
  for (let m = tagRe.exec(html); m; m = tagRe.exec(html)) {
    if (m[2] || m[0].startsWith('<!--')) continue
    depth += m[1] ? -1 : 1
    if (depth === 0) return [start, m.index]
  }
  return null
}

/** Подменить содержимое #root серверной разметкой и пометить его data-ssr. */
export function replaceRoot(html, rendered) {
  const range = rootContentRange(html)
  if (!range) return null
  const [start, end] = range
  const open = html.lastIndexOf('<div id="root"', start)
  return `${html.slice(0, open)}<div id="root" data-ssr="">${rendered}${html.slice(end)}`
}

/**
 * Адрес страницы по файлу dist: index.html → /, a/b.html → /a/b.html,
 * a/index.html → /a/ (копии для адресов без суффикса, knowledge-base/<slug>/).
 */
export function pathnameFor(rel) {
  if (rel === 'index.html') return '/'
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`
  return `/${rel}`
}

// --- Контроль SEO: настоящая страница не беднее снимка -----------------------

const decode = (s) =>
  s
    .replace(/&nbsp;| /g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

/** Видимый текст фрагмента HTML одной строкой. */
export function visibleText(html) {
  return decode(
    html
      .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

const words = (text) => text.toLowerCase().replace(/ё/g, 'е').match(/[\p{L}\p{N}]+/gu) ?? []

/** Заголовки уровня n — видимым текстом. */
export function headings(html, level) {
  return [...html.matchAll(new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)</h${level}>`, 'gi'))].map((m) =>
    visibleText(m[1]),
  )
}

/**
 * Сравнение снимка с настоящей страницей: доля различных слов снимка (от 4
 * букв), которые встречаются в странице, и H1 снимка, которого в странице нет.
 * Снимок написан руками и пересказывает страницу своими словами, поэтому
 * сравниваются слова, а не фразы; заметная доля пропавших слов значит, что
 * в снимке был текст, которого на странице нет.
 */
export function compareWithSnapshot(snapshot, rendered) {
  const norm = (s) => words(s).join(' ')
  const pageText = visibleText(rendered)
  const page = ` ${norm(pageText)} `
  const pageWords = new Set(words(pageText))
  const snapWords = [...new Set(words(visibleText(snapshot)).filter((w) => w.length >= 4))]
  const lost = snapWords.filter((w) => !pageWords.has(w))
  const missingHeadings = headings(snapshot, 1)
    .filter((h) => h && !page.includes(` ${norm(h)} `))
    .map((h) => `h1: ${h}`)
  return { coverage: snapWords.length ? 1 - lost.length / snapWords.length : 1, lost, missingHeadings }
}

// -----------------------------------------------------------------------------

function htmlFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (name === 'assets' || name === '.vite') continue
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full))
    else if (name.endsWith('.html')) out.push(full)
  }
  return out
}

async function main() {
  const strict = process.argv.includes('--strict')
  // Production-сборка react-dom/server: та же разметка, без отладочных проверок.
  process.env.NODE_ENV ??= 'production'
  const { render, hasRoute } = await import(pathToFileURL(ssrEntry).href)

  let done = 0
  const skipped = []
  const warnings = []
  for (const file of htmlFiles(dist)) {
    const rel = relative(dist, file).split(sep).join('/')
    const html = readFileSync(file, 'utf8')
    const pathname = pathnameFor(rel)
    // Своя страница SPA: есть #root и маршрут в src/router.tsx.
    if (!html.includes(ROOT_OPEN) || !hasRoute(pathname)) {
      skipped.push(rel)
      continue
    }
    const range = rootContentRange(html)
    const snapshot = range ? html.slice(range[0], range[1]) : ''
    const rendered = await render(pathname)
    const next = replaceRoot(html, rendered)
    if (!next) throw new Error(`render-ssr: в ${rel} не найден конец #root`)

    const { coverage, lost, missingHeadings } = compareWithSnapshot(snapshot, rendered)
    if (coverage < 0.85 || missingHeadings.length) {
      warnings.push(
        `  ${rel}: слов снимка на странице ${(coverage * 100).toFixed(0)}%, нет: ${lost.slice(0, 12).join(' ')}` +
          (missingHeadings.length ? `; нет заголовков: ${missingHeadings.join(' | ')}` : ''),
      )
    }
    writeFileSync(file, next)
    done += 1
  }

  console.log(`✓ render-ssr: настоящая страница в #root ${done} страниц; без React-маршрута: ${skipped.length}`)
  if (warnings.length) {
    console.log(`  страница беднее пререндер-снимка (${warnings.length}):\n${warnings.join('\n')}`)
    if (strict) process.exit(1)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main()
}
