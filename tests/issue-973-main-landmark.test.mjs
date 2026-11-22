import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EMPTY_ROOT, rootWithMain } from '../scripts/lib/root-main.mjs'
import { injectStaticNav } from '../scripts/lib/static-nav.mjs'

// backlogram#973 (продолжение #969): тело каждого пререндер-снапшота — в <main>
// внутри #root, статическое меню inject-static-nav — снаружи, первым ребёнком #root.
// Экстракторы основного текста ИИ-поиска берут <main>, а не меню.

const repo = fileURLToPath(new URL('..', import.meta.url))
const mains = (s) => (s.match(/<main[\s>]/g) || []).length

test('rootWithMain: тело в <main>, меню вставляется вне его', () => {
  const html = injectStaticNav(`<body>${EMPTY_ROOT}</body>`.replace(EMPTY_ROOT, rootWithMain('<h1>Заголовок</h1>')))
  assert.equal(mains(html), 1)
  assert.ok(html.indexOf('id="static-nav"') < html.indexOf('<main>'), 'меню перед <main>')
  assert.ok(html.indexOf('<div id="root">') < html.indexOf('id="static-nav"'), 'меню внутри #root')
  assert.match(html.slice(html.indexOf('<main>'), html.indexOf('</main>')), /<h1>/)
})

test('rootWithMain: не задваивает <main> и не трогает $-шаблоны replace', () => {
  const own = '<main class="x"><h1>Своя</h1></main>'
  assert.equal(EMPTY_ROOT.replace(EMPTY_ROOT, rootWithMain(own)), `<div id="root">${own}</div>`)
  const dollars = "<p>$& и $' и $1</p>"
  assert.equal(EMPTY_ROOT.replace(EMPTY_ROOT, rootWithMain(dollars)), `<div id="root"><main>${dollars}</main></div>`)
})

test('все prerender-скрипты основного сайта заполняют #root через rootWithMain', () => {
  // site-excel / site-mvp / site-finmo — отдельные сайты со своими сборками, без меню.
  const own = /^prerender-site-(excel|mvp|finmo)\.mjs$/
  const scripts = readdirSync(join(repo, 'scripts')).filter((n) => /^prerender-.*\.mjs$/.test(n) && !own.test(n))
  assert.ok(scripts.length >= 30, `скриптов найдено: ${scripts.length}`)
  for (const name of scripts) {
    const src = readFileSync(join(repo, 'scripts', name), 'utf8')
    assert.ok(src.includes('rootWithMain('), `${name}: тело #root через rootWithMain`)
    assert.ok(!/`<div id="root">\$\{/.test(src), `${name}: нет ручной вставки в #root мимо <main>`)
  }
})

test('собранный dist: на каждой странице с #root ровно один <main>, H1 в нём, меню снаружи (если dist собран)', (t) => {
  const dist = join(repo, 'dist')
  if (!existsSync(join(dist, 'index.html'))) return t.skip('dist не собран')
  const walk = (d) => readdirSync(d).flatMap((n) => {
    const p = join(d, n)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : []
  })
  let checked = 0
  for (const p of walk(dist)) {
    const html = readFileSync(p, 'utf8')
    if (!html.includes('<div id="root">')) continue
    const r = relative(dist, p)
    assert.equal(mains(html), 1, `${r}: ровно один <main>`)
    const open = html.search(/<main[\s>]/)
    const main = html.slice(open, html.indexOf('</main>'))
    assert.ok(open > html.indexOf('<div id="root">'), `${r}: <main> внутри #root`)
    assert.match(main, /<h1[\s>]/, `${r}: H1 внутри <main>`)
    assert.ok(!main.includes('id="static-nav"'), `${r}: меню не в <main>`)
    checked++
  }
  assert.ok(checked > 100, `проверено страниц: ${checked}`)
})

test('блог: на главной /blog/ нет второго <main> поверх BaseLayout', () => {
  const layout = readFileSync(join(repo, 'blog-v2/src/layouts/BaseLayout.astro'), 'utf8')
  assert.equal(mains(layout), 1, 'BaseLayout держит единственный <main>')
  for (const page of ['index.astro', '404.astro', 'search.astro', 'posts/[...slug].astro', 'tag/[slug].astro', 'category/[slug].astro', 'authors/[slug].astro']) {
    const src = readFileSync(join(repo, 'blog-v2/src/pages', page), 'utf8')
    if (src.includes('BaseLayout')) assert.equal(mains(src), 0, `${page}: <main> уже в BaseLayout`)
  }
})
