import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { API_IO_SECTIONS, IO_ABSENT } from '../src/data/apiDocsIo.mjs'
import { API_SECTIONS } from '../src/data/apiDocs.mjs'
import { nbspHtml } from '../src/lib/typography.mjs'

// backlogram#874: integram.io/api.html — справочник по подобию ideav.ru/api.html,
// но по ядру integram.io и без шапки сайта; api.integram.io уводит сюда.

const repo = fileURLToPath(new URL('..', import.meta.url))
const page = readFileSync(resolve(repo, 'integram.io/api.html'), 'utf8')
const sitemap = readFileSync(resolve(repo, 'integram.io/sitemap.xml'), 'utf8')
const ioText = JSON.stringify(API_IO_SECTIONS)

test('integram.io/api.html собран из текущих данных', () => {
  execFileSync(process.execPath, [resolve(repo, 'scripts/build-integram-io-api.mjs'), '--check'], { stdio: 'pipe' })
})

test('нет команд и параметров, которых нет в ядре integram.io', () => {
  for (const s of IO_ABSENT) {
    assert.ok(!ioText.includes(s), `в данных integram.io осталось «${s}»`)
    assert.ok(!page.includes(s), `на странице integram.io осталось «${s}»`)
  }
  assert.ok(!/F_[А-ЯЁа-яё]/.test(ioText), 'фильтр F_{имя колонки} в ядре integram.io не работает')
})

test('примеры — для integram.io, ссылок на ideav.ru нет', () => {
  assert.ok(!page.includes('ideav.ru'), 'на странице осталась ссылка на ideav.ru')
  assert.ok(page.includes('https://integram.io/mydb/'), 'примеры не для integram.io')
  assert.ok(page.includes('<link rel="canonical" href="https://integram.io/api.html">'))
})

test('без шапки сайта: только справочник', () => {
  assert.ok(!/<header[^>]*class="[^"]*(site|header)/.test(page), 'шапка сайта на странице')
  assert.equal((page.match(/<nav /g) || []).length, 1, 'кроме оглавления навигации быть не должно')
  assert.match(page, /<h1>API Интеграм<\/h1>/)
})

test('список таблиц — команда terms, якоря уникальны, все темы на месте', () => {
  assert.ok(page.includes('/mydb/terms?JSON=1'))
  const ids = [...page.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])
  assert.equal(new Set(ids).size, ids.length, 'повторяющиеся id')
  const kept = API_SECTIONS.filter((s) => s.id !== 'scenario').flatMap((s) => s.topics).filter((t) => !['schema-json', 'batch'].includes(t.id))
  for (const t of kept) assert.ok(page.includes(nbspHtml(`<h3>${t.title}</h3>`)) || t.id === 'dict', `пропала тема ${t.id}`)
})

test('кука сессии integram.io — {база}, не idb_{база}', () => {
  assert.ok(page.includes('-b &quot;mydb=$TOKEN&quot;'))
})

test('страница в карте сайта integram.io', () => {
  assert.ok(sitemap.includes('<loc>https://integram.io/api.html</loc>'))
})
