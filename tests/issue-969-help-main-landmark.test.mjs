import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { HELP_META, HELP_SECTIONS } from '../src/data/helpCenter.mjs'
import { injectStaticNav } from '../scripts/lib/static-nav.mjs'

// backlogram#969: аудит SEO/GEO /help.html. Контент хаба и разделов — в <main>,
// чтобы экстракторы ИИ-поиска не брали в выжимку статическое меню, которое
// inject-static-nav ставит первым ребёнком #root; lastmod хаба в sitemap = updated.

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'help-969-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-help.mjs'), resolve(work, 'scripts/prerender-help.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  cpSync(resolve(repo, 'src/lib/dates.mjs'), resolve(work, 'src/lib/dates.mjs'))
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
  execFileSync('node', ['scripts/prerender-help.mjs'], { cwd: work })
  return (p) => readFileSync(resolve(work, 'dist', p), 'utf8')
}

test('хаб и разделы помощи: ровно один <main>, в нём H1, меню — вне его', () => {
  const out = prerender()
  for (const p of ['help.html', ...HELP_SECTIONS.map((s) => s.path.slice(1))]) {
    const html = injectStaticNav(out(p))
    assert.equal((html.match(/<main[\s>]/g) || []).length, 1, `${p}: один <main>`)
    const main = html.slice(html.indexOf('<main>'), html.indexOf('</main>'))
    assert.match(main, /<h1>/, `${p}: H1 внутри <main>`)
    assert.ok(html.indexOf('<main>') > html.indexOf('<div id="root">'), `${p}: <main> внутри #root`)
    assert.ok(html.includes('id="static-nav"'), `${p}: меню вставлено`)
    assert.ok(!main.includes('static-nav'), `${p}: статическое меню не в <main>`)
  }
})

test('lastmod хаба помощи в sitemap совпадает с HELP_META.updated', () => {
  const sm = read('public/sitemap.xml')
  const m = sm.match(/<loc>https:\/\/ideav\.ru\/help\.html<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/)
  assert.ok(m, 'хаб есть в sitemap')
  assert.equal(m[1], HELP_META.updated)
})
