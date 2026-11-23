import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { HELP_META, HELP_SECTIONS, helpHref, helpSectionOf } from '../src/data/helpCenter.mjs'
import { pageTarget } from '../src/data/pageTarget.mjs'

// backlogram#961: у каждого раздела помощи своя страница /help/<id>.html,
// хаб /help.html — ликбез, консультант и оглавление.
// backlogram#962: латиница «Integram» в мета.

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const work = mkdtempSync(resolve(tmpdir(), 'help-961-'))
mkdirSync(resolve(work, 'dist'), { recursive: true })
mkdirSync(resolve(work, 'scripts'), { recursive: true })
cpSync(resolve(repo, 'scripts/lib/root-main.mjs'), resolve(work, 'scripts/lib/root-main.mjs'))
cpSync(resolve(repo, 'scripts/prerender-help.mjs'), resolve(work, 'scripts/prerender-help.mjs'))
cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
cpSync(resolve(repo, 'src/lib/dates.mjs'), resolve(work, 'src/lib/dates.mjs'))
writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
execFileSync('node', ['scripts/prerender-help.mjs'], { cwd: work })
const out = (p) => readFileSync(resolve(work, 'dist', p.replace(/^\//, '')), 'utf8')
const hub = out('/help.html')
const ldOf = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])

test('у раздела свои title ≤70 и description ≤160, все разные', () => {
  const titles = new Set([HELP_META.title])
  const descs = new Set([HELP_META.description])
  for (const s of HELP_SECTIONS) {
    assert.equal(s.path, `/help/${s.id}.html`)
    assert.ok(s.pageTitle.length <= 70, `${s.id}: title ${s.pageTitle.length}`)
    assert.ok(s.description.length <= 160, `${s.id}: description ${s.description.length}`)
    assert.ok(!titles.has(s.pageTitle) && !descs.has(s.description), `${s.id}: повтор мета`)
    titles.add(s.pageTitle)
    descs.add(s.description)
  }
})

test('страница раздела: мета, крошки, разметка, все приёмы с h2', () => {
  for (const s of HELP_SECTIONS) {
    const html = out(s.path)
    assert.match(html, new RegExp(`<link rel="canonical" href="https://ideav\\.ru${s.path.replace(/\./g, '\\.')}"`))
    assert.ok(html.includes(`<title>${s.pageTitle}</title>`), `${s.id}: title`)
    assert.ok(html.includes(`og:image" content="https://ideav.ru/og/help-${s.id}.png"`), `${s.id}: og:image`)
    assert.ok(html.includes(`<a href="${HELP_META.path}">Помощь</a>`), `${s.id}: крошка на хаб`)
    const ld = ldOf(html)
    const article = ld['@graph'].find((n) => n['@type'] === 'TechArticle')
    assert.equal(article.url, `https://ideav.ru${s.path}`)
    assert.equal(article.dateModified, HELP_META.updated)
    const crumbs = ld['@graph'].find((n) => n['@type'] === 'BreadcrumbList').itemListElement
    assert.equal(crumbs.length, 3)
    assert.equal((html.match(/<h1>/g) || []).length, 1)
    assert.equal((html.match(/<article id="(?!help-prerender)/g) || []).length, s.articles.length)
    for (const a of s.articles) assert.ok(html.includes(`<article id="${a.id}">\n      <h2>`), `${a.id}: нет h2`)
    for (const x of HELP_SECTIONS) if (x.id !== s.id) assert.ok(html.includes(`href="${x.path}"`), `${s.id} → ${x.id}`)
  }
})

test('хаб: только оглавление, ссылка на каждый раздел, мета с Integram (#962)', () => {
  for (const s of HELP_SECTIONS) assert.ok(hub.includes(`<a href="${s.path}">`), `хаб не ведёт на ${s.path}`)
  assert.ok(!/<ol><li>/.test(hub.split('id="sections"')[1] ?? ''), 'шаги приёмов попали на хаб')
  assert.match(HELP_META.title, /Integram/)
  assert.match(HELP_META.description, /Integram/)
  assert.ok(HELP_META.title.length <= 70)
  assert.ok(HELP_META.description.length <= 160)
})

test('старые якоря хаба: перезапись ссылок и редирект', () => {
  assert.equal(helpHref('/help.html#data-import-excel'), '/help/data.html#data-import-excel')
  assert.equal(helpHref('https://ideav.ru/help.html#access'), '/help/access.html')
  assert.equal(helpHref('/help.html#basics'), '/help.html#basics')
  assert.equal(helpHref('/api.html#x'), '/api.html#x')
  assert.equal(helpSectionOf('api-first-call'), 'api')
  assert.equal(helpSectionOf('basics-what'), null)
  // В текстах приёмов не осталось ссылок на якоря приёмов хаба.
  const left = JSON.stringify(HELP_SECTIONS).match(/\/help\.html#(?!basics)[a-z0-9-]+/g)
  assert.equal(left, null, `ссылки на хаб: ${left}`)
  // Редирект в <head> хаба — до остальных тегов, знает все разделы.
  const script = hub.match(/<script>\(function\(\)\{[^<]*location\.replace[^<]*<\/script>/)
  assert.ok(script, 'нет скрипта редиректа в хабе')
  for (const s of HELP_SECTIONS) assert.ok(script[0].includes(s.id), `редирект не знает ${s.id}`)
  assert.ok(hub.indexOf(script[0]) < hub.indexOf('<link rel="canonical"'))
  assert.match(read('src/pages/HelpCenter.tsx'), /helpSectionOf\(hash\)/)
})

test('внутри сайта помощи ссылки открываются в той же вкладке', () => {
  assert.equal(pageTarget('/help/data.html#x', '/help.html'), null)
  assert.equal(pageTarget('/help.html', '/help/api.html'), null)
  assert.equal(pageTarget('/help/api.html', '/help/data.html'), null)
  assert.equal(pageTarget('/api.html#x', '/help/api.html'), 'api')
  assert.equal(pageTarget('/helpdesk.html', '/help.html'), 'helpdesk')
})

test('страницы подключены: роут, чанк, sitemap, llms.txt, OG-карточки', () => {
  assert.match(read('src/router.tsx'), /path: 'help\/:section',\s*element: <HelpSection \/>/)
  assert.match(read('scripts/preload-page-chunks.mjs'), /help\\\/\[\^\/\]\+\\\.html\$\/\.test\(rel\)\) return 'HelpSection'/)
  assert.match(read('scripts/generate-og-images.mjs'), /slug: `help-\$\{s\.id\}`/)
  const sitemap = read('public/sitemap.xml')
  const llms = read('public/llms.txt')
  for (const s of HELP_SECTIONS) {
    assert.ok(sitemap.includes(`<loc>https://ideav.ru${s.path}</loc>`), `sitemap: ${s.path}`)
    assert.ok(llms.includes(`https://ideav.ru${s.path}`), `llms.txt: ${s.path}`)
  }
})
