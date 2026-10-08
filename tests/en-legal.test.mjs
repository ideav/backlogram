import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Legal pack of the English site (refs #531, #524): eight documents, each a
// prerendered route in the sitemap and the footer, operator details only via
// build-time config, GPC honored, sign-up states the Terms/Privacy links.

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const siteEn = join(root, 'site-en')
const legalDir = join(siteEn, 'src/data/legal')
const dist = join(root, 'dist-en')
const hasDist = existsSync(join(dist, 'sitemap.xml'))
const read = (p) => readFileSync(p, 'utf8')

const SLUGS = ['terms', 'privacy', 'cookies', 'dpa', 'subprocessors', 'acceptable-use', 'copyright', 'security']
const PLACEHOLDERS = {
  VITE_LEGAL_ENTITY_NAME: '[Legal entity name]',
  VITE_LEGAL_ADDRESS: '[Registered address]',
  VITE_LEGAL_COMPANY_NUMBER: '[Company number]',
  VITE_LEGAL_GOVERNING_LAW: '[Governing law]',
  VITE_LEGAL_VENUE: '[Venue]',
  VITE_LEGAL_EU_REP: '[EU representative]',
  VITE_LEGAL_UK_REP: '[UK representative]',
  VITE_LEGAL_PRIVACY_EMAIL: '[Contact email for privacy]',
  VITE_LEGAL_COPYRIGHT_AGENT: '[Designated copyright agent]',
  VITE_LEGAL_HOSTING_PROVIDER: '[Hosting provider]',
  VITE_LEGAL_HOSTING_LOCATION: '[Hosting location]',
  VITE_LEGAL_PAYMENT_PROCESSOR: '[Payment processor]',
  VITE_LEGAL_PAYMENT_LOCATION: '[Payment processor location]',
  VITE_LEGAL_ARBITRATION_PROVIDER: '[Arbitration provider]',
  VITE_LEGAL_BACKUPS: '[Backup frequency and storage location]',
  VITE_LEGAL_LOG_RETENTION: '[Log retention period]',
}

test('every legal document is routed, listed in the footer and in llms.txt', () => {
  const match = read(join(siteEn, 'src/match.ts'))
  const layout = read(join(siteEn, 'src/components/Layout.tsx'))
  const config = read(join(siteEn, 'vite.config.ts'))
  const index = read(join(legalDir, 'index.ts'))
  for (const slug of SLUGS) {
    assert.match(match, new RegExp(`[(|]${slug}[|)]`), `match.ts must route /${slug}`)
    assert.ok(layout.includes(`path: '/${slug}'`), `footer must link /${slug}`)
    assert.ok(config.includes(`line('/${slug}')`), `llms.txt must list /${slug}`)
  }
  assert.match(index, /export const LEGAL: LegalDoc\[\] = \[TERMS, PRIVACY, COOKIES, DPA, SUBPROCESSORS, ACCEPTABLE_USE, COPYRIGHT, SECURITY\]/)
  assert.match(layout, /Cookie settings/, 'footer keeps a "Cookie settings" control')
  assert.match(layout, /integram-open-consent/, '"Cookie settings" reopens the banner')
})

test('operator details are placeholders that come only from the config module', () => {
  const cfg = read(join(legalDir, 'config.ts'))
  for (const [envName, ph] of Object.entries(PLACEHOLDERS)) {
    assert.ok(cfg.includes(`env.${envName}, '${ph}'`), `config.ts must default ${envName} to ${ph}`)
  }
  for (const f of readdirSync(legalDir).filter((n) => n.endsWith('.ts') && n !== 'config.ts')) {
    const src = read(join(legalDir, f))
    for (const ph of Object.values(PLACEHOLDERS)) {
      assert.ok(!src.includes(ph), `${f} spells ${ph} literally; read it from LEGAL_CONFIG instead`)
    }
  }
})

test('legal texts do not name a country of the operator', () => {
  const all = readdirSync(legalDir).map((f) => read(join(legalDir, f))).join('\n')
  for (const word of ['Russia', 'Delaware', 'Ireland', 'Estonia', 'Cyprus', 'England and Wales', 'Belarus', 'Kazakhstan']) {
    assert.ok(!all.includes(word), `legal texts must not mention ${word}`)
  }
})

test('Global Privacy Control is treated as declining analytics', () => {
  const analytics = read(join(siteEn, 'src/lib/analytics.ts'))
  assert.match(analytics, /navigator\.globalPrivacyControl === true/)
  assert.match(analytics, /export function readConsent\(\): Consent \| null \{\s*if \(gpcEnabled\(\)\) return 'denied'/)
  const banner = read(join(siteEn, 'src/components/CookieBanner.tsx'))
  assert.match(banner, /!gpcEnabled\(\) && readConsent\(\) === null/, 'banner must not auto-open under GPC')
  const utm = read(join(siteEn, 'src/lib/utm.ts'))
  assert.match(utm, /if \(readConsent\(\) !== 'granted'\) return/, 'campaign attribution needs consent')
})

test('sign-up states the Terms and Privacy links and keeps the agree checkbox', () => {
  const start = read(join(siteEn, 'engine/start.php'))
  assert.match(start, /By signing up you agree to the <a href="\/terms"[^>]*>Terms of Service<\/a> and acknowledge the <a href="\/privacy"[^>]*>Privacy Policy<\/a>/)
  assert.match(start, /<input type="checkbox" name="agree" value="1" required>/)
})

test('dist: every legal page is prerendered with "Last updated" and listed in the sitemap', { skip: hasDist ? false : 'dist-en/ not built' }, () => {
  const sitemap = read(join(dist, 'sitemap.xml'))
  for (const slug of SLUGS) {
    const file = join(dist, slug, 'index.html')
    assert.ok(existsSync(file), `dist-en/${slug}/index.html missing`)
    const html = read(file)
    assert.match(html, /Last updated: (?:<!-- -->)?[A-Z][a-z]+ \d{1,2}, \d{4}/, `/${slug} must show "Last updated"`)
    assert.match(html, /<h1[^>]*>/, `/${slug} must be prerendered`)
    assert.match(sitemap, new RegExp(`<loc>[^<]*/${slug}</loc>`), `sitemap must list /${slug}`)
  }
})
