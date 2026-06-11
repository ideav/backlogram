import assert from 'node:assert/strict'
import { test, before } from 'node:test'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

/**
 * Regression coverage for https://github.com/ideav/backlogram/issues/341
 *
 * Google Search Console reported knowledge-base pages as
 * "Duplicate, Google chose a different canonical than the user."
 *
 * Root cause: the prerender script emitted canonicals WITHOUT the .html
 * suffix (e.g. https://ideav.ru/knowledge-base), while sitemap.xml, the
 * client-side React pages and every internal link use the .html form
 * (https://ideav.ru/knowledge-base.html). A page submitted in the sitemap
 * therefore declared a canonical pointing at a different URL, so Google
 * de-indexed it as a duplicate.
 *
 * The fix makes every prerendered KB page self-canonical on its .html URL —
 * the exact URL listed in sitemap.xml. This test runs the real prerender and
 * asserts that, for every knowledge-base <loc> in the sitemap, the generated
 * page exists and declares that same URL as its canonical.
 */

const repo = new URL('..', import.meta.url).pathname
const dist = resolve(repo, 'dist')
const SITE = 'https://ideav.ru'

function canonicalOf(html) {
  const m = html.match(/<link rel="canonical" href="([^"]+)"\s*\/>/)
  return m ? m[1] : null
}

function sitemapKnowledgeBaseLocs() {
  const sitemap = readFileSync(resolve(repo, 'public/sitemap.xml'), 'utf8')
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((loc) => loc.includes('/knowledge-base'))
}

// Map a public KB URL to the static file the prerender writes for it.
function fileForLoc(loc) {
  const path = loc.replace(SITE, '') // e.g. /knowledge-base.html or /knowledge-base/01-....html
  return resolve(dist, path.replace(/^\//, ''))
}

before(() => {
  // The prerender patches dist/index.html (the built SPA shell). For the test
  // we seed it from the source template, which carries the same #root div and
  // meta tags the script rewrites.
  mkdirSync(dist, { recursive: true })
  writeFileSync(resolve(dist, 'index.html'), readFileSync(resolve(repo, 'index.html'), 'utf8'))
  execFileSync('node', ['scripts/prerender-knowledge-base.mjs'], { cwd: repo, stdio: 'pipe' })
})

test('the KB index is self-canonical on /knowledge-base.html', () => {
  const html = readFileSync(resolve(dist, 'knowledge-base.html'), 'utf8')
  assert.equal(canonicalOf(html), `${SITE}/knowledge-base.html`)
})

test('the no-suffix /knowledge-base URL canonicalizes to the .html URL', () => {
  const html = readFileSync(resolve(dist, 'knowledge-base/index.html'), 'utf8')
  assert.equal(
    canonicalOf(html),
    `${SITE}/knowledge-base.html`,
    'the directory-style URL must consolidate to the .html canonical, not split it',
  )
})

test('every knowledge-base URL in the sitemap has a self-canonical prerendered page', () => {
  const locs = sitemapKnowledgeBaseLocs()
  assert.ok(locs.length > 0, 'sitemap must list knowledge-base URLs')

  const offenders = []
  for (const loc of locs) {
    const file = fileForLoc(loc)
    if (!existsSync(file)) {
      offenders.push(`${loc}: no prerendered file at ${file}`)
      continue
    }
    const canonical = canonicalOf(readFileSync(file, 'utf8'))
    if (canonical !== loc) {
      offenders.push(`${loc}: canonical is ${canonical}, expected ${loc}`)
    }
  }
  assert.equal(
    offenders.length,
    0,
    `sitemap URLs must be self-canonical (issue #341):\n${offenders.join('\n')}`,
  )
})

test('every prerendered article is listed in the sitemap', () => {
  // A generated article missing from the sitemap simply never gets crawled —
  // the same "page not indexed" symptom from a different angle. 08a was missing.
  const locs = new Set(sitemapKnowledgeBaseLocs())
  const articles = readdirSync(resolve(dist, 'knowledge-base'))
    .filter((name) => name.endsWith('.html') && name !== 'index.html')
    .map((name) => `${SITE}/knowledge-base/${name}`)

  const missing = articles.filter((url) => !locs.has(url))
  assert.equal(
    missing.length,
    0,
    `these prerendered articles are missing from sitemap.xml:\n${missing.join('\n')}`,
  )
})

test('no prerendered KB page declares a non-.html canonical', () => {
  // Guards against regressing to the suffix-less canonical that caused the
  // duplicate-canonical reports.
  const indexHtml = readFileSync(resolve(dist, 'knowledge-base.html'), 'utf8')
  assert.doesNotMatch(
    indexHtml,
    /<link rel="canonical" href="https:\/\/ideav\.ru\/knowledge-base"\s*\/>/,
  )
})
