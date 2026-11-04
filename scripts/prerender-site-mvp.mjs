#!/usr/bin/env node
/**
 * Пререндер сайта mvp.care (issue #872): после `vite build` превращает
 * шаблон dist-mvp/index.html в три готовые страницы —
 *   /               dist-mvp/index.html
 *   /success        dist-mvp/success/index.html
 *   /ideav_callme   dist-mvp/ideav_callme/index.html
 * У каждой свои title, description, canonical и Open Graph. Разметку body
 * рисует site-mvp/src/prerender.tsx (react-dom/server), так что снимок и
 * исходники компонентов разойтись не могут. React в браузер не отправляется.
 *
 * Переменные окружения (необязательные):
 *   SITE_URL    схема + хост, по умолчанию https://mvp.care
 *   METRIKA_ID  счётчик, по умолчанию 94166541; пусто через `METRIKA_ID=` — не ставить
 */
import { build } from 'esbuild'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist-mvp')

const ORIGIN = (process.env.SITE_URL ?? 'https://mvp.care').trim().replace(/\/+$/, '')
const METRIKA_ID = (process.env.METRIKA_ID ?? '94166541').trim().replace(/\D/g, '')
const SITE_HOST = new URL(ORIGIN).hostname

const entryOut = resolve(root, '.vite/mvp/prerender-entry.cjs')
mkdirSync(dirname(entryOut), { recursive: true })

// CJS намеренно: react-dom/server тянет require('stream').
await build({
  entryPoints: [resolve(root, 'site-mvp/src/prerender.tsx'), ],
  outfile: entryOut,
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  logLevel: 'error',
})
const { renderPage } = createRequire(import.meta.url)(entryOut)

// Контент и счётчик живут в TS; для скрипта собираем их тем же esbuild.
const metaOut = resolve(root, '.vite/mvp/meta-entry.cjs')
await build({
  stdin: {
    contents: "export { PAGES } from './content'\nexport { metrikaSnippet } from './metrika'",
    resolveDir: resolve(root, 'site-mvp/src'),
    loader: 'ts',
  },
  outfile: metaOut,
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  logLevel: 'error',
})
const { PAGES, metrikaSnippet } = createRequire(import.meta.url)(metaOut)

const template = readFileSync(resolve(dist, 'index.html'), 'utf8')
for (const token of ['{{TITLE}}', '{{DESCRIPTION}}', '{{URL}}', '{{ROBOTS}}', '{{BODY}}', '{{METRIKA}}']) {
  if (!template.includes(token)) {
    console.error(`dist-mvp/index.html: нет ${token} — шаблон site-mvp/index.html изменился`)
    process.exit(1)
  }
}

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const metrika = metrikaSnippet(METRIKA_ID, SITE_HOST)

for (const page of PAGES) {
  const url = ORIGIN + (page.path === '/' ? '/' : page.path)
  const robots =
    page.path === '/' ? '<meta name="robots" content="index, follow, max-image-preview:large" />' : '<meta name="robots" content="noindex, follow" />'
  // Подстановка функцией: в теле встречается `$`, а строка-замена его трактует.
  const html = template
    .replaceAll('{{TITLE}}', () => esc(page.title))
    .replaceAll('{{DESCRIPTION}}', () => esc(page.description))
    .replaceAll('{{URL}}', () => url)
    .replace('{{ROBOTS}}', () => robots)
    .replace('{{BODY}}', () => renderPage(page.path))
    .replace('{{METRIKA}}', () => metrika)
  const outDir = resolve(dist, page.dir)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'index.html'), html, 'utf8')
  console.log(`+ dist-mvp/${page.dir ? page.dir + '/' : ''}index.html  ${url}  (${html.length} символов)`)
}
