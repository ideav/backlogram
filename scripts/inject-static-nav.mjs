#!/usr/bin/env node
/**
 * Post-build: статический блок навигации в каждую страницу карты сайта.
 *
 * Запускается последним — после всех `prerender-*.mjs`, потому что они берут
 * чистый `dist/index.html` как шаблон и перезаписывают страницы целиком.
 * Проходит по `<loc>` из `public/sitemap.xml`, находит соответствующий файл в
 * `dist/` и вставляет блок ссылок прямо перед `#root` (backlogram#910: внутри
 * `#root` — гидрируемая страница, чужой разметки там быть не должно).
 *
 * Зачем: до этого меню существовало только после JS, и ни одна страница не
 * ссылалась на `uslugi.html` и `kvintety-ili-tablicy.html` в сыром HTML
 * (аудит 02.10.2026, issue #627, п. 3).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { injectStaticNav } from './lib/static-nav.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')

// Разделы карты, которые выкладываются из других репозиториев и в dist/ этого
// не попадают: /kurs/ — лендинги курсов (ideav/courses, courses#50).
const EXTERNAL_PREFIXES = ['/kurs/']

const sitemap = readFileSync(resolve(root, 'public/sitemap.xml'), 'utf8')
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  m[1].replace(/^https?:\/\/[^/]+/, ''),
)

let injected = 0
const missing = []
const skipped = []
const external = []

for (const pathname of paths) {
  if (EXTERNAL_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    external.push(pathname)
    continue
  }
  const file = resolve(dist, (pathname === '/' ? '/index.html' : pathname).replace(/^\//, ''))
  if (!existsSync(file)) {
    missing.push(pathname)
    continue
  }
  const before = readFileSync(file, 'utf8')
  const after = injectStaticNav(before, pathname)
  if (after === before) {
    skipped.push(pathname)
    continue
  }
  writeFileSync(file, after)
  injected += 1
}

console.log(`✓ inject-static-nav: блок навигации в ${injected} из ${paths.length} страниц карты сайта`)
if (external.length) console.log(`  не из этого dist (другой репозиторий): ${external.join(', ')}`)
if (skipped.length) console.log(`  без изменений (нет #root или блок уже есть): ${skipped.join(', ')}`)
if (missing.length) {
  console.error(`✗ inject-static-nav: в dist/ нет файлов для ${missing.length} URL карты: ${missing.join(', ')}`)
  process.exit(1)
}
