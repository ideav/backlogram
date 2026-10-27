import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { TEMPLATER_META, TEMPLATER_SECTIONS } from '../src/data/templaterDocs.mjs'
import { API_SECTIONS } from '../src/data/apiDocs.mjs'
import { DOCS_RING, docsRingFor, docsRingHtml } from '../src/data/docsRing.mjs'
import { footerNavGroups } from '../src/data/nav.mjs'

// backlogram#798: шаблонизатор — кратко в /api.html#files, полностью на
// /templater.html; страницы документации связаны кольцом «См. также».

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')
const indexHtml = read('index.html')
const router = read('src/router.tsx')
const htaccess = read('public/.htaccess')
const sitemap = read('public/sitemap.xml')

const allTopics = TEMPLATER_SECTIONS.flatMap((s) => s.topics)
const allText = JSON.stringify(TEMPLATER_SECTIONS)

function prerender(script, out) {
  const work = mkdtempSync(resolve(tmpdir(), 'templater-prerender-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, `scripts/${script}`), resolve(work, `scripts/${script}`))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  execFileSync('node', [`scripts/${script}`], { cwd: work })
  const path = resolve(work, 'dist', out)
  assert.ok(existsSync(path), `нет dist/${out}`)
  return readFileSync(path, 'utf8')
}

test('api.html#files кратко описывает шаблонизатор и ссылается на /templater.html', () => {
  const files = API_SECTIONS.find((s) => s.id === 'files')
  const topic = files.topics.find((t) => t.id === 'templater')
  assert.ok(topic, 'в разделе files нет темы templater')
  const text = JSON.stringify(topic)
  for (const s of ['<!-- File: a -->', 'Begin:', '{колонка}', '{_parent_.колонка}', '{_global_.user}', '{_request_.имя}', 'FR_колонка']) {
    assert.ok(text.includes(s), `в краткой справке нет «${s}»`)
  }
  assert.ok(topic.blocks.some((b) => b.link?.href === '/templater.html'), 'нет ссылки на полное описание')
})

test('маршрут, редирект, подвал, sitemap и сборка знают /templater.html', () => {
  assert.match(router, /path: 'templater\.html'/)
  assert.match(router, /import\('\.\/pages\/TemplaterDocs'\)/)
  const build = JSON.parse(read('package.json')).scripts.build
  assert.ok(build.includes('prerender-templater.mjs'))
  assert.ok(build.indexOf('prerender-templater.mjs') < build.indexOf('prerender-landing.mjs'))
  assert.match(htaccess, /^\s*RewriteRule \^templater\/\?\$ \/templater\.html \[R=301,L\]/m)
  assert.ok(htaccess.indexOf('^templater/?$') < htaccess.search(/^\s*RewriteRule \^ index\.php/m))
  assert.match(sitemap, /<loc>https:\/\/ideav\.ru\/templater\.html<\/loc>/)
  assert.ok(footerNavGroups.flatMap((g) => g.links).some((l) => l.href === '/templater.html'))
})

test('справочник покрывает механизм шаблонизатора; якоря уникальны', () => {
  const ids = TEMPLATER_SECTIONS.flatMap((s) => [s.id, ...s.topics.map((t) => t.id)])
  assert.equal(new Set(ids).size, ids.length)
  for (const id of ['flow', 'where', 'menu', 'blocks', 'placeholders', 'globals', 'include', 'repeat', 'block-query', 'url-filters', 'master-detail', 'json', 'conditions', 'braces', 'escaping', 'example', 'checklist']) {
    assert.ok(allTopics.some((t) => t.id === id), `нет темы ${id}`)
  }
  // Факты из index.php: Get_file, Make_tree, Parse_block, BuiltIn.
  for (const s of ['templates/custom/mydb/', 'info.html', 'Invalid blocks nesting', '{_global_.xsrf}', '{_global_.z}', '_parent_.колонка', 'FR_колонка', 'templates=1', '?debug=1', 'ё']) {
    assert.ok(allText.includes(s), `в справочнике нет «${s}»`)
  }
  // `_global_` блок не прячет — расхождение старого гайда с кодом.
  assert.ok(allText.includes('`{_global_.имя}` блок НЕ прячет'))
})

test('кольцо «См. также»: все страницы, по кругу от следующей, без себя', () => {
  const hrefs = DOCS_RING.map((d) => d.href)
  for (const h of ['/api.html', '/triggers.html', '/stored-procedures.html', '/templater.html']) assert.ok(hrefs.includes(h), `в кольце нет ${h}`)
  assert.equal(new Set(hrefs).size, hrefs.length)
  for (const [i, d] of DOCS_RING.entries()) {
    const ring = docsRingFor(d.href)
    assert.equal(ring.length, DOCS_RING.length - 1)
    assert.ok(!ring.some((r) => r.href === d.href))
    assert.equal(ring[0].href, DOCS_RING[(i + 1) % DOCS_RING.length].href)
  }
  for (const page of ['ApiDocs', 'TriggerDocs', 'TemplaterDocs']) {
    assert.match(read(`src/pages/${page}.tsx`), /<DocsSeeAlso path=/, `${page} без «См. также»`)
  }
})

test('пререндеры несут «См. также» в шапке; templater.html — весь справочник', () => {
  const out = prerender('prerender-templater.mjs', 'templater.html')
  assert.match(out, /<div id="root">\s*<article id="templater-prerender"/)
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/templater\.html" \/>/)
  const title = out.match(/<title>([\s\S]*?)<\/title>/)[1]
  assert.equal(title, TEMPLATER_META.title)
  assert.ok(title.length <= 60, `title длиннее 60: ${title.length}`)
  const desc = out.match(/<meta name="description" content="([\s\S]*?)"/)[1]
  assert.ok(desc.length <= 158, `description длиннее 158: ${desc.length}`)
  for (const t of allTopics) assert.ok(out.includes(`<article id="${t.id}">`), `в снапшоте нет темы ${t.id}`)
  assert.ok(out.includes('&lt;!-- Begin: Orders --&gt;'), 'HTML в примерах не экранирован')

  for (const [script, file, path] of [
    ['prerender-templater.mjs', 'templater.html', '/templater.html'],
    ['prerender-api.mjs', 'api.html', '/api.html'],
    ['prerender-triggers.mjs', 'triggers.html', '/triggers.html'],
  ]) {
    const html = file === 'templater.html' ? out : prerender(script, file)
    const header = html.slice(html.indexOf('<header>'), html.indexOf('</header>'))
    assert.ok(header.includes(docsRingHtml(path)), `${file}: нет «См. также» в шапке`)
  }
  const api = prerender('prerender-api.mjs', 'api.html')
  assert.ok(api.includes('<article id="templater">'))
  assert.ok(api.includes('<a href="/templater.html">'))
})
