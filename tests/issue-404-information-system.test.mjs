import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const repo = new URL('..', import.meta.url).pathname
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const pageSource = read('src/pages/InformationSystem.tsx')
const routerSource = read('src/router.tsx')
const sitemapSource = read('public/sitemap.xml')
const kbData = read('src/data/knowledgeBase.ts')
const llmsSource = read('public/llms.txt')
const indexHtml = read('index.html')

function makeWorkspace(prefix) {
  const work = mkdtempSync(resolve(tmpdir(), prefix))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-information-system.mjs'), resolve(work, 'scripts/prerender-information-system.mjs'))
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  return work
}

test('the /informatsionnaya-sistema route is registered and renders InformationSystem', () => {
  assert.match(routerSource, /import InformationSystem from '\.\/pages\/InformationSystem'/)
  assert.match(
    routerSource,
    /path:\s*'informatsionnaya-sistema\.html',\s*\n\s*element:\s*<InformationSystem \/>/,
    'router should map informatsionnaya-sistema.html to <InformationSystem />',
  )
  assert.match(routerSource, /path:\s*'informatsionnaya-sistema',\s*\n\s*element:\s*<InformationSystem \/>/)
})

test('the pillar page targets the head-term keywords in headings', () => {
  // Definitional head-terms.
  assert.match(pageSource, /Что такое информационная система/)
  assert.match(pageSource, /Классификация информационных систем/)
  assert.match(pageSource, /Виды информационных систем/)
  assert.match(pageSource, /Свойства информационных систем/)
  assert.match(pageSource, /Из чего состоит информационная система/)
  assert.match(pageSource, /Жизненный цикл информационной системы/)
  // Legal + GOST grounding.
  assert.match(pageSource, /149-ФЗ/)
  assert.match(pageSource, /ГОСТ/)
})

test('the pillar page covers the main system types and the Integram pivot', () => {
  for (const abbr of ['ERP', 'CRM', 'MES', 'ГИС', 'АСУ ТП']) {
    assert.match(pageSource, new RegExp(abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(pageSource, /Интеграм — ИИ-конструктор информационных систем/)
  // Cross-link to the companion KB article.
  assert.match(pageSource, /knowledge-base\/22-information-system-constructor\.html/)
})

test('the pillar page ships a FAQ block', () => {
  assert.match(pageSource, /const faq = \[/)
  assert.match(pageSource, /Чем информационная система отличается от базы данных/)
})

test('the pillar page sets its own SEO title, description, keywords and canonical', () => {
  assert.match(pageSource, /document\.title = PAGE_TITLE/)
  assert.match(pageSource, /const canonical = `\$\{SITE\}\$\{PATH\}`/)
  assert.match(pageSource, /setCanonical\(canonical\)/)
  assert.match(pageSource, /const PATH = '\/informatsionnaya-sistema\.html'/)
  assert.match(pageSource, /name="keywords"/)
  assert.match(pageSource, /информационная система/)
})

test('build pipeline runs the information-system prerender after catalog-matching and before landing', () => {
  const pkg = JSON.parse(read('package.json'))
  const build = pkg.scripts.build
  assert.match(build, /prerender-information-system\.mjs/)
  assert.ok(
    build.indexOf('prerender-catalog-matching.mjs') < build.indexOf('prerender-information-system.mjs'),
    'information-system prerender must run after the catalog-matching prerender',
  )
  assert.ok(
    build.indexOf('prerender-information-system.mjs') < build.indexOf('prerender-landing.mjs'),
    'information-system prerender must run before the landing prerender (clean index.html template)',
  )
})

test('prerender-information-system writes a crawlable dist/informatsionnaya-sistema.html', () => {
  const work = makeWorkspace('is-prerender-')

  execFileSync('node', ['scripts/prerender-information-system.mjs'], { cwd: work })

  const outPath = resolve(work, 'dist/informatsionnaya-sistema.html')
  assert.ok(existsSync(outPath), 'dist/informatsionnaya-sistema.html must be created')
  const out = readFileSync(outPath, 'utf8')

  // #root carries a crawlable H1 and definitional content.
  assert.doesNotMatch(out, /<div id="root"><\/div>/, '#root must not be left empty')
  assert.match(out, /<div id="root">\s*<article id="is-prerender"/)
  assert.match(out, /Информационная система \(ИС\): что это простыми словами/)
  assert.match(out, /совокупность содержащейся в базах данных информации/)
  assert.match(out, /Классификация информационных систем/)
  assert.match(out, /Виды информационных систем по назначению/)
  assert.match(out, /Свойства информационных систем/)
  assert.match(out, /Жизненный цикл информационной системы/)

  // SEO head tags: canonical, Open Graph, tightened title, FAQPage + Article JSON-LD.
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/informatsionnaya-sistema\.html" \/>/)
  assert.match(out, /<title>Что такое информационная система[^<]*<\/title>/)
  assert.match(out, /<meta property="og:title"/)
  assert.match(out, /application\/ld\+json/)
  assert.match(out, /"@type":"Article"/)
  assert.match(out, /"@type":"FAQPage"/)
})

test('prerender-information-system does not mutate dist/index.html (home page)', () => {
  const work = makeWorkspace('is-prerender-home-')
  const before = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  execFileSync('node', ['scripts/prerender-information-system.mjs'], { cwd: work })
  const after = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  assert.equal(before, after, 'the home page shell must stay untouched')
})

test('prerender-information-system refuses to run after the landing prerender patched index.html', () => {
  const work = makeWorkspace('is-prerender-order-')
  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  assert.throws(
    () => execFileSync('node', ['scripts/prerender-information-system.mjs'], { cwd: work, stdio: 'pipe' }),
    /Command failed/,
    'running after the landing prerender must fail loudly',
  )
})

test('the pillar page and the KB article #22 are listed in the sitemap', () => {
  assert.match(sitemapSource, /<loc>https:\/\/ideav\.ru\/informatsionnaya-sistema\.html<\/loc>/)
  assert.match(sitemapSource, /<loc>https:\/\/ideav\.ru\/knowledge-base\/22-information-system-constructor\.html<\/loc>/)
})

test('the KB article #22 exists and cross-links to the pillar page', () => {
  assert.match(kbData, /slug: '22-information-system-constructor'/)
  assert.match(kbData, /number: '22'/)
  assert.match(kbData, /compare: 'Заказная разработка и коробочные ИС'/)
  // Companion pillar page referenced from the article's sources.
  assert.match(kbData, /https:\/\/ideav\.ru\/informatsionnaya-sistema\.html/)
})

test('llms.txt lists the KB article #22 and the pillar page', () => {
  assert.match(llmsSource, /knowledge-base\/22-information-system-constructor\.html/)
  assert.match(llmsSource, /informatsionnaya-sistema\.html/)
})
