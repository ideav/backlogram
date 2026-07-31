#!/usr/bin/env node
/**
 * Аудит длины <title> и description по всем собранным страницам — в пикселях
 * выдачи, а не в символах (issue #516).
 *
 * Запуск: `npm run seo-widths` после `npm run build`. Ничего не меняет, только
 * печатает страницы за лимитом (title > 580 px, description > 1000 px) и
 * кириллические двойники вроде «дѾступа» — их глазом не видно, а слово из
 * поискового запроса они выбивают.
 *
 * Код выхода 0 всегда: это отчёт для человека, а не гейт сборки. Гейт стоит
 * только на главной — tests/index-seo-meta.test.mjs.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DESCRIPTION_LIMIT_PX,
  TITLE_LIMIT_PX,
  descriptionWidthPx,
  findLookalikeCyrillic,
  titleWidthPx,
} from './lib/serp-width.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = resolve(__dirname, '..', 'dist')

function htmlFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...htmlFiles(path))
    else if (entry.name.endsWith('.html')) out.push(path)
  }
  return out
}

let pages = []
try {
  pages = htmlFiles(dist)
} catch {
  console.error('✗ нет каталога dist — сначала `npm run build`')
  process.exit(0)
}

const rows = []
for (const file of pages) {
  const html = readFileSync(file, 'utf8')
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]
  if (!title) continue
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''
  rows.push({
    page: file.slice(dist.length + 1),
    title,
    description,
    titlePx: titleWidthPx(title),
    descriptionPx: description ? descriptionWidthPx(description) : 0,
    lookalikes: findLookalikeCyrillic(`${title} ${description}`),
  })
}

const over = rows
  .filter((r) => r.titlePx > TITLE_LIMIT_PX || r.descriptionPx > DESCRIPTION_LIMIT_PX)
  .sort((a, b) => b.titlePx - a.titlePx)
const dirty = rows.filter((r) => r.lookalikes.length > 0)

console.log(`Страниц с <title>: ${rows.length}`)
console.log(`За лимитом (title > ${TITLE_LIMIT_PX} px, description > ${DESCRIPTION_LIMIT_PX} px): ${over.length}`)
for (const r of over) {
  const flags = `${r.titlePx > TITLE_LIMIT_PX ? 'T' : ' '}${r.descriptionPx > DESCRIPTION_LIMIT_PX ? 'D' : ' '}`
  console.log(`  ${flags} title ${String(r.titlePx).padStart(4)} px · description ${String(r.descriptionPx).padStart(4)} px — ${r.page}`)
}

if (dirty.length === 0) {
  console.log('Кириллических двойников в мета-тегах нет.')
} else {
  console.log('Кириллические двойники:')
  for (const r of dirty) console.log(`  ${r.page}: ${r.lookalikes.join(' ')}`)
}
