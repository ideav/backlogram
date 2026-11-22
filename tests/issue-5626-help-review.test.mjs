import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HELP_API_TITLE, HELP_ARTICLES, HELP_INTRO, helpLevelLabel, helpSplitBlocks } from '../src/data/helpCenter.mjs'
import { SCHEMES } from '../scripts/help-schemes/index.mjs'

// ideav/crm#5626: ревью /help.
// 1) У приёма «в интерфейсе» вызовы API не выдаются за шаги интерфейса — они в блоках api: true.
// 2) Картинки — SVG-схемы одного стиля из генератора, файлы в репозитории совпадают с ним.
// 3) В начале страницы — плашка: работу делают ИИ-агенты, страница — образец для них.

const repo = fileURLToPath(new URL('..', import.meta.url))
const imgDir = resolve(repo, 'public/help-img')
const API_CALL = /curl |X-Authorization|\/_d_|\/_m_/

test('в приёме «в интерфейсе» каждый вызов API помечен api: true', () => {
  const bad = []
  for (const a of HELP_ARTICLES) {
    if (a.level !== 'start') continue
    for (const b of a.blocks ?? []) if (b.t === 'code' && API_CALL.test(b.code) && !b.api) bad.push(a.id)
  }
  assert.deepEqual(bad, [], `curl без api: true в статьях «в интерфейсе»: ${bad.join(', ')}`)
})

test('бейдж и разбиение блоков: API — отдельной группой, бейдж говорит «есть API»', () => {
  const withApi = HELP_ARTICLES.find((a) => a.level === 'start' && a.blocks?.some((b) => b.api))
  const plain = HELP_ARTICLES.find((a) => a.level === 'start' && !a.blocks?.some((b) => b.api))
  const pro = HELP_ARTICLES.find((a) => a.level === 'pro')
  assert.equal(helpLevelLabel(withApi), 'в интерфейсе · есть API')
  assert.equal(helpLevelLabel(plain), 'в интерфейсе')
  assert.equal(helpLevelLabel(pro), 'для разработчика')
  const { ui, api } = helpSplitBlocks(withApi)
  assert.ok(api.length > 0 && api.every((b) => b.api))
  assert.ok(ui.every((b) => !b.api))
  assert.equal(ui.length + api.length, withApi.blocks.length)
  assert.match(HELP_API_TITLE, /агент/)
})

test('SVG-схемы в public/help-img совпадают с генератором и все используются', () => {
  const files = readdirSync(imgDir).filter((f) => !f.startsWith('.'))
  assert.deepEqual(files.filter((f) => !f.endsWith('.svg')), [], 'в help-img только SVG-схемы')
  const used = new Set(HELP_ARTICLES.flatMap((a) => (a.blocks ?? []).filter((b) => b.t === 'img').map((b) => b.src.replace('/help-img/', ''))))
  for (const f of files) assert.ok(used.has(f), `схема ${f} не используется ни в одной статье`)
  for (const [name, draw] of Object.entries(SCHEMES)) {
    const disk = readFileSync(resolve(imgDir, `${name}.svg`), 'utf8')
    assert.equal(disk, draw(), `${name}.svg устарел: перезапустите node scripts/generate-help-schemes.mjs`)
    assert.match(disk, /<title>[^<]{10,}<\/title>/, `${name}: у схемы нет <title>`)
  }
  assert.equal(Object.keys(SCHEMES).length, files.length)
})

test('популярные действия с таблицей проиллюстрированы схемами', () => {
  const must = ['structure-create-table', 'structure-add-column', 'structure-required', 'data-record-edit', 'data-inline-edit',
    'data-filter-basic', 'data-group', 'data-export-excel', 'data-import-paste', 'data-delete-many', 'data-table-settings']
  for (const id of must) {
    const a = HELP_ARTICLES.find((x) => x.id === id)
    assert.ok(a?.blocks?.some((b) => b.t === 'img'), `${id}: нет схемы`)
  }
})

test('плашка про ИИ-агентов: заголовок, отсылка к llms.txt, ссылки на живые приёмы', () => {
  const n = HELP_INTRO.agents
  assert.match(n.title, /ИИ-агент/)
  assert.match(n.text, /пример/)
  assert.match(n.text, /llms\.txt/)
  const ids = new Set(HELP_ARTICLES.map((a) => a.id))
  for (const l of n.links) {
    const m = /^\/help\/[a-z]+\.html#(.+)$/.exec(l.href)
    assert.ok(m && ids.has(m[1]), `битая ссылка плашки: ${l.href}`)
  }
  for (const page of ['src/pages/HelpCenter.tsx', 'src/pages/HelpSection.tsx', 'scripts/prerender-help.mjs']) {
    assert.match(readFileSync(resolve(repo, page), 'utf8'), /AgentsNote|agentsHtml/, `${page}: нет плашки`)
  }
})
