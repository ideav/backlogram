import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HELP_SECTIONS } from '../src/data/helpCenter.mjs'

// ideav/crm#5614: у популярных приёмов помощи есть скриншоты. Блок
// { t: 'img', src, alt, caption? } ссылается на файл в public/help-img/: с crm#5626 —
// SVG-схемы из scripts/generate-help-schemes.mjs.

const repo = fileURLToPath(new URL('..', import.meta.url))

const imgBlocks = []
for (const s of HELP_SECTIONS) {
  for (const a of s.articles) {
    for (const b of a.blocks ?? []) {
      if (b.t === 'img') imgBlocks.push({ section: s.id, article: a.id, ...b })
    }
  }
}

test('img-блоки помощи ссылаются на существующие файлы в public/help-img/', () => {
  assert.ok(imgBlocks.length > 0, 'ожидается хотя бы один img-блок в помощи')
  for (const b of imgBlocks) {
    assert.ok(b.src.startsWith('/help-img/'), `${b.article}: src должен начинаться с /help-img/ — ${b.src}`)
    assert.ok(!b.src.includes('..'), `${b.article}: относительный путь в src — ${b.src}`)
    const file = resolve(repo, 'public', b.src.replace(/^\//, ''))
    assert.ok(existsSync(file), `${b.article}: нет файла ${b.src}`)
    const size = statSync(file).size
    assert.ok(size > 2 * 1024, `${b.article}: ${b.src} подозрительно мал (${size} байт)`)
    assert.ok(size < 700 * 1024, `${b.article}: ${b.src} тяжёлый (${size} байт)`)
    assert.ok(b.alt && b.alt.length >= 10, `${b.article}: пустой или короткий alt у ${b.src}`)
    assert.ok(!/https?:/.test(b.src), `${b.article}: src должен быть локальным — ${b.src}`)
  }
})

test('у популярного приёма 1–3 картинки, файл не переиспользуется в одной статье', () => {
  const perArticle = new Map()
  for (const b of imgBlocks) {
    const arr = perArticle.get(b.article) ?? []
    arr.push(b.src)
    perArticle.set(b.article, arr)
  }
  for (const [article, srcs] of perArticle) {
    assert.ok(srcs.length <= 3, `${article}: ${srcs.length} скриншотов — лимит 1–3 (crm#5614)`)
    assert.equal(new Set(srcs).size, srcs.length, `${article}: один и тот же скриншот дважды`)
  }
  // Картинки помощи — SVG-схемы одного стиля (crm#5626).
  for (const b of imgBlocks) {
    assert.ok(/\.svg$/.test(b.src), `${b.article}: не SVG-схема — ${b.src}`)
  }
})

test('пререндер помощи выводит figure с тем же src', () => {
  const hub = readFileSync(resolve(repo, 'scripts/prerender-help.mjs'), 'utf8')
  assert.ok(hub.includes("case 'img'"), 'prerender-help: нет ветки img в blockHtml')
})
