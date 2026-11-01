// issue #823 — лендинг стал сайтом из трёх основных разделов: «заменить
// Excel», «автоматизация бизнеса», «разработчикам». Выбор — сразу на первом
// экране главной, реклама ведёт прямо на страницу раздела, поэтому у каждой
// страницы свой сырой HTML (title, H1, canonical, JSON-LD) и она вшита в сайт:
// роутер, сборка, .htaccess, sitemap, llms.txt, меню.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { SITE_SECTIONS } from '../src/data/siteSections.mjs'
import { SERVICES } from '../src/data/services.mjs'
import { headerNavLinks, staticNavLinks } from '../src/data/nav.mjs'

// fileURLToPath, а не url.pathname: pathname на Windows даёт «/C:/…».
const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')
const SLUGS = ['zamena-excel', 'avtomatizaciya-biznesa', 'razrabotchikam']

function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'issue-823-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-site-sections.mjs'), resolve(work, 'scripts/prerender-site-sections.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
  execFileSync('node', ['scripts/prerender-site-sections.mjs'], { cwd: work })
  return Object.fromEntries(SLUGS.map((s) => [s, readFileSync(resolve(work, `dist/${s}.html`), 'utf8')]))
}
const out = prerender()

test('ровно три раздела в порядке скриншота из issue', () => {
  assert.deepEqual(SITE_SECTIONS.map((s) => s.slug), SLUGS)
  assert.deepEqual(SITE_SECTIONS.map((s) => s.choice), [
    'Мне нужно заменить Excel',
    'Мне нужна автоматизация бизнеса',
    'Я разработчик или интегратор',
  ])
})

test('у каждого раздела своё целевое действие', () => {
  const ctas = SITE_SECTIONS.map((s) => s.cta.href)
  assert.equal(new Set(ctas).size, 3, 'целевые действия разделов не должны совпадать')
  assert.equal(SITE_SECTIONS[0].cta.href, '/excel-to-app.html')
  assert.equal(SITE_SECTIONS[1].cta.href, '/#cta')
  assert.match(SITE_SECTIONS[2].cta.href, /start\.html#reg$/)
})

test('карточки разделов ведут на существующие страницы и услуги', () => {
  const sitemap = read('public/sitemap.xml')
  for (const s of SITE_SECTIONS) {
    for (const l of s.blocks.flatMap((b) => b.links)) {
      if (l.external || l.href.startsWith('/#')) continue
      assert.ok(sitemap.includes(`<loc>https://ideav.ru${l.href}</loc>`), `${s.slug}: ${l.href} нет в sitemap`)
    }
    for (const id of s.pricing ?? []) assert.ok(SERVICES.some((x) => x.id === id), `${s.slug}: нет услуги ${id}`)
  }
})

test('сырой HTML раздела: title, description, один H1, canonical, JSON-LD', () => {
  for (const s of SITE_SECTIONS) {
    const html = out[s.slug]
    assert.ok(s.seoTitle.length <= 60, `${s.slug}: title ${s.seoTitle.length} симв.`)
    assert.ok(s.metaDescription.length <= 250, `${s.slug}: description ${s.metaDescription.length} симв.`)
    assert.ok(html.includes(`<title>${s.seoTitle}</title>`))
    assert.ok(html.includes(`<link rel="canonical" href="https://ideav.ru/${s.slug}.html" />`))
    assert.equal(html.match(/<h1[\s>]/g)?.length, 1, `${s.slug}: H1 должен быть один`)
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, '<'))
    const types = ld['@graph'].map((n) => n['@type'])
    assert.deepEqual(types, ['WebPage', 'FAQPage', 'BreadcrumbList'])
    assert.equal(ld['@graph'][1].mainEntity.length, s.faq.length)
    // Два других раздела — ссылками внизу страницы.
    for (const o of SITE_SECTIONS.filter((x) => x !== s)) assert.ok(html.includes(`href="/${o.slug}.html"`))
  }
})

test('раздел вшит в сайт: роутер, сборка, .htaccess, sitemap, llms.txt', () => {
  assert.match(read('src/router.tsx'), /SITE_SECTIONS\.flatMap/)
  const build = JSON.parse(read('package.json')).scripts.build
  assert.ok(build.indexOf('prerender-site-sections') > 0)
  assert.ok(build.indexOf('prerender-site-sections') < build.indexOf('prerender-landing'), 'до prerender-landing')
  const htaccess = read('public/.htaccess')
  const rule = htaccess.indexOf('RewriteRule ^(zamena-excel|avtomatizaciya-biznesa|razrabotchikam)/?$ /$1.html [R=301,L]')
  assert.ok(rule > 0, 'нет 301 без расширения')
  assert.ok(rule < htaccess.indexOf('RewriteRule ^ index.php [L,QSA]'), 'правило должно стоять до front controller')
  const sitemap = read('public/sitemap.xml')
  const llms = read('public/llms.txt')
  for (const slug of SLUGS) {
    assert.ok(sitemap.includes(`<loc>https://ideav.ru/${slug}.html</loc>`), `${slug} нет в sitemap`)
    assert.ok(llms.includes(`(https://ideav.ru/${slug}.html)`), `${slug} нет в llms.txt`)
  }
})

test('выбор раздела — на первом экране главной и в шапке', () => {
  const home = read('src/pages/Home.tsx')
  const hero = home.slice(home.indexOf('id="hero"'), home.indexOf('id="excel-promo"'))
  assert.match(hero, /SITE_SECTIONS\.map/, 'карточки разделов должны стоять в hero')
  assert.deepEqual(headerNavLinks.slice(0, 3).map((l) => l.href), SLUGS.map((s) => `/${s}.html`))
  const nav = staticNavLinks().map((l) => l.href)
  for (const slug of SLUGS) assert.ok(nav.includes(`/${slug}.html`))
  const landing = read('scripts/prerender-landing.mjs')
  assert.match(landing, /routesHtml/)
})
