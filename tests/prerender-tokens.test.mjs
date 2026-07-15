import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const repo = new URL('..', import.meta.url).pathname
const scriptSrc = readFileSync(resolve(repo, 'scripts/prerender-tokens.mjs'), 'utf8')
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')
const landingScript = resolve(repo, 'scripts/prerender-landing.mjs')

// The home page <title> lives in the root index.html; /tokens.html must NOT reuse it.
const homeTitle = indexHtml.match(/<title>([\s\S]*?)<\/title>/)[1]

function makeWorkspace(prefix) {
  const work = mkdtempSync(resolve(tmpdir(), prefix))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-tokens.mjs'), resolve(work, 'scripts/prerender-tokens.mjs'))
  cpSync(landingScript, resolve(work, 'scripts/prerender-landing.mjs'))
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  return work
}

test('build pipeline runs tokens prerender after the KB prerender and before the landing prerender', () => {
  const pkg = JSON.parse(readFileSync(resolve(repo, 'package.json'), 'utf8'))
  const build = pkg.scripts.build
  assert.match(build, /prerender-tokens\.mjs/)
  assert.ok(
    build.indexOf('prerender-knowledge-base.mjs') < build.indexOf('prerender-tokens.mjs'),
    'tokens prerender must run after the knowledge base prerender',
  )
  assert.ok(
    build.indexOf('prerender-tokens.mjs') < build.indexOf('prerender-landing.mjs'),
    'tokens prerender must run before the landing prerender (clean index.html template)',
  )
})

test('prerender-tokens writes a crawlable dist/tokens.html with its own, non-home title (#418)', () => {
  const work = makeWorkspace('tokens-prerender-')

  execFileSync('node', ['scripts/prerender-tokens.mjs'], { cwd: work })

  const outPath = resolve(work, 'dist/tokens.html')
  assert.ok(existsSync(outPath), 'dist/tokens.html must be created')
  const out = readFileSync(outPath, 'utf8')

  // #root carries a crawlable, unique H1.
  assert.doesNotMatch(out, /<div id="root"><\/div>/, '#root must not be left empty')
  assert.match(out, /<div id="root">\s*<article id="tk-prerender"/)
  assert.match(out, /<h1[^>]*>Токены Интеграма — оплата за реальные действия<\/h1>/)

  // The whole point of #418: /tokens.html must not share the home page <title>.
  const title = out.match(/<title>([\s\S]*?)<\/title>/)[1]
  assert.equal(title, 'Токены Интеграма: за что платите и сколько стоят действия')
  assert.notEqual(title, homeTitle, '/tokens.html must not reuse the home page title')
  assert.ok(title.length <= 60, `title should be <= 60 chars, got ${title.length}`)

  // Meta description present, unique, within the SEO budget.
  const desc = out.match(/<meta name="description" content="([\s\S]*?)"/)[1]
  assert.ok(desc.length <= 158, `description should be <= 158 chars, got ${desc.length}`)
  assert.match(desc, /токен/i)

  // SEO head tags: self-canonical on /tokens.html, Open Graph, JSON-LD.
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/tokens\.html" \/>/)
  assert.match(out, /<meta property="og:title"/)
  assert.match(out, /application\/ld\+json/)
  assert.match(out, /"@type":"WebPage"/)

  // Representative content mirrored from src/pages/Tokens.tsx.
  assert.match(out, /Сколько стоят действия/)
  assert.match(out, /Импорт прайс-листа на 50 000 позиций/)
})

test('prerender-tokens does not mutate dist/index.html (home page)', () => {
  const work = makeWorkspace('tokens-prerender-home-')
  const before = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  execFileSync('node', ['scripts/prerender-tokens.mjs'], { cwd: work })
  const after = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  assert.equal(before, after, 'the home page shell must stay untouched')
})

test('prerender-tokens refuses to run after the landing prerender patched index.html', () => {
  const work = makeWorkspace('tokens-prerender-order-')
  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  assert.throws(
    () => execFileSync('node', ['scripts/prerender-tokens.mjs'], { cwd: work, stdio: 'pipe' }),
    /Command failed/,
    'running after the landing prerender must fail loudly',
  )
})

test('script documents its required position in the build pipeline', () => {
  assert.match(scriptSrc, /AFTER prerender-knowledge-base\.mjs and BEFORE prerender-landing\.mjs/)
})
