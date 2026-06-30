import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const repo = new URL('..', import.meta.url).pathname
const scriptSrc = readFileSync(resolve(repo, 'scripts/prerender-landing.mjs'), 'utf8')
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')

test('build pipeline runs prerender-landing after the knowledge base prerender', () => {
  const pkg = JSON.parse(readFileSync(resolve(repo, 'package.json'), 'utf8'))
  const build = pkg.scripts.build
  assert.match(build, /prerender-landing\.mjs/)
  assert.ok(
    build.indexOf('prerender-knowledge-base.mjs') < build.indexOf('prerender-landing.mjs'),
    'landing prerender must run after the knowledge base prerender',
  )
})

test('prerender-landing fills #root and injects SEO head tags into dist/index.html', () => {
  // Arrange: a fake build output that mirrors the real SPA shell.
  const work = mkdtempSync(resolve(tmpdir(), 'lp-prerender-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)

  // Act
  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  const out = readFileSync(resolve(work, 'dist/index.html'), 'utf8')

  // Assert: #root is no longer empty and carries a crawlable H1 with the brand.
  assert.doesNotMatch(out, /<div id="root"><\/div>/, '#root must not be left empty')
  assert.match(out, /<div id="root">\s*<article id="lp-prerender"/)
  assert.match(out, /<h1[^>]*>Интеграм — конструктор приложений и баз данных<\/h1>/)

  // Representative section headings from Home.tsx are present.
  assert.match(out, /Работаем там, где обычные конструкторы/)
  assert.match(out, /Готовые типы проектов для вашего бэклога/)

  // SEO head tags: canonical, Open Graph, and SoftwareApplication JSON-LD.
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/" \/>/)
  assert.match(out, /<meta property="og:title"/)
  assert.match(out, /application\/ld\+json/)
  assert.match(out, /"@type":"SoftwareApplication"/)

  // issue #395: SoftwareApplication carries a free-tier Offer, and the WebSite
  // node mirrors Organization's alternateName for brand disambiguation. No
  // aggregateRating (no real reviews) and no SearchAction (no search endpoint).
  const ld = JSON.parse(
    out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, '<'),
  )
  const node = (t) => ld['@graph'].find((n) => n['@type'] === t)
  assert.deepEqual(node('WebSite').alternateName, ['Integram', 'Конструктор Интеграм'])
  assert.equal(node('SoftwareApplication').offers.price, '0')
  assert.equal(node('SoftwareApplication').offers.priceCurrency, 'RUB')
  assert.ok(!('aggregateRating' in node('SoftwareApplication')), 'must not invent aggregateRating')
  assert.ok(!JSON.stringify(ld).includes('SearchAction'), 'no SearchAction without a search endpoint')
})

test('prerender-landing is idempotent (safe to run twice)', () => {
  const work = mkdtempSync(resolve(tmpdir(), 'lp-prerender-idem-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)

  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  const once = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  const twice = readFileSync(resolve(work, 'dist/index.html'), 'utf8')

  assert.equal(once, twice, 'running the prerender twice must not double-inject content')
})

test('script documents that it must run after the knowledge base prerender', () => {
  assert.match(scriptSrc, /AFTER prerender-knowledge-base/)
})
