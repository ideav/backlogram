// issue #508 — «перестал собираться проект» на Windows.
//
// `npm run build` падал вторым шагом: scripts/sync-kb-sitemap.mjs искал блоки
// регуляркой `<\/url>\n`, а Git for Windows с `core.autocrlf=true` кладёт в
// рабочую копию `</url>\r\n`. Ноль совпадений → «не найдено ни одного <url>»
// → exit 1, и до `vite build` дело не доходило вовсе.
//
// Здесь проверяем разбор на обоих переводах строки (на Linux CRLF-копию
// приходится делать руками) и что .gitattributes держит рабочую копию в LF.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { detectEol, splitUrlBlocks } from '../scripts/lib/sitemap-urls.mjs'

const repo = new URL('..', import.meta.url).pathname
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const sitemapLf = read('public/sitemap.xml').replace(/\r\n/g, '\n')
const sitemapCrlf = sitemapLf.replace(/\n/g, '\r\n')

test('sitemap с CRLF разбирается так же, как с LF', () => {
  const lf = splitUrlBlocks(sitemapLf)
  const crlf = splitUrlBlocks(sitemapCrlf)

  assert.ok(lf.length > 0, 'в public/sitemap.xml должны быть блоки <url>')
  assert.equal(
    crlf.length,
    lf.length,
    'CRLF-копия обязана давать столько же блоков <url>, сколько LF',
  )
  assert.deepEqual(
    crlf.map((b) => b.loc),
    lf.map((b) => b.loc),
    'адреса страниц не должны зависеть от перевода строки',
  )
})

test('перевод строки определяется по содержимому файла', () => {
  assert.equal(detectEol(sitemapLf), '\n')
  assert.equal(detectEol(sitemapCrlf), '\r\n')
})

test('CRLF-исходник собирается обратно байт в байт', () => {
  // Тот же путь, что и в скрипте: префикс + дословные блоки + суффикс.
  // Если разбор теряет `\r`, склейка разойдётся с исходником, скрипт решит,
  // что sitemap «поехал», и перепишет файл целиком на каждой сборке.
  const blocks = splitUrlBlocks(sitemapCrlf)
  const rebuilt =
    sitemapCrlf.slice(0, blocks[0].start) +
    blocks.map((b) => b.text).join('') +
    sitemapCrlf.slice(blocks.at(-1).end)

  assert.equal(rebuilt, sitemapCrlf)
})

test('.gitattributes фиксирует LF в рабочей копии', () => {
  const attrs = read('.gitattributes')
  assert.match(
    attrs,
    /^\*\s+text=auto\s+eol=lf$/m,
    '.gitattributes должен держать текстовые файлы в LF — иначе Windows снова принесёт CRLF',
  )
})
