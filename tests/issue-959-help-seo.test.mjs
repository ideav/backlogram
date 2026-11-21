import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { HELP_META, HELP_SECTIONS, HELP_ARTICLES } from '../src/data/helpCenter.mjs'

// backlogram#959: SEO/GEO-проверка /help.html — свежесть, разметка разделов,
// разделы с якорями в llms.txt.

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'help-seo-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-help.mjs'), resolve(work, 'scripts/prerender-help.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  cpSync(resolve(repo, 'src/lib/dates.mjs'), resolve(work, 'src/lib/dates.mjs'))
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
  execFileSync('node', ['scripts/prerender-help.mjs'], { cwd: work })
  return readFileSync(resolve(work, 'dist/help.html'), 'utf8')
}

const html = prerender()
const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
const article = ld['@graph'].find((n) => n['@type'] === 'TechArticle')

test('даты в HELP_META — ISO, обновление не раньше публикации', () => {
  assert.match(HELP_META.published, /^\d{4}-\d{2}-\d{2}$/)
  assert.match(HELP_META.updated, /^\d{4}-\d{2}-\d{2}$/)
  assert.ok(HELP_META.updated >= HELP_META.published)
})

test('TechArticle: даты, картинка, о чём страница, разделы с якорями', () => {
  assert.equal(article.datePublished, HELP_META.published)
  assert.equal(article.dateModified, HELP_META.updated)
  assert.equal(article.image, 'https://ideav.ru/og/help.png')
  assert.equal(article.about.alternateName, 'Integram')
  const urls = article.hasPart.map((p) => p.url)
  assert.ok(urls.includes('https://ideav.ru/help.html#basics'))
  for (const s of HELP_SECTIONS) {
    assert.ok(urls.includes(`https://ideav.ru/help.html#${s.id}`), `нет раздела ${s.id} в hasPart`)
    assert.ok(html.includes(`<section id="${s.id}">`), `нет якоря ${s.id} в снапшоте`)
  }
  assert.ok(!JSON.stringify(ld).includes('`'), 'обратные кавычки разметки протекли в JSON-LD')
})

test('видимая строка свежести совпадает с dateModified', () => {
  assert.match(html, new RegExp(`${HELP_ARTICLES.length} приёмов по шагам · обновлено <time datetime="${HELP_META.updated}">`))
  assert.match(read('src/pages/HelpCenter.tsx'), /dateTime=\{HELP_META\.updated\}/)
})

test('llms.txt ведёт на каждый раздел помощи по якорю', () => {
  const llms = read('public/llms.txt')
  for (const s of HELP_SECTIONS) {
    assert.ok(llms.includes(`](https://ideav.ru/help.html#${s.id}):`), `llms.txt: нет раздела ${s.id}`)
  }
})
