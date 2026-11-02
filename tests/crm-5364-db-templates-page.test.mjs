import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { DBT_META, DBT_CATALOG, DBT_CREATE, DBT_OWN, DBT_CTA, DBT_RELATED } from '../src/data/dbTemplates.mjs'
import { SANDBOX_URL, CONTACTS, SITE_SECTIONS } from '../src/data/siteSections.mjs'
import { DOCS_RING } from '../src/data/docsRing.mjs'
import { footerNavGroups } from '../src/data/nav.mjs'

// ideav/crm#5364: каталог шаблонов баз на /shablony-reshenij.html
// (не /templates: путь на проде занят папкой движка).

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')
const indexHtml = read('index.html')

function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'db-templates-prerender-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-db-templates.mjs'), resolve(work, 'scripts/prerender-db-templates.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  execFileSync('node', ['scripts/prerender-db-templates.mjs'], { cwd: work })
  const path = resolve(work, 'dist/shablony-reshenij.html')
  assert.ok(existsSync(path), 'нет dist/shablony-reshenij.html')
  return readFileSync(path, 'utf8')
}

test('данные: путь, каталог и ссылки', () => {
  assert.equal(DBT_META.path, '/shablony-reshenij.html')
  assert.ok(DBT_CATALOG.length >= 1)
  const cm = DBT_CATALOG.find((t) => t.id === 'cm')
  assert.ok(cm, 'нет шаблона «Сопоставление каталогов»')
  assert.ok(cm.links.some((l) => l.href === '/catalog-matching.html'))
  assert.ok(cm.links.some((l) => l.href === 'https://integram.io/partners.html'))
  for (const t of DBT_CATALOG) for (const f of ['id', 'name', 'audience', 'task']) assert.ok(t[f], `${t.id}: нет ${f}`)
  assert.equal(new Set(DBT_CATALOG.map((t) => t.id)).size, DBT_CATALOG.length, 'id шаблонов не уникальны')
})

test('CTA и вход ведут в песочницу и к контакту из siteSections', () => {
  assert.ok(DBT_CREATE.steps.some((s) => s.link?.href === SANDBOX_URL))
  assert.ok(DBT_CTA.some((c) => c.href === SANDBOX_URL))
  assert.ok(DBT_CTA.some((c) => c.href === CONTACTS.telegram.href))
  assert.ok(DBT_OWN.steps.length === 4 && DBT_CREATE.steps.length === 4)
  assert.ok(DBT_RELATED.links.some((l) => l.href === '/razrabotchikam.html'))
})

test('маршрут, редирект, sitemap, сборка, подвал и раздел разработчикам знают страницу', () => {
  const router = read('src/router.tsx')
  const htaccess = read('public/.htaccess')
  const build = JSON.parse(read('package.json')).scripts.build
  assert.match(router, /path: 'shablony-reshenij\.html'/)
  assert.match(router, /path: 'shablony-reshenij'/)
  assert.match(router, /import\('\.\/pages\/DbTemplates'\)/)
  assert.match(htaccess, /^\s*RewriteRule \^shablony-reshenij\/\?\$ \/shablony-reshenij\.html \[R=301,L\]/m)
  assert.ok(htaccess.indexOf('^shablony-reshenij/?$') < htaccess.search(/^\s*RewriteRule \^ index\.php/m))
  assert.match(read('public/sitemap.xml'), /<loc>https:\/\/ideav\.ru\/shablony-reshenij\.html<\/loc>/)
  assert.ok(build.includes('prerender-db-templates.mjs'))
  assert.ok(build.indexOf('prerender-db-templates.mjs') < build.indexOf('prerender-landing.mjs'))
  assert.ok(footerNavGroups.flatMap((g) => g.links).some((l) => l.href === '/shablony-reshenij.html'))
  const dev = SITE_SECTIONS.find((s) => s.slug === 'razrabotchikam')
  const links = dev.blocks.find((b) => b.type === 'links').links
  assert.ok(links.some((l) => l.href === '/shablony-reshenij.html'))
  assert.ok(read('scripts/generate-og-images.mjs').includes("slug: 'shablony-reshenij'"))
})

test('страницы нет в кольце «См. также» справочников', () => {
  assert.ok(!DOCS_RING.some((d) => d.href === DBT_META.path))
})

test('пререндер несёт каталог, шаги, ограничения и мета-теги', () => {
  const out = prerender()
  assert.match(out, /<div id="root">\s*<article id="db-templates-prerender"/)
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/shablony-reshenij\.html" \/>/)
  assert.match(out, /<title>[^<]*Шаблоны решений/)
  assert.ok(out.includes(`content="${DBT_META.description}"`))
  assert.match(out, /<h1>Шаблоны решений<\/h1>/)
  for (const t of DBT_CATALOG) assert.ok(out.includes(t.name))
  for (const s of ['Как создать базу из шаблона', 'Свой шаблон', 'Что важно знать', 'Зафиксировать версию']) {
    assert.ok(out.includes(s), `нет «${s}»`)
  }
  assert.ok(out.includes('href="/catalog-matching.html"'))
  assert.ok(out.includes('href="https://integram.io/partners.html"'))
  assert.ok(!out.includes('&nbsp;') && !out.includes(' '), 'неразрывные пробелы ставит постпроход, не пререндер')
})
