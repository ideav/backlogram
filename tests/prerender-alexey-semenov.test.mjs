/**
 * Issue #553 — персональная страница с контактами `/alexey-semenov.html`.
 *
 * Страница заводится не ради SEO, а ради конкретного требования площадки: в профиле
 * должна стоять ссылка на ПЕРСОНАЛЬНУЮ страницу с контактами, а не на лендинг с
 * услугами. Отсюда и проверки: страница обязана открываться сама по себе (не
 * SPA-фолбэком главной), нести имя, контакты и разметку Person — и НЕ нести
 * признаков лендинга (цены, тарифы, «купить»).
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const repo = new URL('..', import.meta.url).pathname
const scriptSrc = readFileSync(resolve(repo, 'scripts/prerender-alexey-semenov.mjs'), 'utf8')
const pageSrc = readFileSync(resolve(repo, 'src/pages/AlexeySemenov.tsx'), 'utf8')
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')
const landingScript = resolve(repo, 'scripts/prerender-landing.mjs')

const homeTitle = indexHtml.match(/<title>([\s\S]*?)<\/title>/)[1]

function makeWorkspace(prefix) {
  const work = mkdtempSync(resolve(tmpdir(), prefix))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(
    resolve(repo, 'scripts/prerender-alexey-semenov.mjs'),
    resolve(work, 'scripts/prerender-alexey-semenov.mjs'),
  )
  cpSync(landingScript, resolve(work, 'scripts/prerender-landing.mjs'))
  // Пререндер главной читает src/data (usecases + FAQ) — без них песочница падает (#495).
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  return work
}

test('build pipeline runs the personal-page prerender after the KB one and before the landing one', () => {
  const build = JSON.parse(readFileSync(resolve(repo, 'package.json'), 'utf8')).scripts.build
  assert.match(build, /prerender-alexey-semenov\.mjs/)
  assert.ok(
    build.indexOf('prerender-knowledge-base.mjs') < build.indexOf('prerender-alexey-semenov.mjs'),
    'personal page prerender must run after the knowledge base prerender',
  )
  assert.ok(
    build.indexOf('prerender-alexey-semenov.mjs') < build.indexOf('prerender-landing.mjs'),
    'personal page prerender must run before the landing prerender (clean index.html template)',
  )
})

test('the SPA route exists — without it the .html file and the app would disagree', () => {
  const router = readFileSync(resolve(repo, 'src/router.tsx'), 'utf8')
  assert.match(router, /alexey-semenov\.html/)
  assert.match(router, /AlexeySemenov/)
})

test('prerender writes a crawlable dist/alexey-semenov.html with its own, non-home title', () => {
  const work = makeWorkspace('personal-prerender-')
  execFileSync('node', ['scripts/prerender-alexey-semenov.mjs'], { cwd: work })

  const outPath = resolve(work, 'dist/alexey-semenov.html')
  assert.ok(existsSync(outPath), 'dist/alexey-semenov.html must be created')
  const out = readFileSync(outPath, 'utf8')

  assert.doesNotMatch(out, /<div id="root"><\/div>/, '#root must not be left empty')
  assert.match(out, /<div id="root">\s*<article id="as-prerender"/)
  assert.match(out, /<h1[^>]*>Алексей Семёнов<\/h1>/)

  const title = out.match(/<title>([\s\S]*?)<\/title>/)[1]
  assert.notEqual(title, homeTitle, 'the personal page must not reuse the home page title')
  assert.match(title, /Алексей Семёнов/)
  assert.ok(title.length <= 60, `title should be <= 60 chars, got ${title.length}`)

  const desc = out.match(/<meta name="description" content="([\s\S]*?)"/)[1]
  assert.ok(desc.length <= 158, `description should be <= 158 chars, got ${desc.length}`)

  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/alexey-semenov\.html" \/>/)
  assert.match(out, /<meta property="og:type" content="profile" \/>/)
})

test('the page carries the contacts — that is the whole reason it exists (#553)', () => {
  const work = makeWorkspace('personal-prerender-contacts-')
  execFileSync('node', ['scripts/prerender-alexey-semenov.mjs'], { cwd: work })
  const out = readFileSync(resolve(work, 'dist/alexey-semenov.html'), 'utf8')

  assert.match(out, /href="https:\/\/t\.me\/qdmadept"/, 'Telegram contact must be present')
  assert.match(out, /href="mailto:abc@integram\.io"/, 'email contact must be present')
  assert.match(out, /href="tel:\+79955060167"/, 'phone contact must be present')

  // Разметка Person — ею площадка и поисковик отличают персональную страницу от лендинга.
  assert.match(out, /"@type":"Person"/)
  assert.match(out, /"name":"Алексей Семёнов"/)
  assert.match(out, /"@type":"ProfilePage"/)

  // Те же контакты обязаны быть и в React-версии страницы, иначе снимок и приложение разойдутся.
  assert.match(pageSrc, /qdmadept/)
  assert.match(pageSrc, /abc@integram\.io/)
  assert.match(pageSrc, /\+79955060167/)
})

test('the page is personal, not a landing: no prices, tariffs or buy-now calls (#553)', () => {
  const work = makeWorkspace('personal-prerender-tone-')
  execFileSync('node', ['scripts/prerender-alexey-semenov.mjs'], { cwd: work })
  const snapshot = readFileSync(resolve(work, 'dist/alexey-semenov.html'), 'utf8')
    .match(/<article id="as-prerender">[\s\S]*?<\/article>/)[0]

  // Комментарии из проверки убираем: они ОПИСЫВАЮТ запрет («ни призывов купить»), и без
  // вычистки тест ловил бы собственную формулировку правила вместо текста страницы.
  const pageVisible = pageSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  for (const banned of [/тариф/i, /\bцен[аыу]\b/i, /купить/i, /оставить заявку/i, /руб/i, /₽/]) {
    assert.doesNotMatch(snapshot, banned, `personal page must not read as a sales landing: ${banned}`)
    assert.doesNotMatch(pageVisible, banned, `personal page must not read as a sales landing: ${banned}`)
  }
})

test('prerender does not mutate dist/index.html (home page)', () => {
  const work = makeWorkspace('personal-prerender-home-')
  const before = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  execFileSync('node', ['scripts/prerender-alexey-semenov.mjs'], { cwd: work })
  const after = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  assert.equal(before, after, 'the home page shell must stay untouched')
})

test('prerender refuses to run after the landing prerender patched index.html', () => {
  const work = makeWorkspace('personal-prerender-order-')
  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  assert.throws(
    () => execFileSync('node', ['scripts/prerender-alexey-semenov.mjs'], { cwd: work, stdio: 'pipe' }),
    /Command failed/,
    'running after the landing prerender must fail loudly',
  )
})

test('script documents its required position in the build pipeline', () => {
  assert.match(scriptSrc, /ПОСЛЕ prerender-knowledge-base\.mjs и ДО prerender-landing\.mjs/)
})
