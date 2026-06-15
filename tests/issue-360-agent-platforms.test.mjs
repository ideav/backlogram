import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const repo = new URL('..', import.meta.url).pathname
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const pageSource = read('src/pages/AgentPlatforms.tsx')
const excelSource = read('src/pages/ExcelToApp.tsx')
const routerSource = read('src/router.tsx')
const sitemapSource = read('public/sitemap.xml')
const indexHtml = read('index.html')

function makeWorkspace(prefix) {
  const work = mkdtempSync(resolve(tmpdir(), prefix))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-agent-platforms.mjs'), resolve(work, 'scripts/prerender-agent-platforms.mjs'))
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  return work
}

test('the /agent-platforms.html route is registered and renders AgentPlatforms', () => {
  assert.match(routerSource, /import AgentPlatforms from '\.\/pages\/AgentPlatforms'/)
  assert.match(
    routerSource,
    /path:\s*'agent-platforms\.html',\s*\n\s*element:\s*<AgentPlatforms \/>/,
    'router should map agent-platforms.html to <AgentPlatforms />',
  )
  assert.match(routerSource, /path:\s*'agent-platforms',\s*\n\s*element:\s*<AgentPlatforms \/>/)
})

test('the detailed page covers all four foreign competitors and the Integram pillars', () => {
  assert.match(pageSource, /Retool/)
  assert.match(pageSource, /Power Platform/)
  assert.match(pageSource, /NocoDB/)
  assert.match(pageSource, /Appsmith/)
  // Unique-advantage pillars (business framing, no raw API identifiers).
  assert.match(pageSource, /Единая модель данных/)
  assert.match(pageSource, /Единый API для всего/)
  assert.match(pageSource, /Идемпотентные вызовы/)
  // A couple of illustrations: the full agent cycle and the two-approaches diagram.
  assert.match(pageSource, /Полный цикл/)
  assert.match(pageSource, /Human-in-the-loop/)
  assert.match(pageSource, /Агент полного цикла/)
})

test('the detailed page covers Russian low-code analogs', () => {
  assert.match(pageSource, /Российские аналоги/)
  assert.match(pageSource, /Bpium/)
  assert.match(pageSource, /ELMA365/)
  assert.match(pageSource, /BPMSoft/)
  assert.match(pageSource, /AppMaster/)
})

test('the detailed page sets its own SEO title, description and canonical', () => {
  assert.match(pageSource, /document\.title = PAGE_TITLE/)
  assert.match(pageSource, /const canonical = `\$\{SITE\}\$\{PATH\}`/)
  assert.match(pageSource, /setCanonical\(canonical\)/)
  assert.match(pageSource, /const PATH = '\/agent-platforms\.html'/)
})

test('the Excel→app landing ends with a compact comparison linking to the detailed page', () => {
  // Business-language comparison block.
  assert.match(excelSource, /А что у конкурентов\?/)
  assert.match(excelSource, /const agentCompare = \[/)
  // Prominent link to the detailed analysis.
  assert.match(
    excelSource,
    /to="\/agent-platforms\.html"/,
    'the landing must link to the detailed comparison page',
  )
  assert.match(excelSource, /Подробный разбор/)
  // Mini-mention of Russian analogs, not just foreign ones.
  assert.match(excelSource, /Bpium/)
})

test('build pipeline runs the agent-platforms prerender after excel-to-app and before landing', () => {
  const pkg = JSON.parse(read('package.json'))
  const build = pkg.scripts.build
  assert.match(build, /prerender-agent-platforms\.mjs/)
  assert.ok(
    build.indexOf('prerender-excel-to-app.mjs') < build.indexOf('prerender-agent-platforms.mjs'),
    'agent-platforms prerender must run after the excel-to-app prerender',
  )
  assert.ok(
    build.indexOf('prerender-agent-platforms.mjs') < build.indexOf('prerender-landing.mjs'),
    'agent-platforms prerender must run before the landing prerender (clean index.html template)',
  )
})

test('prerender-agent-platforms writes a crawlable dist/agent-platforms.html', () => {
  const work = makeWorkspace('ap-prerender-')

  execFileSync('node', ['scripts/prerender-agent-platforms.mjs'], { cwd: work })

  const outPath = resolve(work, 'dist/agent-platforms.html')
  assert.ok(existsSync(outPath), 'dist/agent-platforms.html must be created')
  const out = readFileSync(outPath, 'utf8')

  // #root carries a crawlable H1 and competitor headings.
  assert.doesNotMatch(out, /<div id="root"><\/div>/, '#root must not be left empty')
  assert.match(out, /<div id="root">\s*<article id="ap-prerender"/)
  assert.match(out, /Retool \+ Retool AI/)
  assert.match(out, /Microsoft Power Platform \+ Copilot/)
  assert.match(out, /NocoDB/)
  assert.match(out, /Appsmith/)

  // Russian analogs section is crawlable too.
  assert.match(out, /Российские аналоги/)
  assert.match(out, /Bpium/)
  assert.match(out, /BPMSoft/)

  // SEO head tags: canonical, Open Graph, Article JSON-LD, tightened title.
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/agent-platforms\.html" \/>/)
  assert.match(out, /<title>Агент создаёт приложение[^<]*<\/title>/)
  assert.match(out, /<meta property="og:title"/)
  assert.match(out, /application\/ld\+json/)
  assert.match(out, /"@type":"Article"/)
})

test('prerender-agent-platforms does not mutate dist/index.html (home page)', () => {
  const work = makeWorkspace('ap-prerender-home-')
  const before = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  execFileSync('node', ['scripts/prerender-agent-platforms.mjs'], { cwd: work })
  const after = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  assert.equal(before, after, 'the home page shell must stay untouched')
})

test('prerender-agent-platforms refuses to run after the landing prerender patched index.html', () => {
  const work = makeWorkspace('ap-prerender-order-')
  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  assert.throws(
    () => execFileSync('node', ['scripts/prerender-agent-platforms.mjs'], { cwd: work, stdio: 'pipe' }),
    /Command failed/,
    'running after the landing prerender must fail loudly',
  )
})

test('the agent-platforms page is listed in the sitemap', () => {
  assert.match(sitemapSource, /<loc>https:\/\/ideav\.ru\/agent-platforms\.html<\/loc>/)
})
