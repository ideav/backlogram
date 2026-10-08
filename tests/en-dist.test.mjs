// Guard tests for the English site (issue #535, epic #524).
// Builds nothing itself: run `npm run test:en` (build:en + these tests).
// When dist-en/ is absent the build-dependent tests are skipped with a message.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanText, isAllowed, looksLikeText } from '../scripts/lib/en-guard-rules.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST_EN = path.join(ROOT, 'dist-en')
const ENGINE = path.join(ROOT, 'site-en', 'engine')
const SITE_URL = (process.env.SITE_URL || 'https://example.com').trim().replace(/\/+$/, '')
const SITE_BASE = (() => {
  const t = (process.env.SITE_BASE ?? '').trim().replace(/^\/+|\/+$/g, '')
  return t ? `/${t}/` : '/'
})()
const SKIP_DIRS = new Set(['node_modules', '.git'])
const SKIP_FILES = new Set(['.env'])

const allowlist = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'en-guard-allowlist.json'), 'utf8'))
const hasDist = fs.existsSync(DIST_EN)
const hasEngine = fs.existsSync(ENGINE)
const NO_DIST = 'dist-en/ not found - run `npm run build:en` (or `npm run test:en`) first'

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) walk(path.join(dir, ent.name), out)
    } else if (ent.isFile() && !SKIP_FILES.has(ent.name) && !ent.name.startsWith('.env.')) {
      out.push(path.join(dir, ent.name))
    }
  }
  return out
}

const rel = (base, file) => path.relative(base, file).split(path.sep).join('/')

function scanTree(base, label) {
  const problems = []
  for (const file of walk(base)) {
    const buf = fs.readFileSync(file)
    const r = rel(base, file)
    if (!looksLikeText(r, buf)) continue
    for (const f of scanText(buf.toString('utf8'))) {
      const id = `${label}/${r}`
      if (isAllowed(allowlist, id, f) || isAllowed(allowlist, r, f)) continue
      problems.push(`${id}:${f.line}:${f.col} [${f.rule}] ${JSON.stringify(f.match)}`)
    }
  }
  return problems
}

test('dist-en has no Russian traces (text files)', { skip: hasDist ? false : NO_DIST }, () => {
  const problems = scanTree(DIST_EN, 'dist-en')
  assert.deepEqual(problems.slice(0, 40), [], `${problems.length} Russian trace(s) in dist-en`)
})

test('site-en/engine has no Russian traces (text files)', { skip: hasEngine ? false : 'site-en/engine/ not present yet' }, () => {
  const problems = scanTree(ENGINE, 'engine')
  assert.deepEqual(problems.slice(0, 40), [], `${problems.length} Russian trace(s) in engine`)
})

test('every dist-en/**/index.html has lang="en" and a self-matching canonical', { skip: hasDist ? false : NO_DIST }, () => {
  const pages = walk(DIST_EN).filter((f) => path.basename(f) === 'index.html')
  assert.ok(pages.length > 0, 'dist-en has no index.html')
  assert.ok(pages.some((f) => path.dirname(f) === DIST_EN), 'dist-en/index.html missing')
  const problems = []
  for (const file of pages) {
    const html = fs.readFileSync(file, 'utf8')
    const r = rel(DIST_EN, file)
    if (!/<html\b[^>]*\blang=["']en(?:-[A-Za-z]+)?["']/i.test(html)) problems.push(`${r}: no lang="en" on <html>`)
    const m =
      html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i) ||
      html.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']canonical["']/i)
    if (!m) {
      problems.push(`${r}: no canonical link`)
      continue
    }
    const href = m[1]
    if (!href.startsWith(SITE_URL)) problems.push(`${r}: canonical ${href} does not start with ${SITE_URL}`)
    const dir = path.posix.dirname(r)
    const expected = (SITE_BASE + (dir === '.' ? '' : dir + '/')).replace(/\/+$/, '') || '/'
    let actual
    try {
      actual = new URL(href).pathname.replace(/\/+$/, '') || '/'
    } catch {
      problems.push(`${r}: canonical ${href} is not an absolute URL`)
      continue
    }
    if (actual !== expected) problems.push(`${r}: canonical path ${actual} != own path ${expected}`)
  }
  assert.deepEqual(problems, [])
})

test('dist-en/.htaccess exists, is clean and routes to index.php', { skip: hasDist ? false : NO_DIST }, () => {
  const file = path.join(DIST_EN, '.htaccess')
  assert.ok(fs.existsSync(file), 'dist-en/.htaccess missing (comes from site-en/public/.htaccess)')
  const txt = fs.readFileSync(file, 'utf8')
  assert.match(txt, /index\.php/, '.htaccess must route unknown paths to index.php')
  assert.match(txt, /RewriteRule/, '.htaccess must contain a RewriteRule')
  const bad = scanText(txt).filter((f) => !isAllowed(allowlist, '.htaccess', f))
  assert.deepEqual(bad.map((f) => `${f.line}: [${f.rule}] ${f.match}`), [])
})

test('RU guard: root public/.htaccess keeps the front controller rule', () => {
  const txt = fs.readFileSync(path.join(ROOT, 'public', '.htaccess'), 'utf8')
  assert.match(txt, /RewriteRule \^ index\.php/)
})

test('RU guard: build:en never targets the Russian dist/', () => {
  const cfg = fs.readFileSync(path.join(ROOT, 'site-en', 'vite.config.ts'), 'utf8')
  // the client build writes to OUT_DIR (the SSR pass uses a scratch dir under .vite)
  const m = cfg.match(/const OUT_DIR = ([^\n]+)/)
  assert.ok(m, 'OUT_DIR not found in site-en/vite.config.ts')
  assert.match(m[1], /dist-en/, `OUT_DIR must be dist-en, got: ${m[1]}`)
  assert.doesNotMatch(m[1].replace(/dist-en/g, ''), /dist\b/)
  assert.match(cfg, /outDir:\s*OUT_DIR\b/, 'client build must write to OUT_DIR')
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
  const be = pkg.scripts['build:en'] ?? ''
  assert.match(be, /site-en\/vite\.config/, 'build:en must use the site-en vite config')
  assert.doesNotMatch(be, /(?<![\w-])dist(?![\w-])/, 'build:en must not reference dist/')
  // the root vite config is the RU build
  const rootCfg = fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf8')
  assert.doesNotMatch(rootCfg, /dist-en/, 'root (RU) vite config must not touch dist-en')
})
