import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const repo = new URL('..', import.meta.url).pathname
const scriptSrc = readFileSync(resolve(repo, 'scripts/prerender-excel-to-app.mjs'), 'utf8')
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')
const landingScript = resolve(repo, 'scripts/prerender-landing.mjs')

function makeWorkspace(prefix) {
  const work = mkdtempSync(resolve(tmpdir(), prefix))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-excel-to-app.mjs'), resolve(work, 'scripts/prerender-excel-to-app.mjs'))
  cpSync(landingScript, resolve(work, 'scripts/prerender-landing.mjs'))
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  return work
}

test('build pipeline runs excel-to-app prerender after the KB prerender and before the landing prerender', () => {
  const pkg = JSON.parse(readFileSync(resolve(repo, 'package.json'), 'utf8'))
  const build = pkg.scripts.build
  assert.match(build, /prerender-excel-to-app\.mjs/)
  assert.ok(
    build.indexOf('prerender-knowledge-base.mjs') < build.indexOf('prerender-excel-to-app.mjs'),
    'excel-to-app prerender must run after the knowledge base prerender',
  )
  assert.ok(
    build.indexOf('prerender-excel-to-app.mjs') < build.indexOf('prerender-landing.mjs'),
    'excel-to-app prerender must run before the landing prerender (clean index.html template)',
  )
})

test('prerender-excel-to-app writes a crawlable dist/excel-to-app.html', () => {
  const work = makeWorkspace('etl-prerender-')

  execFileSync('node', ['scripts/prerender-excel-to-app.mjs'], { cwd: work })

  const outPath = resolve(work, 'dist/excel-to-app.html')
  assert.ok(existsSync(outPath), 'dist/excel-to-app.html must be created')
  const out = readFileSync(outPath, 'utf8')

  // #root carries a crawlable H1 with the offer.
  assert.doesNotMatch(out, /<div id="root"><\/div>/, '#root must not be left empty')
  assert.match(out, /<div id="root">\s*<article id="etl-prerender"/)
  assert.match(out, /<h1[^>]*>Загрузите ваши Excel — получите приложение<\/h1>/)

  // Representative step headings + FAQ.
  assert.match(out, /Шаг 1\. Загружаете Excel/)
  assert.match(out, /Через ~45 минут пришлём ссылку/)
  assert.match(out, /Частые вопросы/)

  // SEO head tags: canonical, Open Graph, FAQ + Service JSON-LD, tightened title.
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/excel-to-app\.html" \/>/)
  assert.match(out, /<title>Загрузите Excel — получите приложение[^<]*<\/title>/)
  assert.match(out, /<meta property="og:title"/)
  assert.match(out, /application\/ld\+json/)
  assert.match(out, /"@type":"Service"/)
  assert.match(out, /"@type":"FAQPage"/)
})

test('prerender-excel-to-app does not mutate dist/index.html (home page)', () => {
  const work = makeWorkspace('etl-prerender-home-')
  const before = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  execFileSync('node', ['scripts/prerender-excel-to-app.mjs'], { cwd: work })
  const after = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  assert.equal(before, after, 'the home page shell must stay untouched')
})

test('prerender-excel-to-app refuses to run after the landing prerender patched index.html', () => {
  const work = makeWorkspace('etl-prerender-order-')
  // Simulate the wrong order: landing patches index.html first.
  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  assert.throws(
    () => execFileSync('node', ['scripts/prerender-excel-to-app.mjs'], { cwd: work, stdio: 'pipe' }),
    /Command failed/,
    'running after the landing prerender must fail loudly',
  )
})

test('script documents its required position in the build pipeline', () => {
  assert.match(scriptSrc, /AFTER prerender-knowledge-base\.mjs and BEFORE prerender-landing\.mjs/)
})
