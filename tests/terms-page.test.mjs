import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

// Соглашение об использовании перенесено на ideav.ru: раньше подвал уводил на
// чужой домен (https://integram.io/terms.html), а в public/ лежала статическая
// копия той же страницы в вёрстке старого сайта. Теперь страницу собирает сам
// сайт, а URL /terms.html сохранён — он в индексе и на нём висел self-canonical
// из #410.
//
// Тест держит перенос: текст пунктов дословный, ссылка в подвале внутренняя,
// снапшот отдаёт документ без JS, канонический адрес на месте.

const repo = new URL('..', import.meta.url).pathname
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')
const footer = readFileSync(resolve(repo, 'src/components/Footer.tsx'), 'utf8')
const router = readFileSync(resolve(repo, 'src/router.tsx'), 'utf8')
const termsData = readFileSync(resolve(repo, 'src/data/terms.mjs'), 'utf8')
const homeTitle = indexHtml.match(/<title>([\s\S]*?)<\/title>/)[1]

function makeWorkspace(prefix) {
  const work = mkdtempSync(resolve(tmpdir(), prefix))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-terms.mjs'), resolve(work, 'scripts/prerender-terms.mjs'))
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  // Оба пререндера читают данные из src/data — без них песочница падает на
  // ERR_MODULE_NOT_FOUND.
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  return work
}

test('подвал ведёт на своё /terms.html, а не на чужой домен', () => {
  assert.match(footer, /to="\/terms\.html"/)
  assert.doesNotMatch(
    footer,
    /https:\/\/integram\.io\/terms\.html/,
    'пункт «Правила использования» больше не должен уводить на integram.io',
  )
})

test('SPA знает маршрут соглашения', () => {
  assert.match(router, /path: 'terms\.html'/)
  assert.match(router, /import\('\.\/pages\/Terms'\)/)
})

test('legacy-копия страницы удалена из public/', () => {
  assert.ok(
    !existsSync(resolve(repo, 'public/terms.html')),
    'статическая копия перекрывала бы сгенерированный dist/terms.html',
  )
})

test('build прогоняет пререндер соглашения после базы знаний и до пререндера главной', () => {
  const pkg = JSON.parse(readFileSync(resolve(repo, 'package.json'), 'utf8'))
  const build = pkg.scripts.build
  assert.match(build, /prerender-terms\.mjs/)
  assert.ok(
    build.indexOf('prerender-knowledge-base.mjs') < build.indexOf('prerender-terms.mjs'),
    'пререндер соглашения должен идти после пререндера базы знаний',
  )
  assert.ok(
    build.indexOf('prerender-terms.mjs') < build.indexOf('prerender-landing.mjs'),
    'пререндер соглашения должен идти до пререндера главной (нужен чистый index.html)',
  )
})

test('текст соглашения перенесён дословно: 15 пунктов и ключевые формулировки', () => {
  assert.equal((termsData.match(/^\s{4}n: \d+,$/gm) ?? []).length, 15, 'пунктов должно быть 15')
  // Выборочные формулировки из оригинала integram.io/terms.html.
  assert.match(termsData, /Сервис предоставляется Интеграмом «как есть»/)
  assert.match(termsData, /Федеральным законом № 152-ФЗ «О персональных данных» от 27\.07\.2006 года/)
  assert.match(termsData, /не рассматривается как «спам»|Не рассматривается как «спам»/)
  // Адреса из пунктов 11 и 15 — как в оригинале.
  assert.match(termsData, /https:\/\/integram\.io\/terms\.html/)
  assert.match(termsData, /mailto:support@integram\.io/)
})

test('prerender-terms пишет crawlable dist/terms.html с текстом соглашения', () => {
  const work = makeWorkspace('terms-prerender-')

  execFileSync('node', ['scripts/prerender-terms.mjs'], { cwd: work })

  const outPath = resolve(work, 'dist/terms.html')
  assert.ok(existsSync(outPath), 'dist/terms.html должен быть создан')
  const out = readFileSync(outPath, 'utf8')

  assert.doesNotMatch(out, /<div id="root"><\/div>/, '#root не должен остаться пустым')
  assert.match(out, /<div id="root">\s*<article id="tm-prerender"/)
  assert.match(out, /<h1[^>]*>Соглашение об использовании сервиса<\/h1>/)

  // Собственный title и описание в лимитах выдачи.
  const title = out.match(/<title>([\s\S]*?)<\/title>/)[1]
  assert.notEqual(title, homeTitle, '/terms.html не должен переиспользовать title главной')
  assert.ok(title.length <= 60, `title должен быть <= 60 символов, получено ${title.length}`)
  const desc = out.match(/<meta name="description" content="([\s\S]*?)"/)[1]
  assert.ok(desc.length <= 158, `description должен быть <= 158 символов, получено ${desc.length}`)

  // Self-canonical — то, чего требовал Яндекс.Вебмастер в #410.
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/terms\.html" \/>/)
  const head = out.slice(0, out.indexOf('</head>'))
  assert.ok(head.includes('rel="canonical"'), 'canonical должен быть внутри <head>')
  assert.match(out, /"@type":"WebPage"/)

  // Все 15 пунктов на месте, ссылки из 11-го и 15-го развёрнуты.
  assert.equal((out.match(/<li id="p\d+">/g) ?? []).length, 15)
  assert.match(out, /<a href="https:\/\/integram\.io\/terms\.html">integram\.io\/terms\.html<\/a>/)
  assert.match(out, /<a href="mailto:support@integram\.io">support@integram\.io<\/a>/)
  assert.match(out, /Политика обработки персональных данных/)
})

test('prerender-terms не трогает dist/index.html', () => {
  const work = makeWorkspace('terms-prerender-home-')
  const before = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  execFileSync('node', ['scripts/prerender-terms.mjs'], { cwd: work })
  const after = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  assert.equal(before, after, 'оболочка главной должна остаться нетронутой')
})

test('prerender-terms падает, если запущен после пререндера главной', () => {
  const work = makeWorkspace('terms-prerender-order-')
  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  assert.throws(
    () => execFileSync('node', ['scripts/prerender-terms.mjs'], { cwd: work, stdio: 'pipe' }),
    /Command failed/,
    'запуск после пререндера главной должен падать громко',
  )
})

test('React-страница и снапшот берут текст из общего источника src/data/terms.mjs', () => {
  const page = readFileSync(resolve(repo, 'src/pages/Terms.tsx'), 'utf8')
  const script = readFileSync(resolve(repo, 'scripts/prerender-terms.mjs'), 'utf8')
  assert.match(page, /from '\.\.\/data\/terms'/)
  assert.match(script, /from '\.\.\/src\/data\/terms\.mjs'/)
})
