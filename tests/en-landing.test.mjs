import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// The English site on ideav.pro must not look like a Russian site with English
// text on top: no Cyrillic, no links to .ru hosts, no Yandex services (issue
// #524). These checks run over the sources, so they do not need a build.

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const siteEn = join(root, 'site-en')

const CYRILLIC = /[Ѐ-ӿ]/

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const files = walk(siteEn).filter((f) => /\.(tsx?|css|html|php|txt|xml)$/.test(f))

test('site-en sources contain no Cyrillic', () => {
  const offenders = files.filter((f) => CYRILLIC.test(readFileSync(f, 'utf8')))
  assert.deepEqual(
    offenders.map((f) => f.replace(root + '/', '')),
    [],
    'Cyrillic found — English site text, comments and markup must be Latin only',
  )
})

test('site-en links to no .ru host and no Yandex service', () => {
  const banned = [/https?:\/\/[a-z0-9.-]+\.ru\b/i, /mc\.yandex/i, /smartcaptcha/i, /rutube/i]
  const offenders = []
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const pattern of banned) {
      if (pattern.test(text)) offenders.push(`${file.replace(root + '/', '')} → ${pattern}`)
    }
  }
  assert.deepEqual(offenders, [], 'the English site must not point at Russian hosts')
})

test('the English entry page declares English and no Russian analytics', () => {
  const html = readFileSync(join(siteEn, 'index.html'), 'utf8')
  assert.match(html, /<html lang="en">/)
  assert.ok(!html.includes('metrika'), 'no Yandex.Metrika counter on the English site')
})

// The site can be deployed to a web root or to a language subfolder (/en/,
// /cn/, /pt/ …). Anything that spells out an absolute path or URL must be
// derived from SITE_BASE/SITE_URL at build time, never hard-coded. Since the
// site became multi-page (#528), the head of every page is injected by the
// prerender step, so the template only carries placeholders.
test('the page template leaves the head and body to the prerender step', () => {
  const html = readFileSync(join(siteEn, 'index.html'), 'utf8')
  assert.match(html, /<!--app-head-->/)
  assert.match(html, /<div id="root"><!--app-html--><\/div>/)
  assert.ok(!/rel="canonical"[^>]*ideav\.pro/.test(html), 'canonical must come from SITE_URL/SITE_BASE')
  assert.ok(!/<link[^>]+hreflang/i.test(html), 'no hreflang: the English site is not an alternate of another site')
})

test('every contract route is routed and prerendered with its own meta', () => {
  const match = readFileSync(join(siteEn, 'src/match.ts'), 'utf8')
  const routes = readFileSync(join(siteEn, 'src/routes.ts'), 'utf8')
  for (const p of ['/', '/pricing', '/excel-to-app', '/ai', '/use-cases', '/knowledge-base', '/contact']) {
    assert.ok(match.includes(`'${p}':`), `match.ts must route ${p}`)
    assert.ok(routes.includes(`path: '${p}'`), `routes.ts must describe ${p}`)
  }
  assert.match(match, /compare\\\/\(airtable\|smartsheet\|notion\)/)
  assert.match(match, /\(terms\|privacy\|cookies\)/)
  // Dynamic routes come from the content modules, so new articles/use cases
  // automatically get a page and a sitemap entry.
  assert.match(routes, /articles\.map/)
  assert.match(routes, /useCases\.map/)
  const config = readFileSync(join(siteEn, 'vite.config.ts'), 'utf8')
  for (const f of ['robots.txt', 'sitemap.xml', 'llms.txt']) assert.ok(config.includes(`'${f}'`), `build must write ${f}`)
})

test('content modules follow the shared contract', () => {
  const types = readFileSync(join(siteEn, 'src/content/types.ts'), 'utf8')
  for (const name of ['Block', 'KbArticle', 'UseCase']) assert.match(types, new RegExp(`(?:interface|type) ${name}\\b`))
  assert.match(readFileSync(join(siteEn, 'src/content/kb/index.ts'), 'utf8'), /export const articles: KbArticle\[\]/)
  assert.match(readFileSync(join(siteEn, 'src/content/usecases/index.ts'), 'utf8'), /export const useCases: UseCase\[\]/)
  const blocks = readFileSync(join(siteEn, 'src/components/Blocks.tsx'), 'utf8')
  for (const t of ['h2', 'h3', 'p', 'ul', 'ol', 'quote', 'code', 'callout']) {
    assert.ok(blocks.includes(`case '${t}':`), `Blocks renderer must handle ${t}`)
  }
})

test('analytics loads only after opt-in consent and records leads with UTM', () => {
  const analytics = readFileSync(join(siteEn, 'src/lib/analytics.ts'), 'utf8')
  assert.match(analytics, /if \(readConsent\(\) !== 'granted'\) return/, 'script injection must be gated by consent')
  assert.match(analytics, /VITE_PLAUSIBLE_DOMAIN/, 'analytics domain must be configurable at build time')
  const html = readFileSync(join(siteEn, 'index.html'), 'utf8')
  assert.ok(!/plausible|googletagmanager|gtag\(/i.test(html), 'no analytics script in the static template')
  const form = readFileSync(join(siteEn, 'src/components/ContactForm.tsx'), 'utf8')
  assert.match(form, /utm: readUtm\(\)/)
  assert.match(form, /trackLead\(/)
})

test('legal pages leave the operating entity as explicit placeholders', () => {
  const legal = readFileSync(join(siteEn, 'src/data/legal.ts'), 'utf8')
  assert.match(legal, /\[Legal entity name\]/)
  assert.match(legal, /\[Governing law\]/)
})

test('the form posts relative to the deployment base', () => {
  const form = readFileSync(join(siteEn, 'src/components/ContactForm.tsx'), 'utf8')
  assert.match(form, /import\.meta\.env\.BASE_URL/)
  assert.ok(
    !/fetch\(\s*['"`]\//.test(form),
    'a root-absolute endpoint breaks the site as soon as it lives in a subfolder',
  )
})

test('the build derives base and origin from the environment', () => {
  const config = readFileSync(join(siteEn, 'vite.config.ts'), 'utf8')
  assert.match(config, /process\.env\.SITE_BASE/)
  assert.match(config, /process\.env\.SITE_URL/)
  assert.match(config, /base:\s*BASE/)
})

test('the English build ships its own .htaccess, not a copy of the ideav.ru one', () => {
  // ideav.pro runs its own engine fork (site-en/engine, issue #694), so site-en/public
  // carries an EN .htaccess. It must not be the RU root public/.htaccess (issue #422 is
  // the cautionary tale) and must carry no RU traces.
  const publicFiles = readdirSync(join(siteEn, 'public'))
  if (!publicFiles.includes('.htaccess')) return
  const en = readFileSync(join(siteEn, 'public', '.htaccess'), 'utf8')
  const ru = readFileSync(join(siteEn, '..', 'public', '.htaccess'), 'utf8')
  assert.notEqual(en, ru, 'site-en/public/.htaccess must not be the RU front controller')
  assert.doesNotMatch(en, /[Ѐ-ӿ]|ideav\.ru|\.ru\b|yandex/i, 'EN .htaccess has RU traces')
  assert.match(en, /RewriteRule \^ index\.php/, 'unknown paths go to the engine')
})
